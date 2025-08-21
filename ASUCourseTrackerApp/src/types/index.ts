// Authentication Types
export interface SignupDto {
  email: string;
  password: string;
  phoneNumber: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  refreshToken: string;
  email: string;
  userId: number;
  lastLoginAt?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Course Types
export interface CourseDto {
  id: number;
  number: string; // Class number like "70330"
  courseCode: string; // Course code like "CSE 310"
  title: string;
  instructor: string;
  seatsOpen: string;
  lastUpdated: string;
  description?: string;
  semester?: string;
}

export interface CreateCourseDto {
  number: string; // Class number like "70330"
  courseCode: string; // Course code like "CSE 310"
  title: string;
  instructor: string;
  seatsOpen: string;
  description?: string;
  semester?: string;
}

export interface UpdateCourseDto {
  courseCode: string; // Course code like "CSE 310"
  title: string;
  instructor: string;
  seatsOpen: string;
  description?: string;
  semester?: string;
}

export interface TrackedCourseDto {
  courseId: number;
  courseNumber: string; // Class number like "70330"
  courseCode: string; // Course code like "CSE 310"
  courseTitle: string;
  instructor: string;
  seatsOpen: string;
  lastUpdated: string;
  trackedAt: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  lastLoginAt?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Courses: undefined;
  CourseDetail: { course: CourseDto };
  TrackCourse: undefined;
  Profile: undefined;
  ThemeSettings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Courses: undefined;
  Profile: undefined;
};
