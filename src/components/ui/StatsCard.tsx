import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-200 dark:border-primary-800',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'text-success-600 dark:text-success-400',
    border: 'border-success-200 dark:border-success-800',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    icon: 'text-warning-600 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-800',
  },
  error: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    icon: 'text-error-600 dark:text-error-400',
    border: 'border-error-200 dark:border-error-800',
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors = {
  up: 'text-success-600 dark:text-success-400',
  down: 'text-error-600 dark:text-error-400',
  neutral: 'text-slate-600 dark:text-slate-400',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  loading = false,
  onClick,
  className = '',
}) => {
  const colorClass = colorClasses[color];
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="w-16 h-4 sm:w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="w-20 h-8 sm:w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="w-16 h-3 sm:w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-lg ${colorClass.bg}`}>
          <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${colorClass.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${trendColors[trend.direction]}`}>
            <TrendIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{trend.value}%</span>
            <span className="xs:hidden">{trend.value}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{title}</p>
        {trend && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 hidden sm:block">
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );
};

export const StatsGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};
