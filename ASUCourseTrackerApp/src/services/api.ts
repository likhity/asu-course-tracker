import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SignupDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  CourseDto,
  CreateCourseDto,
  UpdateCourseDto,
  TrackedCourseDto,
} from '../types';

// Environment-aware API configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5246/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken({ refreshToken });
              await AsyncStorage.setItem('accessToken', response.token);
              await AsyncStorage.setItem('refreshToken', response.refreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${response.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userId']);
            // You might want to emit an event here to notify the app to redirect to login
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async signup(data: SignupDto): Promise<AuthResponseDto> {
    const response: AxiosResponse<AuthResponseDto> = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async login(data: LoginDto): Promise<AuthResponseDto> {
    const response: AxiosResponse<AuthResponseDto> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async refreshToken(data: RefreshTokenDto): Promise<AuthResponseDto> {
    const response: AxiosResponse<AuthResponseDto> = await this.api.post('/auth/refresh', data);
    return response.data;
  }

  // Course endpoints
  async getTrackedCourses(): Promise<TrackedCourseDto[]> {
    const response: AxiosResponse<TrackedCourseDto[]> = await this.api.get('/courses/tracked');
    return response.data;
  }

  async trackCourse(courseNumber: string): Promise<TrackedCourseDto> {
    const response: AxiosResponse<TrackedCourseDto> = await this.api.post(`/courses/${courseNumber}/track`);
    return response.data;
  }

  async untrackCourse(courseNumber: string): Promise<void> {
    await this.api.delete(`/courses/${courseNumber}/untrack`);
  }

  async getCourses(): Promise<CourseDto[]> {
    const response: AxiosResponse<CourseDto[]> = await this.api.get('/courses');
    return response.data;
  }

  async getCourse(courseNumber: string): Promise<CourseDto> {
    const response: AxiosResponse<CourseDto> = await this.api.get(`/courses/${courseNumber}`);
    return response.data;
  }

  async createCourse(data: CreateCourseDto): Promise<CourseDto> {
    const response: AxiosResponse<CourseDto> = await this.api.post('/courses', data);
    return response.data;
  }

  async updateCourse(courseNumber: string, data: UpdateCourseDto): Promise<CourseDto> {
    const response: AxiosResponse<CourseDto> = await this.api.put(`/courses/${courseNumber}`, data);
    return response.data;
  }

  async deleteCourse(courseNumber: string): Promise<void> {
    await this.api.delete(`/courses/${courseNumber}`);
  }

  async searchCourses(query: string): Promise<CourseDto[]> {
    const response: AxiosResponse<CourseDto[]> = await this.api.get(`/courses/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
