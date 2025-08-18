using System.ComponentModel.DataAnnotations;

namespace ASUCourseTracker.API.Models
{
    public class Course
    {
        public int Id { get; set; }

        [Required]
        public string Number { get; set; } = string.Empty; // Class number like "70330"

        [Required]
        public string CourseCode { get; set; } = string.Empty; // Course code like "CSE 310", "CSE 576"

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Instructor { get; set; } = string.Empty;

        [Required]
        public string SeatsOpen { get; set; } = string.Empty;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        public ICollection<UserCourse> UserCourses { get; set; } = new List<UserCourse>();

        public string? Description { get; set; }

        public string? Semester { get; set; }
    }
}