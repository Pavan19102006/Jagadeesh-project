import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { applicationService, Application } from '../../services/applicationService';
import { toast } from 'sonner';
import { Eye, XCircle, FileText } from 'lucide-react';

// Glassmorphism Card
const GlassCard = ({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`
    bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
    ${hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
    WITHDRAWN: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
};

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationService.getMyApplications();
      setApplications(data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (id: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await applicationService.withdrawApplication(id);
      toast.success('Application withdrawn');
      loadApplications();
    } catch (error) {
      toast.error('Failed to withdraw application');
    }
  };

  const handleView = (application: Application) => {
    setSelectedApplication(application);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Applications</h1>
          <p className="text-white/60">Track the status of your work-study applications.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="mt-4 text-white/50">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <GlassCard className="p-12 text-center" hover={false}>
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">You haven't submitted any applications yet.</p>
            <button
              onClick={() => navigate('/student/jobs')}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-white font-medium shadow-lg shadow-cyan-500/25 transition-all"
            >
              Browse Jobs
            </button>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/50 text-sm font-medium p-4">Job</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Department</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Applied Date</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Status</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{app.job.title}</td>
                      <td className="p-4 text-white/70">{app.job.department}</td>
                      <td className="p-4 text-white/70">{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td className="p-4"><StatusBadge status={app.status} /></td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => handleView(app)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          {app.status === 'PENDING' && (
                            <button onClick={() => handleWithdraw(app.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl bg-slate-800/95 backdrop-blur-xl border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Application Details</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white/50 text-sm">Job Position</Label>
                  <p className="font-medium text-lg text-white">{selectedApplication.job.title}</p>
                  <p className="text-sm text-cyan-400">{selectedApplication.job.department}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/50 text-sm">Applied Date</Label>
                    <p className="font-medium text-white">{new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-white/50 text-sm">Status</Label>
                    <div className="mt-1"><StatusBadge status={selectedApplication.status} /></div>
                  </div>
                </div>

                <div>
                  <Label className="text-white/50 text-sm">Your Cover Letter</Label>
                  <p className="mt-1 p-3 bg-white/5 rounded-lg text-sm text-white/80 whitespace-pre-wrap border border-white/10">
                    {selectedApplication.coverLetter}
                  </p>
                </div>

                {selectedApplication.adminNotes && (
                  <div>
                    <Label className="text-white/50 text-sm">Admin Feedback</Label>
                    <p className="mt-1 p-3 bg-white/5 rounded-lg text-sm text-white/80 border border-white/10">
                      {selectedApplication.adminNotes}
                    </p>
                  </div>
                )}

                {selectedApplication.status === 'PENDING' && (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl text-white font-medium shadow-lg transition-all"
                    onClick={() => {
                      handleWithdraw(selectedApplication.id);
                      setIsDialogOpen(false);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Withdraw Application
                  </button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
