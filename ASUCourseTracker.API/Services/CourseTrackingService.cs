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

                    if (currentSeats != trackedCourse.Course.SeatsOpen)
                    {
                        var oldSeats = trackedCourse.Course.SeatsOpen;
                        trackedCourse.Course.SeatsOpen = currentSeats;
                        trackedCourse.Course.LastUpdated = DateTime.UtcNow;

                        _logger.LogInformation($"Seats changed for course {trackedCourse.Course.Number}: {oldSeats} -> {currentSeats}");

                        // TODO: Send push notification here when seats change
                        await SendSeatChangeNotification(trackedCourse, oldSeats, currentSeats);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error checking course {trackedCourse.Course.Number}");
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



        private async Task SendSeatChangeNotification(UserCourse trackedCourse, string oldSeats, string newSeats)
        {
            try
            {
                // TODO: Implement push notification logic here
                // This is where you'll integrate with Firebase Cloud Messaging

                _logger.LogInformation($"Would send notification to user {trackedCourse.User.Email} about course {trackedCourse.Course.Number}: seats changed from {oldSeats} to {newSeats}");

                // Placeholder for push notification logic
                // await _firebaseService.SendNotificationAsync(trackedCourse.User, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification for course {trackedCourse.Course.Number}");
            }
        }
    }
}