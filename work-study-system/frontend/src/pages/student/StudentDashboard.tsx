import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { dashboardService, StudentDashboard as StudentDashboardData } from '../../services/dashboardService';
import { Briefcase, FileText, Clock, Star, ArrowRight, TrendingUp, Calendar, Zap, LucideProps } from 'lucide-react';
import { toast } from 'sonner';

// Glassmorphism Card component
const GlassCard = ({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`
    bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
    ${hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5' : ''}
    ${className}
  `}>
    {children}
  </div>
);

// Stat Card with gradient icon
const StatCard = ({ title, value, icon: Icon, gradient, trend }: {
  title: string;
  value: string | number;
  icon: React.FC<LucideProps>;
  gradient: string;
  trend?: string;
}) => (
  <GlassCard className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/50 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </GlassCard>
);

// Quick Link Card
const QuickLinkCard = ({ title, description, icon: Icon, path, gradient }: {
  title: string;
  description: string;
  icon: React.FC<LucideProps>;
  path: string;
  gradient: string;
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="group flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 w-full text-left"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{title}</p>
        <p className="text-sm text-white/50">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
};

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await dashboardService.getStudentDashboard();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { title: 'My Applications', value: stats?.myApplications || 0, icon: FileText, gradient: 'from-blue-500 to-cyan-400', trend: '+2 this week' },
    { title: 'Available Jobs', value: stats?.availableJobs || 0, icon: Briefcase, gradient: 'from-emerald-500 to-green-400', trend: '5 new today' },
    { title: 'Total Work Hours', value: stats?.myWorkHours?.toFixed(1) || '0.0', icon: Clock, gradient: 'from-purple-500 to-pink-400' },
    { title: 'Feedback Received', value: stats?.myFeedback || 0, icon: Star, gradient: 'from-amber-500 to-orange-400' },
  ];

  const quickLinks = [
    { title: 'Browse Jobs', description: 'Find work-study opportunities', icon: Briefcase, path: '/student/jobs', gradient: 'from-cyan-500 to-blue-500' },
    { title: 'My Applications', description: 'Track your application status', icon: FileText, path: '/student/applications', gradient: 'from-purple-500 to-pink-500' },
    { title: 'Log Work Hours', description: 'Record your work time', icon: Clock, path: '/student/workhours', gradient: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-white/60 text-lg">
            Here's your work-study overview. Let's make today productive!
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="mt-4 text-white/50">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((card, index) => (
                <StatCard key={index} {...card} />
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <GlassCard className="p-6" hover={false}>
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                  </div>
                  <div className="space-y-3">
                    {quickLinks.map((link, index) => (
                      <QuickLinkCard key={index} {...link} />
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Getting Started */}
              <div>
                <GlassCard className="p-6" hover={false}>
                  <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
                  <p className="text-white/50 text-sm mb-4">
                    Here's how to make the most of the work-study program:
                  </p>
                  <ol className="space-y-3">
                    {[
                      'Browse available job positions',
                      'Submit applications with cover letters',
                      'Track your application status',
                      'Log your work hours regularly',
                      'Receive feedback from supervisors',
                    ].map((step, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-white/70 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </GlassCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
