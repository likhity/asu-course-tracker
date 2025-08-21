using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ASUCourseTracker.API.Data;
using ASUCourseTracker.API.Models;
using ASUCourseTracker.API.DTOs;
using ASUCourseTracker.API.Services;

namespace ASUCourseTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ExpoNotificationService _expoNotificationService;

        public UsersController(ApplicationDbContext context, ExpoNotificationService expoNotificationService)
        {
            _context = context;
            _expoNotificationService = expoNotificationService;
        }

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileDto>> GetProfile()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.UserCourses)
                .ThenInclude(uc => uc.Course)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound();
            }

            var profileDto = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                TrackedCoursesCount = user.UserCourses.Count
            };

            return Ok(profileDto);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateProfileDto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            user.PhoneNumber = updateProfileDto.PhoneNumber;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.UserCourses)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound();
            }

            // Note: Expo push tokens are automatically invalidated when user is deleted
            // No need to manually clean up like with AWS SNS endpoints

            // Remove all course tracking
            _context.UserCourses.RemoveRange(user.UserCourses);

            // Remove user
            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Account deleted successfully" });
        }

        [HttpPost("register-push-token")]
        public async Task<ActionResult<ExpoPushTokenResponseDto>> RegisterPushToken([FromBody] RegisterExpoPushTokenDto registerTokenDto)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            try
            {
                // Validate the Expo push token format
                if (!_expoNotificationService.ValidateExpoPushToken(registerTokenDto.ExpoPushToken))
                {
                    return BadRequest(new ExpoPushTokenResponseDto
                    {
                        Success = false,
                        Message = "Invalid Expo push token format"
                    });
                }

                // Update user with new Expo push token
                user.ExpoPushToken = registerTokenDto.ExpoPushToken;
                await _context.SaveChangesAsync();

                return Ok(new ExpoPushTokenResponseDto
                {
                    Success = true,
                    Message = "Push token registered successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ExpoPushTokenResponseDto
                {
                    Success = false,
                    Message = $"Error registering push token: {ex.Message}"
                });
            }
        }

        [HttpPost("test-notification")]
        public async Task<IActionResult> SendTestNotification()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            if (string.IsNullOrEmpty(user.ExpoPushToken))
            {
                return BadRequest(new { message = "No push token registered for notifications" });
            }

            try
            {
                bool success = await _expoNotificationService.SendTestNotificationAsync(user.ExpoPushToken);
                
                if (success)
                {
                    return Ok(new { message = "Test notification sent successfully" });
                }
                else
                {
                    return StatusCode(500, new { message = "Failed to send test notification" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error sending test notification: {ex.Message}" });
            }
        }

        [HttpDelete("unregister-push-token")]
        public async Task<IActionResult> UnregisterPushToken()
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (userId == 0)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            try
            {
                // Clear push token
                user.ExpoPushToken = null;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Push token unregistered successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error unregistering push token: {ex.Message}" });
            }
        }
    }
}