import { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { jobService, JobPosting, JobPostingRequest } from '../../services/jobService';
import { Plus, Pencil, Trash2, XCircle, Briefcase, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

// Glassmorphism Card
const GlassCard = ({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`
    bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
    ${hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CLOSED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    FILLED: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.ACTIVE}`}>
      {status}
    </span>
  );
};

export default function JobPostings() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [formData, setFormData] = useState<JobPostingRequest>({
    title: '',
    description: '',
    department: '',
    location: '',
    hourlyRate: 0,
    maxHoursPerWeek: 20,
    totalPositions: 1,
    applicationDeadline: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await jobService.getAllJobs();
      setJobs(data);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await jobService.updateJob(editingJob.id, formData);
        toast.success('Job updated successfully');
      } else {
        await jobService.createJob(formData);
        toast.success('Job created successfully');
      }
      setIsDialogOpen(false);
      setEditingJob(null);
      resetForm();
      loadJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save job');
    }
  };

  const handleEdit = (job: JobPosting) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      hourlyRate: job.hourlyRate,
      maxHoursPerWeek: job.maxHoursPerWeek,
      totalPositions: job.totalPositions,
      applicationDeadline: job.applicationDeadline.split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await jobService.deleteJob(id);
      toast.success('Job deleted successfully');
      loadJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleClose = async (id: number) => {
    try {
      await jobService.closeJob(id);
      toast.success('Job closed successfully');
      loadJobs();
    } catch (error) {
      toast.error('Failed to close job');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      location: '',
      hourlyRate: 0,
      maxHoursPerWeek: 20,
      totalPositions: 1,
      applicationDeadline: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Job Postings</h1>
            <p className="text-white/60">Manage work-study positions across campus</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                onClick={() => { setEditingJob(null); resetForm(); }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                <Plus className="h-5 w-5" />
                Post New Job
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-xl border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">{editingJob ? 'Edit Job' : 'Post New Job'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white/70">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white/70">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white/70">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-white/70">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-white/70">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxHoursPerWeek" className="text-white/70">Max Hours/Week</Label>
                    <Input
                      id="maxHoursPerWeek"
                      type="number"
                      value={formData.maxHoursPerWeek}
                      onChange={(e) => setFormData({ ...formData, maxHoursPerWeek: parseInt(e.target.value) })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalPositions" className="text-white/70">Positions</Label>
                    <Input
                      id="totalPositions"
                      type="number"
                      value={formData.totalPositions}
                      onChange={(e) => setFormData({ ...formData, totalPositions: parseInt(e.target.value) })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-white/70">Application Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/25 transition-all"
                >
                  {editingJob ? 'Update Job' : 'Post Job'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="mt-4 text-white/50">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <GlassCard className="p-12 text-center" hover={false}>
            <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">No job postings yet.</p>
          </GlassCard>
        ) : (
          <GlassCard className="overflow-hidden" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/50 text-sm font-medium p-4">Title</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Department</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Rate</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Positions</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Status</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Deadline</th>
                    <th className="text-left text-white/50 text-sm font-medium p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{job.title}</td>
                      <td className="p-4 text-white/70">{job.department}</td>
                      <td className="p-4 text-emerald-400 font-medium">${job.hourlyRate}/hr</td>
                      <td className="p-4 text-white/70">{job.filledPositions}/{job.totalPositions}</td>
                      <td className="p-4"><StatusBadge status={job.status} /></td>
                      <td className="p-4 text-white/70">{new Date(job.applicationDeadline).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(job)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          {job.status === 'ACTIVE' && (
                            <button onClick={() => handleClose(job.id)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-amber-400 transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(job.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
