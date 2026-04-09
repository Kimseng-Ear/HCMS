import React, { useState, useEffect } from 'react';
import { Api } from '../services/api';
import { Job, Candidate, ApplicationStatus, Department, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Plus, Search, Filter, Briefcase, User, MapPin, Calendar, DollarSign, MoreVertical, Trash2, Pencil, CheckCircle, XCircle, ChevronRight, FileText, Download, Upload } from 'lucide-react';
import { formatCurrency } from '../utils';

export const Recruitment: React.FC = () => {
    const { hasRole } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

    // Form states
    const [jobForm, setJobForm] = useState<Partial<Job>>({
        title: '', departmentId: '', description: '', requirements: [], status: 'OPEN', location: '', salaryRange: '', type: 'Full-time'
    });
    const [candidateForm, setCandidateForm] = useState<Partial<Candidate>>({
        name: '', email: '', phone: '', jobId: '', status: ApplicationStatus.APPLIED, notes: ''
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsData, candidatesData, deptsData] = await Promise.all([
                Api.recruitment.getJobs(),
                Api.recruitment.getCandidates(),
                Api.departments.getAll()
            ]);
            setJobs(jobsData);
            setCandidates(candidatesData);
            setDepartments(deptsData);
        } catch (error) {
            showToast('Failed to load recruitment data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingJob) {
                await Api.recruitment.updateJob({ ...editingJob, ...jobForm } as Job);
                showToast('Job updated successfully', 'success');
            } else {
                await Api.recruitment.createJob({ ...jobForm, postedDate: new Date().toISOString().split('T')[0] } as Job);
                showToast('Job created successfully', 'success');
            }
            setShowJobModal(false);
            setEditingJob(null);
            setJobForm({ title: '', departmentId: '', description: '', requirements: [], status: 'OPEN', location: '', salaryRange: '', type: 'Full-time' });
            fetchData();
        } catch (error) {
            showToast('Failed to save job', 'error');
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            await Api.recruitment.deleteJob(id);
            showToast('Job deleted successfully', 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to delete job', 'error');
        }
    };

    const handleSaveCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const candidateData = { ...candidateForm };
            if (resumeFile) {
                candidateData.resumeUrl = URL.createObjectURL(resumeFile);
            }

            if (editingCandidate) {
                await Api.recruitment.updateCandidate({ ...editingCandidate, ...candidateData } as Candidate);
                showToast('Candidate updated successfully', 'success');
            } else {
                await Api.recruitment.createCandidate({ ...candidateData, appliedDate: new Date().toISOString().split('T')[0] } as Candidate);
                showToast('Candidate added successfully', 'success');
            }
            setShowCandidateModal(false);
            setEditingCandidate(null);
            setCandidateForm({ name: '', email: '', phone: '', jobId: '', status: ApplicationStatus.APPLIED, notes: '' });
            setResumeFile(null);
            fetchData();
        } catch (error) {
            showToast('Failed to save candidate', 'error');
        }
    };

    const handleDeleteCandidate = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this candidate?')) return;
        try {
            await Api.recruitment.deleteCandidate(id);
            showToast('Candidate deleted successfully', 'success');
            fetchData();
        } catch (error) {
            showToast('Failed to delete candidate', 'error');
        }
    };

    const openJobModal = (job?: Job) => {
        if (job) {
            setEditingJob(job);
            setJobForm(job);
        } else {
            setEditingJob(null);
            setJobForm({ title: '', departmentId: departments[0]?.id || '', description: '', requirements: [], status: 'OPEN', location: 'Phnom Penh', salaryRange: '', type: 'Full-time' });
        }
        setShowJobModal(true);
    };

    const openCandidateModal = (candidate?: Candidate) => {
        if (candidate) {
            setEditingCandidate(candidate);
            setCandidateForm(candidate);
            setResumeFile(null);
        } else {
            setEditingCandidate(null);
            setCandidateForm({ name: '', email: '', phone: '', jobId: jobs[0]?.id || '', status: ApplicationStatus.APPLIED, notes: '' });
            setResumeFile(null);
        }
        setShowCandidateModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'success';
            case 'CLOSED': return 'danger';
            case ApplicationStatus.HIRED: return 'success';
            case ApplicationStatus.REJECTED: return 'danger';
            case ApplicationStatus.OFFER: return 'warning';
            default: return 'info';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Recruitment</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">Manage jobs and candidates</p>
                </div>
                <div className="flex gap-2 relative z-10">
                    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'jobs' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Jobs
                        </button>
                        <button
                            onClick={() => setActiveTab('candidates')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'candidates' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Candidates
                        </button>
                    </div>
                    {hasRole([Role.ADMIN, Role.HR]) && (
                        <Button onClick={() => activeTab === 'jobs' ? openJobModal() : openCandidateModal()} className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 rounded-xl py-2.5 font-bold">
                            <Plus className="w-4 h-4 mr-2" /> {activeTab === 'jobs' ? 'Post Job' : 'Add Candidate'}
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'jobs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{job.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                <span>{departments.find(d => d.id === job.departmentId)?.name}</span>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusColor(job.status) as any}>{job.status}</Badge>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {job.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <DollarSign className="w-4 h-4 text-slate-400" />
                                            {job.salaryRange || 'Negotiable'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            Posted {new Date(job.postedDate).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <Button size="sm" variant="outline" onClick={() => openJobModal(job)} className="flex-1">
                                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteJob(job.id)} className="px-3">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'candidates' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Candidate</th>
                                            <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Applied For</th>
                                            <th className="hidden md:table-cell px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Match</th>
                                            <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Status</th>
                                            <th className="hidden sm:table-cell px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Resume</th>
                                            <th className="hidden lg:table-cell px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Date</th>
                                            <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {candidates.map(candidate => (
                                            <tr key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{candidate.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                        {jobs.find(j => j.id === candidate.jobId)?.title || 'Unknown Job'}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    {candidate.matchScore ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 w-16">
                                                                <div 
                                                                    className={`h-2 rounded-full ${candidate.matchScore >= 80 ? 'bg-green-500' : candidate.matchScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                                    style={{ width: `${candidate.matchScore}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{candidate.matchScore}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={getStatusColor(candidate.status) as any}>{candidate.status}</Badge>
                                                </td>
                                                <td className="hidden sm:table-cell px-6 py-4">
                                                    {candidate.resumeUrl ? (
                                                        <a 
                                                            href={candidate.resumeUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                        >
                                                            <FileText className="w-4 h-4" /> View
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">No Resume</span>
                                                    )}
                                                </td>
                                                <td className="hidden lg:table-cell px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {new Date(candidate.appliedDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openCandidateModal(candidate)} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteCandidate(candidate.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Job Modal */}
            {showJobModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingJob ? 'Edit Job' : 'Post New Job'}</h2>
                            <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveJob} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={jobForm.title}
                                    onChange={e => setJobForm({...jobForm, title: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                    <select 
                                        value={jobForm.departmentId}
                                        onChange={e => setJobForm({...jobForm, departmentId: e.target.value})}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                                    <select 
                                        value={jobForm.type}
                                        onChange={e => setJobForm({...jobForm, type: e.target.value as any})}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Location</label>
                                <input 
                                    type="text" 
                                    value={jobForm.location}
                                    onChange={e => setJobForm({...jobForm, location: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Salary Range</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. $1000 - $2000"
                                    value={jobForm.salaryRange}
                                    onChange={e => setJobForm({...jobForm, salaryRange: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea 
                                    rows={3}
                                    value={jobForm.description}
                                    onChange={e => setJobForm({...jobForm, description: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Requirements (one per line)</label>
                                <textarea 
                                    rows={3}
                                    value={jobForm.requirements?.join('\n')}
                                    onChange={e => setJobForm({...jobForm, requirements: e.target.value.split('\n')})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="- Bachelor's degree&#10;- 3+ years experience"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <select 
                                    value={jobForm.status}
                                    onChange={e => setJobForm({...jobForm, status: e.target.value as "OPEN" | "CLOSED"})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold">
                                    {editingJob ? 'Update Job' : 'Post Job'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Candidate Modal */}
            {showCandidateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingCandidate ? 'Edit Candidate' : 'Add Candidate'}</h2>
                            <button onClick={() => setShowCandidateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCandidate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={candidateForm.name}
                                    onChange={e => setCandidateForm({...candidateForm, name: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={candidateForm.email}
                                        onChange={e => setCandidateForm({...candidateForm, email: e.target.value})}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                    <input 
                                        type="text" 
                                        value={candidateForm.phone}
                                        onChange={e => setCandidateForm({...candidateForm, phone: e.target.value})}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Applying For</label>
                                <select 
                                    value={candidateForm.jobId}
                                    onChange={e => setCandidateForm({...candidateForm, jobId: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">Select Job</option>
                                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <select 
                                    value={candidateForm.status}
                                    onChange={e => setCandidateForm({...candidateForm, status: e.target.value as ApplicationStatus})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Resume / CV</label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center hover:border-primary-500 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.doc,.docx"
                                        onChange={e => setResumeFile(e.target.files ? e.target.files[0] : null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-6 h-6 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            {resumeFile ? resumeFile.name : (candidateForm.resumeUrl ? "Resume uploaded. Click to replace." : "Click to upload or drag and drop")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                                <textarea 
                                    rows={3}
                                    value={candidateForm.notes || ''}
                                    onChange={e => setCandidateForm({...candidateForm, notes: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Additional notes about the candidate..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold">
                                    {editingCandidate ? 'Update Candidate' : 'Add Candidate'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
