using System.ComponentModel.DataAnnotations;

namespace ASUCourseTracker.API.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Role { get; set; } = "User";

        // Expo push notification token
        public string? ExpoPushToken { get; set; }

        public ICollection<UserCourse> UserCourses { get; set; } = new List<UserCourse>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastLoginAt { get; set; }
    }

    public class UserCourse
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public DateTime TrackedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
    }
}