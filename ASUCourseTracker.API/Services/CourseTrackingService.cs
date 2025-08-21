using ASUCourseTracker.API.Data;
using ASUCourseTracker.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ASUCourseTracker.API.Services;

namespace ASUCourseTracker.API.Services
{
    public class CourseTrackingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CourseTrackingService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(10);

        public CourseTrackingService(
            IServiceProvider serviceProvider,
            ILogger<CourseTrackingService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckCourseAvailability();
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking course availability");
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }
        }

        private async Task CheckCourseAvailability()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var trackedCourses = await context.UserCourses
                .Include(uc => uc.Course)
                .Include(uc => uc.User)
                .ToListAsync();

            foreach (var trackedCourse in trackedCourses)
            {
                try
                {
                    var currentSeats = await GetCurrentSeatsFromASU(trackedCourse.Course.Number);

                    // Always update LastUpdated to show when the course was last checked
                    trackedCourse.Course.LastUpdated = DateTime.UtcNow;

                    if (currentSeats != trackedCourse.Course.SeatsOpen)
                    {
                        var oldSeats = trackedCourse.Course.SeatsOpen;
                        trackedCourse.Course.SeatsOpen = currentSeats;

                        _logger.LogInformation($"Seats changed for course {trackedCourse.Course.Number}: {oldSeats} -> {currentSeats}");

                        // Only send notification if seats increased (more seats became available)
                        if (HasSeatsIncreased(oldSeats, currentSeats))
                        {
                            _logger.LogInformation($"Seats increased for course {trackedCourse.Course.Number} - sending notification");
                            await SendSeatChangeNotification(trackedCourse, oldSeats, currentSeats);
                        }
                        else
                        {
                            _logger.LogDebug($"Seats decreased or same for course {trackedCourse.Course.Number} - no notification sent");
                        }
                    }
                    else
                    {
                        _logger.LogDebug($"No seat change for course {trackedCourse.Course.Number}: {currentSeats}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error checking course {trackedCourse.Course.Number}");
                    
                    // Still update LastUpdated even if there was an error, 
                    // so users know the system attempted to check the course
                    trackedCourse.Course.LastUpdated = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync();
        }

        private async Task<string> GetCurrentSeatsFromASU(string courseNumber)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var hybridService = scope.ServiceProvider.GetRequiredService<HybridCourseService>();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                // Get the semester from the database for this course
                var course = await context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);
                var semester = course?.Semester ?? "2257"; // Use existing semester or default
                
                var seats = await hybridService.GetCurrentSeatsAsync(courseNumber, semester);
                
                if (!string.IsNullOrEmpty(seats))
                {
                    _logger.LogInformation($"Retrieved seats info for {courseNumber}: {seats}");
                    return seats;
                }
                
                return "Seats information not available";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seats for course {courseNumber} from ASU API");
                return "Error retrieving seats";
            }
        }

        /// <summary>
        /// Check if the number of available seats has increased
        /// Parses seat strings like "3 of 30 open seats" to compare available seat counts
        /// </summary>
        private bool HasSeatsIncreased(string oldSeats, string newSeats)
        {
            try
            {
                var oldAvailable = ExtractAvailableSeats(oldSeats);
                var newAvailable = ExtractAvailableSeats(newSeats);
                
                if (oldAvailable.HasValue && newAvailable.HasValue)
                {
                    bool increased = newAvailable.Value > oldAvailable.Value;
                    _logger.LogDebug($"Seat comparison: {oldAvailable} -> {newAvailable} (increased: {increased})");
                    return increased;
                }
                
                // If we can't parse the numbers, assume it's worth notifying to be safe
                _logger.LogWarning($"Could not parse seat numbers for comparison: '{oldSeats}' vs '{newSeats}'");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error comparing seat counts: '{oldSeats}' vs '{newSeats}'");
                return true; // Default to sending notification if there's an error
            }
        }

        /// <summary>
        /// Extract the number of available seats from a string like "3 of 30 open seats"
        /// </summary>
        private int? ExtractAvailableSeats(string seatsString)
        {
            if (string.IsNullOrEmpty(seatsString))
                return null;

            try
            {
                // Handle formats like "3 of 30 open seats", "0 of 120 open seats", etc.
                var parts = seatsString.Split(' ');
                if (parts.Length >= 1 && int.TryParse(parts[0], out int availableSeats))
                {
                    return availableSeats;
                }

                // Handle other possible formats
                // If format changes, we can add more parsing logic here
                _logger.LogWarning($"Unexpected seat string format: '{seatsString}'");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error parsing seat string: '{seatsString}'");
                return null;
            }
        }

        private async Task SendSeatChangeNotification(UserCourse trackedCourse, string oldSeats, string newSeats)
        {
            try
            {
                if (!string.IsNullOrEmpty(trackedCourse.User.ExpoPushToken))
                {
                    using var scope = _serviceProvider.CreateScope();
                    var expoNotificationService = scope.ServiceProvider.GetRequiredService<ExpoNotificationService>();
                    
                    bool success = await expoNotificationService.SendCourseNotificationAsync(
                        trackedCourse.User,
                        trackedCourse.Course.CourseCode ?? trackedCourse.Course.Number,
                        oldSeats,
                        newSeats
                    );

                    if (success)
                    {
                        _logger.LogInformation($"Expo push notification sent to user {trackedCourse.User.Email} for course {trackedCourse.Course.Number}");
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to send Expo push notification to user {trackedCourse.User.Email}");
                    }
                }
                else
                {
                    _logger.LogWarning($"No Expo push token for user {trackedCourse.User.Email} - notification not sent");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification for course {trackedCourse.Course.Number}");
            }
        }
    }
}