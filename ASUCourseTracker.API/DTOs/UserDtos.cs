namespace ASUCourseTracker.API.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public int TrackedCoursesCount { get; set; }
    }

    public class UpdateProfileDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
    }
}