import React, { useState } from 'react';
import { Filter, X, Calendar, Users, Briefcase, DollarSign, ChevronDown } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  value?: any;
}

interface FilterGroup {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  options: FilterOption[];
  type: 'single' | 'multiple';
}

interface QuickFiltersProps {
  filters: FilterGroup[];
  activeFilters: Record<string, any>;
  onFilterChange: (groupId: string, value: any) => void;
  onClearAll: () => void;
  className?: string;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className = ''
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).filter(key => {
      const value = activeFilters[key];
      return value !== undefined && value !== null && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  };

  const handleFilterClick = (groupId: string, option: FilterOption) => {
    const group = filters.find(g => g.id === groupId);
    if (!group) return;

    if (group.type === 'single') {
      onFilterChange(groupId, option.value);
    } else {
      const currentValues = activeFilters[groupId] || [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter((v: any) => v !== option.value)
        : [...currentValues, option.value];
      onFilterChange(groupId, newValues);
    }
  };

  const getFilterDisplay = (groupId: string) => {
    const group = filters.find(g => g.id === groupId);
    if (!group) return '';

    const value = activeFilters[groupId];
    if (!value) return '';

    if (group.type === 'single') {
      const option = group.options.find(opt => opt.value === value);
      return option?.label || '';
    } else {
      if (Array.isArray(value) && value.length > 0) {
        const labels = value.map((v: any) => {
          const option = group.options.find(opt => opt.value === v);
          return option?.label || v;
        });
        return labels.join(', ');
      }
    }
    return '';
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Filter Pills */}
      {filters.map((group) => {
        const hasActiveFilter = activeFilters[group.id] !== undefined && 
                              activeFilters[group.id] !== null && 
                              activeFilters[group.id] !== '' &&
                              (Array.isArray(activeFilters[group.id]) ? 
                                activeFilters[group.id].length > 0 : true);

        return (
          <div key={group.id} className="relative">
            <button
              onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                hasActiveFilter
                  ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {group.icon && <group.icon className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {hasActiveFilter ? getFilterDisplay(group.id) : group.label}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${
                expandedGroup === group.id ? 'rotate-180' : ''
              }`} />
              {hasActiveFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange(group.id, group.type === 'single' ? undefined : []);
                  }}
                  className="ml-1 p-0.5 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>

            {/* Dropdown */}
            {expandedGroup === group.id && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setExpandedGroup(null)}
                />
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-modal z-50 min-w-48 animate-scale-in">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {group.label}
                    </div>
                    <div className="space-y-1">
                      {group.options.map((option) => {
                        const isActive = group.type === 'single'
                          ? activeFilters[group.id] === option.value
                          : Array.isArray(activeFilters[group.id]) && 
                            activeFilters[group.id].includes(option.value);

                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              handleFilterClick(group.id, option);
                              if (group.type === 'single') {
                                setExpandedGroup(null);
                              }
                            }}
                            className={`w-full px-3 py-2 flex items-center gap-3 rounded-lg transition-colors text-left ${
                              isActive
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {option.icon && (
                              <option.icon className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{option.label}</span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Clear All */}
      {getActiveFilterCount() > 0 && (
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear All ({getActiveFilterCount()})
        </button>
      )}

      {/* Filter Count Badge */}
      {getActiveFilterCount() === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span>No filters applied</span>
        </div>
      )}
    </div>
  );
};

// Preset filter configurations
export const employeeFilters: FilterGroup[] = [
  {
    id: 'department',
    label: 'Department',
    type: 'multiple',
    options: [
      { id: 'eng', label: 'Engineering', value: 'engineering' },
      { id: 'hr', label: 'Human Resources', value: 'hr' },
      { id: 'sales', label: 'Sales', value: 'sales' },
      { id: 'marketing', label: 'Marketing', value: 'marketing' },
      { id: 'finance', label: 'Finance', value: 'finance' },
    ]
  },
  {
    id: 'status',
    label: 'Status',
    type: 'multiple',
    options: [
      { id: 'active', label: 'Active', value: 'active' },
      { id: 'inactive', label: 'Inactive', value: 'inactive' },
      { id: 'onleave', label: 'On Leave', value: 'onleave' },
    ]
  },
  {
    id: 'employmentType',
    label: 'Employment Type',
    type: 'multiple',
    options: [
      { id: 'fulltime', label: 'Full-time', value: 'full-time' },
      { id: 'parttime', label: 'Part-time', value: 'part-time' },
      { id: 'contract', label: 'Contract', value: 'contract' },
      { id: 'intern', label: 'Intern', value: 'intern' },
    ]
  }
];

export const projectFilters: FilterGroup[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'multiple',
    options: [
      { id: 'planning', label: 'Planning', value: 'planning' },
      { id: 'active', label: 'Active', value: 'active' },
      { id: 'onhold', label: 'On Hold', value: 'onhold' },
      { id: 'completed', label: 'Completed', value: 'completed' },
    ]
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'single',
    options: [
      { id: 'high', label: 'High Priority', value: 'high' },
      { id: 'medium', label: 'Medium Priority', value: 'medium' },
      { id: 'low', label: 'Low Priority', value: 'low' },
    ]
  }
];
