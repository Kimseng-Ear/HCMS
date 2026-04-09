import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, UserPlus, FileText, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'message' | 'employee_added' | 'document_uploaded' | 'task_completed' | 'leave_requested' | 'project_updated' | 'attendance_marked';
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  metadata?: {
    [key: string]: any;
  };
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
  refreshInterval?: number;
}

const activityIcons = {
  message: MessageSquare,
  employee_added: UserPlus,
  document_uploaded: FileText,
  task_completed: CheckCircle,
  leave_requested: AlertCircle,
  project_updated: TrendingUp,
  attendance_marked: Clock,
};

const activityColors = {
  message: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  employee_added: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  document_uploaded: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  task_completed: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  leave_requested: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  project_updated: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  attendance_marked: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities: initialActivities,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  className = '',
  refreshInterval
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities || []);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'employee_added',
      title: 'New Employee Onboarded',
      description: 'Sok Kanha joined the Engineering team',
      user: { name: 'Dara Kim', avatar: 'https://i.pravatar.cc/150?u=2' },
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
    {
      id: '2',
      type: 'leave_requested',
      title: 'Leave Request Submitted',
      description: 'Annual leave from Mar 20-25, 2024',
      user: { name: 'Kimsour Rith', avatar: 'https://i.pravatar.cc/150?u=6' },
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
    {
      id: '3',
      type: 'project_updated',
      title: 'Project Progress Updated',
      description: 'Mobile App Development is now 45% complete',
      user: { name: 'Vibol Meas', avatar: 'https://i.pravatar.cc/150?u=3' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: '4',
      type: 'task_completed',
      title: 'Task Completed',
      description: 'API Documentation has been completed',
      user: { name: 'Kimsour Rith', avatar: 'https://i.pravatar.cc/150?u=6' },
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    },
    {
      id: '5',
      type: 'attendance_marked',
      title: 'Attendance Marked',
      description: 'Clock in recorded for today',
      user: { name: 'Bopha Keo', avatar: 'https://i.pravatar.cc/150?u=4' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  ];

  useEffect(() => {
    if (!initialActivities) {
      setActivities(mockActivities);
    }
  }, [initialActivities]);

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        // In a real app, this would fetch new activities from the API
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Activity
          </h3>
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              No recent activity
            </p>
          </div>
        ) : (
          displayActivities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div key={activity.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                      <div className="flex items-center gap-1">
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.name}
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{activity.user.name}</span>
                      </div>
                      <span>•</span>
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showViewAll && activities.length > maxItems && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onViewAll}
            className="w-full text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            View All Activities ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
};

// Activity feed for specific contexts
export const EmployeeActivityFeed: React.FC<{ employeeId: string; className?: string }> = ({
  employeeId,
  className
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Fetch employee-specific activities
    // This would be an API call in a real app
    const employeeActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'attendance_marked',
        title: 'Clock In',
        description: 'Started work at 8:00 AM',
        user: { name: 'Sokha Chan', avatar: 'https://i.pravatar.cc/150?u=1' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        id: '2',
        type: 'task_completed',
        title: 'Task Completed',
        description: 'Fixed authentication bug',
        user: { name: 'Sokha Chan', avatar: 'https://i.pravatar.cc/150?u=1' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ];
    setActivities(employeeActivities);
  }, [employeeId]);

  return (
    <ActivityFeed
      activities={activities}
      maxItems={5}
      showViewAll={false}
      className={className}
    />
  );
};

export const ProjectActivityFeed: React.FC<{ projectId: string; className?: string }> = ({
  projectId,
  className
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Fetch project-specific activities
    const projectActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'project_updated',
        title: 'Progress Updated',
        description: 'Project moved from 40% to 45% completion',
        user: { name: 'Vibol Meas', avatar: 'https://i.pravatar.cc/150?u=3' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: '2',
        type: 'task_completed',
        title: 'Milestone Completed',
        description: 'Backend API development completed',
        user: { name: 'Kimsour Rith', avatar: 'https://i.pravatar.cc/150?u=6' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
      },
    ];
    setActivities(projectActivities);
  }, [projectId]);

  return (
    <ActivityFeed
      activities={activities}
      maxItems={5}
      showViewAll={false}
      className={className}
    />
  );
};
