import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'STUDENT';
    phone?: string;
    department?: string;
    active: boolean;
  };
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
  department?: string;
  otpCode: string;
}

interface CaptchaData {
  captchaId: string;
  captchaImage: string;
}

interface PasswordLoginData {
  username: string;
  password: string;
  loginMode: 'PASSWORD';
  captchaId: string;
  captchaAnswer: string;
}

interface OtpLoginData {
  email: string;
  otpCode: string;
  loginMode: 'OTP';
}

export const authService = {
  // Password + CAPTCHA login
  loginWithPassword: (data: PasswordLoginData): Promise<LoginResponse> =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // OTP login
  loginWithOtp: (data: OtpLoginData): Promise<LoginResponse> =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Legacy login (kept for backwards compat)
  login: (username: string, password: string): Promise<LoginResponse> =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, loginMode: 'PASSWORD' }),
    }),

  registerStudent: (data: RegisterData): Promise<LoginResponse> =>
    apiFetch('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerAdmin: (data: RegisterData): Promise<LoginResponse> =>
    apiFetch('/auth/register/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: (): Promise<LoginResponse['user']> =>
    apiFetch('/auth/me'),

  // CAPTCHA
  getCaptcha: async (): Promise<CaptchaData> => {
    const response = await fetch(`${API_URL.replace('/api', '')}/api/captcha/generate`);
    if (!response.ok) throw new Error('Failed to load CAPTCHA');
    return response.json();
  },

  // OTP
  sendOtp: async (email: string, purpose: 'REGISTRATION' | 'LOGIN'): Promise<{ message: string }> =>
    apiFetch('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),

  verifyOtp: async (email: string, otpCode: string, purpose: 'REGISTRATION' | 'LOGIN'): Promise<{ message: string; verified: boolean }> =>
    apiFetch('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode, purpose }),
    }),

  // Google OAuth
  googleLogin: (idToken: string): Promise<LoginResponse> =>
    apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
};
