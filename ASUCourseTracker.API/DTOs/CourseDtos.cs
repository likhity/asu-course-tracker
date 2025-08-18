namespace ASUCourseTracker.API.DTOs
{
    public class CourseDto
    {
        public int Id { get; set; }
        public string Number { get; set; } = string.Empty; // Class number like "70330"
        public string CourseCode { get; set; } = string.Empty; // Course code like "CSE 310"
        public string Title { get; set; } = string.Empty;
        public string Instructor { get; set; } = string.Empty;
        public string SeatsOpen { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public string? Description { get; set; }
        public string? Semester { get; set; }
    }

    public class CreateCourseDto
    {
        public string Number { get; set; } = string.Empty; // Class number like "70330"
        public string CourseCode { get; set; } = string.Empty; // Course code like "CSE 310"
        public string Title { get; set; } = string.Empty;
        public string Instructor { get; set; } = string.Empty;
        public string SeatsOpen { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Semester { get; set; }
    }

    public class UpdateCourseDto
    {
        public string CourseCode { get; set; } = string.Empty; // Course code like "CSE 310"
        public string Title { get; set; } = string.Empty;
        public string Instructor { get; set; } = string.Empty;
        public string SeatsOpen { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Semester { get; set; }
    }

    public class TrackedCourseDto
    {
        public int CourseId { get; set; }
        public string CourseNumber { get; set; } = string.Empty; // Class number like "70330"
        public string CourseCode { get; set; } = string.Empty; // Course code like "CSE 310"
        public string CourseTitle { get; set; } = string.Empty;
        public string Instructor { get; set; } = string.Empty;
        public string SeatsOpen { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public DateTime TrackedAt { get; set; }
    }
}