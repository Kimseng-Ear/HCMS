import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Enhanced tooltip component
const CustomTooltip = ({ active, payload, label, theme = 'light' }: any) => {
  if (active && payload && payload.length) {
    const bgColor = theme === 'dark' ? '#1e293b' : '#ffffff';
    const borderColor = theme === 'dark' ? '#475569' : '#e2e8f0';
    const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';

    return (
      <div
        className="p-3 rounded-lg shadow-lg border"
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          color: textColor
        }}
      >
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="capitalize">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Common color palettes
export const chartColors = {
  primary: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  success: ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  rainbow: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'],
  pastel: ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa']
};

interface ChartProps {
  data: any[];
  theme?: 'light' | 'dark';
  height?: number;
  className?: string;
}

// Enhanced Bar Chart
export const EnhancedBarChart: React.FC<ChartProps & {
  dataKey: string;
  xAxisKey: string;
  colors?: string[];
  showGrid?: boolean;
}> = ({
  data,
  dataKey,
  xAxisKey,
  colors = chartColors.primary,
  theme = 'light',
  height = 300,
  showGrid = true,
  className = ''
}) => {
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <Tooltip content={<CustomTooltip theme={theme} />} />
          <Bar 
            dataKey={dataKey} 
            fill={colors[0]}
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Line Chart
export const EnhancedLineChart: React.FC<ChartProps & {
  dataKeys: string[];
  colors?: string[];
  smooth?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
}> = ({
  data,
  dataKeys,
  colors = chartColors.primary,
  theme = 'light',
  height = 300,
  smooth = true,
  showGrid = true,
  showDots = true,
  className = ''
}) => {
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
          <XAxis 
            dataKey="name" 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <Tooltip content={<CustomTooltip theme={theme} />} />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type={smooth ? "monotone" : "linear"}
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={showDots ? { fill: colors[index % colors.length], strokeWidth: 2, r: 4 } : false}
              activeDot={{ r: 6 }}
              animationBegin={0}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Pie Chart
export const EnhancedPieChart: React.FC<ChartProps & {
  dataKey: string;
  nameKey: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}> = ({
  data,
  dataKey,
  nameKey,
  colors = chartColors.rainbow,
  theme = 'light',
  height = 300,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  className = ''
}) => {
  const strokeColor = theme === 'dark' ? '#1e293b' : '#ffffff';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            animationBegin={0}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                stroke={strokeColor}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip theme={theme} />} />
          {showLabels && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Area Chart
export const EnhancedAreaChart: React.FC<ChartProps & {
  dataKeys: string[];
  colors?: string[];
  smooth?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}> = ({
  data,
  dataKeys,
  colors = chartColors.primary,
  theme = 'light',
  height = 300,
  smooth = true,
  showGrid = true,
  stacked = false,
  className = ''
}) => {
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
          <XAxis 
            dataKey="name" 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <Tooltip content={<CustomTooltip theme={theme} />} />
          <Legend />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type={smooth ? "monotone" : "linear"}
              dataKey={key}
              stackId={stacked ? "stack" : undefined}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.6}
              strokeWidth={2}
              animationBegin={0}
              animationDuration={1500}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Radar Chart for performance metrics
export const EnhancedRadarChart: React.FC<ChartProps & {
  dataKey: string;
  colors?: string[];
}> = ({
  data,
  dataKey,
  colors = chartColors.primary,
  theme = 'light',
  height = 300,
  className = ''
}) => {
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke={gridColor} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: textColor, fontSize: 12 }} />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: textColor, fontSize: 10 }}
          />
          <Radar
            name="Performance"
            dataKey={dataKey}
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip theme={theme} />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Combo Chart (Bar + Line)
export const ComboChart: React.FC<ChartProps & {
  barDataKey: string;
  lineDataKeys: string[];
  colors?: string[];
}> = ({
  data,
  barDataKey,
  lineDataKeys,
  colors = chartColors.rainbow,
  theme = 'light',
  height = 300,
  className = ''
}) => {
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis 
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
          />
          <Tooltip content={<CustomTooltip theme={theme} />} />
          <Legend />
          <Bar 
            dataKey={barDataKey} 
            fill={colors[0]}
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={1000}
          />
          {lineDataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index + 1]}
              strokeWidth={2}
              dot={{ fill: colors[index + 1], strokeWidth: 2, r: 4 }}
              animationBegin={0}
              animationDuration={1500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Chart container with title and actions
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  actions,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};
