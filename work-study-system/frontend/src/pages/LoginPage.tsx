import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Lock, User, Sparkles } from 'lucide-react';

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
        vec3 col = mix(vec3(0.05, 0.02, 0.15), vec3(0.1, 0.05, 0.3), smoothstep(0.2, 0.8, n1 + uv.y * 0.5));
        col = mix(col, vec3(0.0, 0.3, 0.5), smoothstep(0.3, 0.7, n2) * 0.6);
        col += vec3(0.0, 0.6, 0.8) * n1 * 0.1;
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

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (user) {
    navigate(user.role === 'ADMIN' ? '/admin' : '/student');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      toast.success('Login successful!');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/student');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
      toast.error('Login failed');
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

      {/* Login Card */}
      <div
        className={`
          relative z-10 w-full max-w-md
          backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-white/60 text-center mb-8">Sign in to your work-study account</p>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500/20 border-red-500/30 text-white">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
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
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm font-medium text-white/70 mb-2">Demo Credentials:</p>
          <div className="text-sm text-white/50 space-y-1">
            <p>Admin: <code className="bg-white/10 px-2 py-0.5 rounded">admin</code> / <code className="bg-white/10 px-2 py-0.5 rounded">admin123</code></p>
            <p>Student: <code className="bg-white/10 px-2 py-0.5 rounded">student</code> / <code className="bg-white/10 px-2 py-0.5 rounded">student123</code></p>
          </div>
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
