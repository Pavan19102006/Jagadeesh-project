import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Lock, User, Mail, Phone, Building, UserPlus, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';



// Glass Input component
const GlassInput = ({ icon: Icon, ...props }: { icon: React.ComponentType<{ className?: string }> } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
    <Input
      {...props}
      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/20"
    />
  </div>
);

type Step = 'details' | 'otp' | 'complete';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    phone: '',
    department: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setIsLoading(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Account created successfully!');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err: any) {
      const msg = err.message || 'Google signup failed';
      setError(msg);
      toast.error('Google signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  if (user) {
    navigate(user.role === 'ADMIN' ? '/admin' : '/student');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Send OTP to the entered email
    setIsOtpSending(true);
    try {
      await authService.sendOtp(formData.email, 'REGISTRATION');
      setStep('otp');
      setOtpCountdown(60);
      toast.success('Verification code sent to ' + formData.email);
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error || msg);
      } catch {
        setError(msg);
      }
      toast.error('Failed to send verification code');
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    setIsOtpSending(true);
    try {
      await authService.sendOtp(formData.email, 'REGISTRATION');
      setOtpCountdown(60);
      toast.success('New code sent!');
    } catch {
      toast.error('Failed to resend code');
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register({ ...registerData, otpCode });
      toast.success('Account created successfully!');
      navigate('/student');
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error || msg);
      } catch {
        setError(msg);
      }
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: 'details', label: 'Details', number: 1 },
    { key: 'otp', label: 'Verify', number: 2 },
    { key: 'complete', label: 'Done', number: 3 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white overflow-hidden register-bg">
      {/* Back button */}
      <button
        onClick={() => step === 'otp' ? setStep('details') : navigate('/')}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{step === 'otp' ? 'Back' : 'Home'}</span>
      </button>

      {/* Register Card */}
      <div
        className={`
          relative z-10 w-full max-w-md my-8
          bg-white/[0.08] border border-white/15 rounded-3xl p-8
          shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-white/60 text-center mb-5">Join the work-study program today</p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  i < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : i === currentStepIndex
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 text-white/30 border border-white/10'
                }`}
              >
                {i < currentStepIndex ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  s.number
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 transition-all duration-300 ${
                  i < currentStepIndex ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-5 bg-red-500/20 border-red-500/30 text-white">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Details Form */}
        {step === 'details' && (
          <>
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/80">Full Name</Label>
                <GlassInput
                  icon={User}
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/80">Username</Label>
                <GlassInput
                  icon={User}
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <GlassInput
                  icon={Mail}
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <GlassInput
                    icon={Lock}
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/80">Confirm</Label>
                  <GlassInput
                    icon={Lock}
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-white/80">Department</Label>
                  <GlassInput
                    icon={Building}
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/80">Phone</Label>
                  <GlassInput
                    icon={Phone}
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200 mt-2"
                disabled={isOtpSending}
              >
                {isOtpSending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending verification code...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Google OAuth Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Sign-Up Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google signup failed. Please try again.');
                  toast.error('Google signup failed');
                }}
                theme="filled_black"
                size="large"
                shape="rectangular"
                text="signup_with"
                width="350"
              />
            </div>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Verify Your Email</h3>
              <p className="text-white/50 text-sm">
                We sent a 6-digit code to
              </p>
              <p className="text-purple-400 font-medium text-sm mt-1">
                {formData.email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regOtpCode" className="text-white/80 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                Verification Code
              </Label>
              <Input
                id="regOtpCode"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/20 placeholder:tracking-[0.3em] focus:border-purple-400 focus:ring-purple-400/20"
                required
              />
            </div>

            {/* Resend */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpCountdown > 0 || isOtpSending}
                className={`text-sm transition-colors ${
                  otpCountdown > 0
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                {isOtpSending
                  ? 'Sending...'
                  : otpCountdown > 0
                  ? `Resend code in ${otpCountdown}s`
                  : 'Resend verification code'}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200"
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Verify & Create Account
                </span>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-white/60">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>

      <style>{`
        .register-bg {
          background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #2d1040 70%, #0a0a1a 100%);
        }
      `}</style>
    </div>
  );
}
