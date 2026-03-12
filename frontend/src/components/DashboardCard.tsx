import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  trend,
  onClick,
}) => {
  return (
    <div
      className={`rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12 ${iconBgColor}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">{title}</p>
        <p className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">{value}</p>
        {subtitle && (
          <div className="mt-2 flex items-center text-sm text-slate-600 dark:text-slate-400">
            <span>{subtitle}</span>
          </div>
        )}
        {trend && (
          <div className={`mt-2 flex items-center text-sm ${trend.isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
            {trend.isPositive ? (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span>{Math.abs(trend.value).toFixed(1)}% {trend.label || 'vs mes pasado'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  children,
  action,
  className = '',
}) => {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">{title}</h2>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:gap-3">{actions}</div>}
    </div>
  );
};

interface DashboardButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const DashboardButton: React.FC<DashboardButtonProps> = ({
  label,
  icon,
  onClick,
  variant = 'primary',
}) => {
  const variantClasses = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${variantClasses}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{icon}</span>
    </button>
  );
};

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ children, columns = 4 }) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  return <div className={`grid ${gridClass} gap-4 sm:gap-6`}>{children}</div>;
};
