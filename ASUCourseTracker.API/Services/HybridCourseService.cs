using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using ASUCourseTracker.API.Models;

namespace ASUCourseTracker.API.Services
{
    public class HybridCourseService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<HybridCourseService> _logger;
        private readonly string _asuApiBaseUrl = "https://api.myasuplat-dpl.asu.edu/api/class";
        private readonly string _catalogBaseUrl = "https://catalog.apps.asu.edu/catalog/classes/classlist";

        public HybridCourseService(HttpClient httpClient, ILogger<HybridCourseService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<Course?> GetCourseWithSeatsAsync(string courseNumber, string? semester = null)
        {
            try
            {
                var strm = semester ?? "2257"; // Use provided semester or default to current
                
                _logger.LogInformation($"Starting hybrid approach for course {courseNumber} with semester {strm}");
                
                // Step 1: Get course details from ASU API (fast, reliable)
                var classInfo = await GetClassInfoFromAPIAsync(strm, courseNumber);
                if (classInfo == null)
                {
                    _logger.LogWarning($"Could not retrieve class info for {courseNumber} from ASU API");
                    return null;
                }

                _logger.LogInformation($"API call successful for {courseNumber}. Subject: '{classInfo.subject}', CatalogNumber: '{classInfo.catalogNumber}', DisplayTitle: '{classInfo.displayTitle}', Description: '{classInfo.description}'");

                // Step 2: Get real-time seats from catalog page (minimal scraping)
                var seatsInfo = await GetSeatsFromCatalogAsync(courseNumber, strm);
                _logger.LogInformation($"Seats scraping result for {courseNumber}: {seatsInfo}");
                
                // Step 3: Combine both sources of information
                var course = CombineCourseInfo(classInfo, seatsInfo, courseNumber, strm);
                
                _logger.LogInformation($"Successfully created course object for {courseNumber}: Title='{course.Title}', Instructor='{course.Instructor}', CourseCode='{course.CourseCode}', Semester='{course.Semester}'");
                return course;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting course {courseNumber} with hybrid approach");
                return null;
            }
        }

        private async Task<ASUClassResponse?> GetClassInfoFromAPIAsync(string strm, string classNumber)
        {
            try
            {
                var url = $"{_asuApiBaseUrl}/{strm}/{classNumber}?include=instructor";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"ASU API returned {response.StatusCode} for class {classNumber}");
                    return null;
                }

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Raw API response for {classNumber}: {jsonContent}");
                
                var classInfo = JsonSerializer.Deserialize<ASUClassResponse>(jsonContent);

                if (classInfo != null)
                {
                    _logger.LogInformation($"Successfully fetched course details from API for {classNumber}: Subject={classInfo.subject}, CatalogNumber={classInfo.catalogNumber}, Title={classInfo.displayTitle}");
                }

                return classInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching course details from API for {classNumber}");
                return null;
            }
        }

        private async Task<string> GetSeatsFromCatalogAsync(string courseNumber, string semester)
        {
            try
            {
                using var playwright = await Playwright.CreateAsync();
                await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
                {
                    Headless = true,
                    Args = new[] { "--no-sandbox", "--disable-dev-shm-usage" }
                });

                var page = await browser.NewPageAsync();
                var url = $"{_catalogBaseUrl}?keywords={courseNumber}&searchType=all&term={semester}";

                _logger.LogInformation($"Fetching seats info from catalog: {url}");

                await page.GotoAsync(url);
                await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

                // Wait for the seats element to appear (much faster than before)
                try
                {
                    await page.WaitForSelectorAsync("div.class-results-cell.seats", new PageWaitForSelectorOptions
                    {
                        Timeout = 5000 // Reduced timeout since we only need seats
                    });
                }
                catch (TimeoutException)
                {
                    _logger.LogWarning($"Timeout waiting for seats element for {courseNumber}");
                    return "Seats information not available";
                }

                // Get just the seats information
                var seatsElement = await page.QuerySelectorAsync("div.class-results-cell.seats");
                if (seatsElement != null)
                {
                    var seatsText = await seatsElement.TextContentAsync();
                    if (!string.IsNullOrEmpty(seatsText))
                    {
                        _logger.LogInformation($"Successfully scraped seats info for {courseNumber}: {seatsText}");
                        return seatsText.Trim();
                    }
                }

                return "Seats information not available";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error scraping seats for course {courseNumber}");
                return "Error retrieving seats";
            }
        }

        private Course CombineCourseInfo(ASUClassResponse classInfo, string seatsInfo, string courseNumber, string strm)
        {
            _logger.LogInformation($"Combining course info for {courseNumber}. Raw data: Subject='{classInfo.subject}', CatalogNumber='{classInfo.catalogNumber}', DisplayTitle='{classInfo.displayTitle}', Description='{classInfo.description}', Meetings count: {classInfo.meetings?.Count ?? 0}");

            // Extract instructor name from API data
            var instructorName = "No instructor available";
            if (classInfo.meetings?.Any() == true && classInfo.meetings.First().instructors?.Any() == true)
            {
                var instructor = classInfo.meetings.First().instructors.First();
                instructorName = instructor.FullName;
                _logger.LogInformation($"Found instructor: {instructorName}");
            }
            else
            {
                _logger.LogWarning($"No instructor found in meetings for {courseNumber}. Meetings: {classInfo.meetings?.Count ?? 0}, First meeting instructors: {classInfo.meetings?.FirstOrDefault()?.instructors?.Count ?? 0}");
            }

            // Build description from API meeting information
            var description = "No meeting information available";
            if (classInfo.meetings?.Any() == true)
            {
                var meeting = classInfo.meetings.First();
                var startTime = TimeSpan.FromMilliseconds(meeting.startTime).ToString(@"hh\:mm");
                var endTime = TimeSpan.FromMilliseconds(meeting.endTime).ToString(@"hh\:mm");
                var days = string.Join(", ", meeting.meetDays.Select(d => d.Substring(0, 3)));
                
                description = $"Location: {meeting.facilityDescription} ({meeting.buildingDescription}), " +
                            $"Days: {days}, Time: {startTime} - {endTime}, " +
                            $"Capacity: {classInfo.enrollmentCapacity} seats";
                _logger.LogInformation($"Built description: {description}");
            }
            else
            {
                _logger.LogWarning($"No meetings found for {courseNumber}");
            }

            // Keep semester as original code (no conversion)
            _logger.LogInformation($"Using semester code: {strm}");

            // Ensure we have valid course code and title
            var courseCode = !string.IsNullOrEmpty(classInfo.subject) && !string.IsNullOrEmpty(classInfo.catalogNumber) 
                ? $"{classInfo.subject} {classInfo.catalogNumber}" 
                : "Course code not available";
            
            var title = !string.IsNullOrEmpty(classInfo.displayTitle) 
                ? classInfo.displayTitle 
                : !string.IsNullOrEmpty(classInfo.description) 
                    ? classInfo.description 
                    : "No title available";

            _logger.LogInformation($"Final values for {courseNumber}: CourseCode='{courseCode}', Title='{title}', Instructor='{instructorName}'");

            var course = new Course
            {
                Number = courseNumber, // Class number like "60414"
                CourseCode = courseCode, // Course code like "CSE 310"
                Title = title,
                Instructor = instructorName,
                SeatsOpen = seatsInfo, // Real-time seats from scraping
                Description = description,
                Semester = strm, // Keep original semester code (e.g., "2257")
                LastUpdated = DateTime.UtcNow
            };

            return course;
        }



        public async Task<string> GetCurrentSeatsAsync(string courseNumber, string semester = "2257")
        {
            try
            {
                var seatsInfo = await GetSeatsFromCatalogAsync(courseNumber, semester);
                return seatsInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting current seats for course {courseNumber}");
                return "Error retrieving seats";
            }
        }
    }

    // DTOs for ASU API response - Fixed to match actual API response structure
    public class ASUClassResponse
    {
        public string strm { get; set; } = string.Empty;
        public string classNumber { get; set; } = string.Empty;
        public string courseId { get; set; } = string.Empty;
        public string subject { get; set; } = string.Empty;
        public string catalogNumber { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public string displayTitle { get; set; } = string.Empty;
        public int enrollmentCapacity { get; set; }
        public List<ASUMeeting> meetings { get; set; } = new();
        public List<ASUInstructor> instructors { get; set; } = new();
    }

    public class ASUMeeting
    {
        public int meetingNumber { get; set; }
        public List<ASUInstructor> instructors { get; set; } = new();
        public long startDate { get; set; }
        public long endDate { get; set; }
        public long startTime { get; set; }
        public long endTime { get; set; }
        public List<string> meetDays { get; set; } = new();
        public string facilityId { get; set; } = string.Empty;
        public string facilityDescription { get; set; } = string.Empty;
        public string buildingCode { get; set; } = string.Empty;
        public string buildingDescription { get; set; } = string.Empty;
    }

    public class ASUInstructor
    {
        public bool schedulePrint { get; set; }
        public string instructorRole { get; set; } = string.Empty;
        public int assignSequence { get; set; }
        public string firstName { get; set; } = string.Empty;
        public string lastName { get; set; } = string.Empty;
        public string iSearchUrl { get; set; } = string.Empty;
        
        public string FullName => $"{firstName} {lastName}".Trim();
    }
}
