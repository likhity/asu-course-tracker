using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ASUCourseTracker.API.Data;
using ASUCourseTracker.API.Models;
using ASUCourseTracker.API.DTOs;

namespace ASUCourseTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
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

            // Remove all course tracking
            _context.UserCourses.RemoveRange(user.UserCourses);

            // Remove user
            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Account deleted successfully" });
        }
    }
}