using ASUCourseTracker.API.Data;
using ASUCourseTracker.API.DTOs;
using ASUCourseTracker.API.Models;
using ASUCourseTracker.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ASUCourseTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;

        public AuthController(ApplicationDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupDto signupDto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == signupDto.Email))
            {
                return BadRequest("Email already registered");
            }

            var user = new User
            {
                Email = signupDto.Email,
                PasswordHash = HashPassword(signupDto.Password),
                PhoneNumber = signupDto.PhoneNumber,
                Role = "User" // Set default role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var (accessToken, refreshToken) = _jwtService.GenerateTokens(user);

            return Ok(new AuthResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                UserId = user.Id
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return BadRequest("Invalid email or password");
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var (accessToken, refreshToken) = _jwtService.GenerateTokens(user);

            return Ok(new AuthResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                UserId = user.Id
            });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
        {
            try
            {
                var principal = _jwtService.ValidateToken(refreshTokenDto.RefreshToken);
                if (principal == null)
                {
                    return BadRequest("Invalid refresh token");
                }

                var userId = int.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                {
                    return BadRequest("Invalid token claims");
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return BadRequest("User not found");
                }

                // Generate new tokens
                var (newAccessToken, newRefreshToken) = _jwtService.GenerateTokens(user);

                return Ok(new AuthResponseDto
                {
                    Token = newAccessToken,
                    RefreshToken = newRefreshToken,
                    Email = user.Email,
                    UserId = user.Id
                });
            }
            catch (Exception ex)
            {
                return BadRequest("Token refresh failed");
            }
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
    }
}