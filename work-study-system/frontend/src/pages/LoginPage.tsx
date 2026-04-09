import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Lock, User, Mail, RefreshCw, Shield, KeyRound } from 'lucide-react';



type LoginMode = 'password' | 'otp';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { login, loginWithOtp, loginWithGoogle, user } = useAuth();
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
      toast.success('Login successful!');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err: any) {
      const msg = err.message || 'Google login failed';
      setError(msg);
      toast.error('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaptcha = useCallback(async () => {
    setIsCaptchaLoading(true);
    try {
      const data = await authService.getCaptcha();
      setCaptchaId(data.captchaId);
      setCaptchaImage(data.captchaImage);
      setCaptchaAnswer('');
    } catch {
      toast.error('Failed to load CAPTCHA');
    } finally {
      setIsCaptchaLoading(false);
    }
  }, []);

  // Load CAPTCHA when password mode is active
  useEffect(() => {
    if (mode === 'password') {
      loadCaptcha();
    }
  }, [mode, loadCaptcha]);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, captchaId, captchaAnswer);
      toast.success('Login successful!');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err: any) {
      const msg = err.message || 'Invalid username or password';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error || msg);
      } catch {
        setError(msg);
      }
      toast.error('Login failed');
      loadCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setIsOtpSending(true);
    try {
      await authService.sendOtp(email, 'LOGIN');
      setOtpSent(true);
      setOtpCountdown(60);
      toast.success('OTP sent to your email!');
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error || msg);
      } catch {
        setError(msg);
      }
      toast.error('Failed to send OTP');
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithOtp(email, otpCode);
      toast.success('Login successful!');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err: any) {
      const msg = err.message || 'Invalid or expired OTP';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error || msg);
      } catch {
        setError(msg);
      }
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white overflow-hidden login-bg">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Login Card */}
      <div
        className={`
          relative z-10 w-full max-w-md
          bg-white/[0.08] border border-white/15 rounded-3xl p-8
          shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-white/60 text-center mb-6">Sign in to your work-study account</p>

        {/* Mode Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          <button
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'password'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Lock className="w-4 h-4" />
            Password
          </button>
          <button
            onClick={() => { setMode('otp'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'otp'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            OTP Login
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/20 border-red-500/30 text-white">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Password + CAPTCHA Form */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/20"
                  required
                />
              </div>
            </div>

            {/* CAPTCHA Section */}
            <div className="space-y-2">
              <Label className="text-white/80 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Security Verification
              </Label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/40 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center min-h-[60px]">
                    {isCaptchaLoading ? (
                      <div className="flex items-center gap-2 text-white/40 py-4">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : captchaImage ? (
                      <img
                        src={captchaImage}
                        alt="CAPTCHA"
                        className="h-[60px] w-auto object-contain"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-white/30 text-sm py-4">CAPTCHA unavailable</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group border border-white/10"
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw className={`w-5 h-5 text-white/60 group-hover:text-cyan-400 transition-colors ${isCaptchaLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <Input
                  id="captchaAnswer"
                  type="text"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Enter the answer"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        )}

        {/* OTP Login Form */}
        {mode === 'otp' && (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otpEmail" className="text-white/80">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  id="otpEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/20"
                  required
                  disabled={otpSent}
                />
              </div>
            </div>

            {!otpSent ? (
              <Button
                type="button"
                onClick={handleSendOtp}
                className="w-full bg-gradient-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-200"
                disabled={isOtpSending || !email}
              >
                {isOtpSending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Send OTP
                  </span>
                )}
              </Button>
            ) : (
              <>
                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otpCode" className="text-white/80 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    Enter 6-Digit OTP
                  </Label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <Input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/20 placeholder:tracking-[0.3em] focus:border-cyan-400 focus:ring-cyan-400/20"
                      required
                    />
                    <p className="text-white/40 text-xs text-center mt-2">
                      Check your email for the verification code
                    </p>
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-sm text-white/50 hover:text-white/70 transition-colors"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCountdown > 0}
                    className={`text-sm transition-colors ${
                      otpCountdown > 0
                        ? 'text-white/30 cursor-not-allowed'
                        : 'text-cyan-400 hover:text-cyan-300'
                    }`}
                  >
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
                  disabled={isLoading || otpCode.length !== 6}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>
              </>
            )}
          </form>
        )}

        {/* Google OAuth Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google Sign-In Button */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google login failed. Please try again.');
              toast.error('Google login failed');
            }}
            theme="filled_black"
            size="large"
            shape="rectangular"
            text="signin_with"
            width="350"
          />
        </div>

        <div className="mt-6 text-center text-white/60">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Register
          </button>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm font-medium text-white/70 mb-2">Demo Credentials:</p>
          <div className="text-sm text-white/50 space-y-1">
            <p>Admin: <code className="bg-white/10 px-2 py-0.5 rounded">admin</code> / <code className="bg-white/10 px-2 py-0.5 rounded">admin123</code></p>
            <p>Student: <code className="bg-white/10 px-2 py-0.5 rounded">student</code> / <code className="bg-white/10 px-2 py-0.5 rounded">student123</code></p>
          </div>
        </div>
      </div>

      <style>{`
        .login-bg {
          background: linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #112240 70%, #0a0a1a 100%);
        }
      `}</style>
    </div>
  );
}
