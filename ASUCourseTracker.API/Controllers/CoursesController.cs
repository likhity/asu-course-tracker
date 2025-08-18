using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ASUCourseTracker.API.Data;
using ASUCourseTracker.API.Models;
using ASUCourseTracker.API.DTOs;
using ASUCourseTracker.API.Services;

namespace ASUCourseTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CoursesController> _logger;
        private readonly HybridCourseService _hybridCourseService;

        public CoursesController(ApplicationDbContext context, ILogger<CoursesController> logger, HybridCourseService hybridCourseService)
        {
            _context = context;
            _logger = logger;
            _hybridCourseService = hybridCourseService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetCourses()
        {
            var courses = await _context.Courses
                .Select(c => new CourseDto
                {
                    Id = c.Id,
                    Number = c.Number,
                    CourseCode = c.CourseCode,
                    Title = c.Title,
                    Instructor = c.Instructor,
                    SeatsOpen = c.SeatsOpen,
                    LastUpdated = c.LastUpdated,
                    Description = c.Description,
                    Semester = c.Semester
                })
                .ToListAsync();

            return Ok(courses);
        }

        [HttpGet("{courseNumber}")]
        public async Task<ActionResult<CourseDto>> GetCourse(string courseNumber)
        {
            var course = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);

            if (course == null)
            {
                return NotFound(new { 
                    message = $"Course {courseNumber} not found", 
                    suggestion = "Try using the track endpoint to automatically fetch course information from ASU" 
                });
            }

            var courseDto = new CourseDto
            {
                Id = course.Id,
                Number = course.Number,
                CourseCode = course.CourseCode,
                Title = course.Title,
                Instructor = course.Instructor,
                SeatsOpen = course.SeatsOpen,
                LastUpdated = course.LastUpdated,
                Description = course.Description,
                Semester = course.Semester
            };

            return Ok(courseDto);
        }

        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseDto createCourseDto)
        {
            if (await _context.Courses.AnyAsync(c => c.Number == createCourseDto.Number))
            {
                return BadRequest($"Course {createCourseDto.Number} already exists");
            }

            var course = new Course
            {
                Number = createCourseDto.Number,
                CourseCode = createCourseDto.CourseCode,
                Title = createCourseDto.Title,
                Instructor = createCourseDto.Instructor,
                SeatsOpen = createCourseDto.SeatsOpen,
                Description = createCourseDto.Description,
                Semester = createCourseDto.Semester,
                LastUpdated = DateTime.UtcNow
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var courseDto = new CourseDto
            {
                Id = course.Id,
                Number = course.Number,
                CourseCode = course.CourseCode,
                Title = course.Title,
                Instructor = course.Instructor,
                SeatsOpen = course.SeatsOpen,
                LastUpdated = course.LastUpdated,
                Description = course.Description,
                Semester = course.Semester
            };

            return CreatedAtAction(nameof(GetCourse), new { courseNumber = course.Number }, courseDto);
        }

        [HttpPut("{courseNumber}")]
        public async Task<IActionResult> UpdateCourse(string courseNumber, [FromBody] UpdateCourseDto updateCourseDto)
        {
            var course = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);

            if (course == null)
            {
                return NotFound(new { 
                    message = $"Course {courseNumber} not found", 
                    suggestion = "Try using the fetch endpoint to retrieve course information from ASU first" 
                });
            }

            course.CourseCode = updateCourseDto.CourseCode;
            course.Title = updateCourseDto.Title;
            course.Instructor = updateCourseDto.Instructor;
            course.SeatsOpen = updateCourseDto.SeatsOpen;
            course.Description = updateCourseDto.Description;
            course.Semester = updateCourseDto.Semester;
            course.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{courseNumber}")]
        public async Task<IActionResult> DeleteCourse(string courseNumber)
        {
            var course = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);

            if (course == null)
            {
                return NotFound(new { 
                    message = $"Course {courseNumber} not found", 
                    suggestion = "Course may not exist in the database" 
                });
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{courseNumber}/track")]
        public async Task<IActionResult> TrackCourse(string courseNumber)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var course = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);
            if (course == null)
            {
                // Try to fetch course information from ASU
                try
                {
                    course = await FetchCourseFromASUAsync(courseNumber);
                    if (course != null)
                    {
                        _context.Courses.Add(course);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Successfully fetched and added course {courseNumber} from ASU");
                    }
                    else
                    {
                        return NotFound($"Course {courseNumber} not found and could not be retrieved from ASU");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error fetching course {courseNumber} from ASU");
                    return StatusCode(500, $"Course {courseNumber} not found and there was an error retrieving it from ASU");
                }
            }

            var existingTracking = await _context.UserCourses
                .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CourseId == course.Id);

            if (existingTracking != null)
            {
                return BadRequest($"Course {courseNumber} is already being tracked");
            }

            var userCourse = new UserCourse
            {
                UserId = userId,
                CourseId = course.Id,
                TrackedAt = DateTime.UtcNow,
                IsActive = true
            };
            _context.UserCourses.Add(userCourse);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Course {courseNumber} tracking started" });
        }

        [HttpDelete("{courseNumber}/untrack")]
        public async Task<IActionResult> UntrackCourse(string courseNumber)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var course = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);
            if (course == null)
            {
                // Try to fetch course information from ASU
                try
                {
                    course = await FetchCourseFromASUAsync(courseNumber);
                    if (course != null)
                    {
                        _context.Courses.Add(course);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Successfully fetched and added course {courseNumber} from ASU for untrack operation");
                    }
                    else
                    {
                        return NotFound($"Course {courseNumber} not found and could not be retrieved from ASU");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error fetching course {courseNumber} from ASU for untrack operation");
                    return StatusCode(500, $"Course {courseNumber} not found and there was an error retrieving it from ASU");
                }
            }

            var tracking = await _context.UserCourses
                .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CourseId == course.Id);

            if (tracking == null)
            {
                return NotFound($"Course {courseNumber} tracking not found");
            }

            _context.UserCourses.Remove(tracking);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Course {courseNumber} tracking stopped" });
        }

        [HttpGet("tracked")]
        public async Task<ActionResult<IEnumerable<TrackedCourseDto>>> GetTrackedCourses()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var trackedCourses = await _context.UserCourses
                .Where(uc => uc.UserId == userId)
                .Include(uc => uc.Course)
                .Select(uc => new TrackedCourseDto
                {
                    CourseId = uc.CourseId,
                    CourseNumber = uc.Course.Number,
                    CourseCode = uc.Course.CourseCode,
                    CourseTitle = uc.Course.Title,
                    Instructor = uc.Course.Instructor,
                    SeatsOpen = uc.Course.SeatsOpen,
                    LastUpdated = uc.Course.LastUpdated,
                    TrackedAt = uc.TrackedAt
                })
                .ToListAsync();

            return Ok(trackedCourses);
        }

        [HttpPost("{courseNumber}/fetch")]
        public async Task<ActionResult<CourseDto>> FetchCourseFromASU(string courseNumber)
        {
            try
            {
                var course = await FetchCourseFromASUAsync(courseNumber);
                if (course != null)
                {
                    // Check if course already exists
                    var existingCourse = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);
                    if (existingCourse != null)
                    {
                        // Update existing course with new information
                        existingCourse.Title = course.Title;
                        existingCourse.CourseCode = course.CourseCode; // Add this line to update CourseCode
                        existingCourse.Instructor = course.Instructor;
                        existingCourse.SeatsOpen = course.SeatsOpen;
                        existingCourse.Description = course.Description;
                        existingCourse.LastUpdated = DateTime.UtcNow;
                        
                        await _context.SaveChangesAsync();
                        
                        var courseDto = new CourseDto
                        {
                            Id = existingCourse.Id,
                            Number = existingCourse.Number,
                            CourseCode = existingCourse.CourseCode,
                            Title = existingCourse.Title,
                            Instructor = existingCourse.Instructor,
                            SeatsOpen = existingCourse.SeatsOpen,
                            LastUpdated = existingCourse.LastUpdated,
                            Description = existingCourse.Description,
                            Semester = existingCourse.Semester
                        };
                        
                        return Ok(new { 
                            message = $"Course {courseNumber} information updated from ASU",
                            course = courseDto
                        });
                    }
                    else
                    {
                        // Add new course
                        _context.Courses.Add(course);
                        await _context.SaveChangesAsync();
                        
                        var courseDto = new CourseDto
                        {
                            Id = course.Id,
                            Number = course.Number,
                            CourseCode = course.CourseCode,
                            Title = course.Title,
                            Instructor = course.Instructor,
                            SeatsOpen = course.SeatsOpen,
                            LastUpdated = course.LastUpdated,
                            Description = course.Description,
                            Semester = course.Semester
                        };
                        
                        return CreatedAtAction(nameof(GetCourse), new { courseNumber = course.Number }, new {
                            message = $"Course {courseNumber} information fetched from ASU and added to database",
                            course = courseDto
                        });
                    }
                }
                else
                {
                    return NotFound($"Could not retrieve course {courseNumber} information from ASU");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching course {courseNumber} from ASU");
                return StatusCode(500, $"Error retrieving course {courseNumber} information from ASU");
            }
        }

        private async Task<Course?> FetchCourseFromASUAsync(string courseNumber)
        {
            try
            {
                // Get the semester from the database if the course exists
                var existingCourse = await _context.Courses.FirstOrDefaultAsync(c => c.Number == courseNumber);
                var semester = existingCourse?.Semester ?? "2257"; // Use existing semester or default
                
                _logger.LogInformation($"Fetching course {courseNumber} with semester {semester}");
                
                // Use the hybrid service to get both course details and real-time seats
                var course = await _hybridCourseService.GetCourseWithSeatsAsync(courseNumber, semester);
                
                if (course != null)
                {
                    _logger.LogInformation($"Successfully retrieved course {courseNumber} with hybrid approach: {course.Title}");
                    return course;
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching course {courseNumber} with hybrid approach");
                return null;
            }
        }
    }
}