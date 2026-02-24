import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Lock, User, Mail, Phone, Building, UserPlus } from 'lucide-react';

// WebGL Shader Background - OPTIMIZED
const RESOLUTION_SCALE = 0.4;

const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform float time;
      uniform vec2 resolution;
      
      float noise(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      
      float smoothNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(noise(i), noise(i + vec2(1.0, 0.0)), f.x), mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * smoothNoise(p); p *= 2.0; a *= 0.5; }
        return v;
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float t = time * 0.15;
        float n1 = fbm(uv * 3.0 + t), n2 = fbm(uv * 4.5 - t * 0.7);
        vec3 col = mix(vec3(0.1, 0.02, 0.15), vec3(0.15, 0.02, 0.25), smoothstep(0.2, 0.8, n1 + uv.y * 0.5));
        col = mix(col, vec3(0.3, 0.1, 0.4), smoothstep(0.3, 0.7, n2) * 0.6);
        col += vec3(0.6, 0.2, 0.7) * n1 * 0.08;
        col *= 1.0 - length(uv - 0.5) * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compileShader = (src: string, type: number) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'time');
    const resLoc = gl.getUniformLocation(program, 'resolution');

    const resize = () => {
      const w = Math.floor(window.innerWidth * RESOLUTION_SCALE);
      const h = Math.floor(window.innerHeight * RESOLUTION_SCALE);
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(resLoc, w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const start = Date.now();
    let last = 0;
    const render = (t: number) => {
      animationRef.current = requestAnimationFrame(render);
      if (t - last < 33) return;
      last = t;
      gl.uniform1f(timeLoc, (Date.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0" style={{ zIndex: -1, width: '100vw', height: '100vh' }} />;
};

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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    phone: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (user) {
    navigate(user.role === 'ADMIN' ? '/admin' : '/student');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast.success('Registration successful!');
      navigate('/student');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
      <ShaderBackground />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Register Card */}
      <div
        className={`
          relative z-10 w-full max-w-md my-8
          backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-white/60 text-center mb-6">Join the work-study program today</p>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/20 border-red-500/30 text-white">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Create password"
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
                placeholder="Confirm password"
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

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
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
