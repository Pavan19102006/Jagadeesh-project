import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STUDENT';
  phone?: string;
  department?: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, captchaId: string, captchaAnswer: string) => Promise<void>;
  loginWithOtp: (email: string, otpCode: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, captchaId: string, captchaAnswer: string) => {
    const response = await authService.loginWithPassword({
      username,
      password,
      loginMode: 'PASSWORD',
      captchaId,
      captchaAnswer,
    });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const loginWithOtp = async (email: string, otpCode: string) => {
    const response = await authService.loginWithOtp({
      email,
      otpCode,
      loginMode: 'OTP',
    });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await authService.googleLogin(idToken);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.registerStudent(data);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithOtp, loginWithGoogle, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
