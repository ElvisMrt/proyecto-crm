import React from 'react';
import { Link } from 'react-router-dom';

interface MinimalStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
  href?: string;
}

const colorClasses = {
  blue: {
    icon: 'text-slate-700 dark:text-slate-200',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    title: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white'
  },
  green: {
    icon: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    title: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white'
  },
  red: {
    icon: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-50 dark:bg-rose-950/40',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    title: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white'
  },
  orange: {
    icon: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    title: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white'
  },
  purple: {
    icon: 'text-slate-700 dark:text-slate-200',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    title: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white'
  },
  gray: {
    icon: 'text-slate-600 dark:text-slate-300',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    title: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-950 dark:text-white'
  }
};

export const MinimalStatCard: React.FC<MinimalStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  href
}) => {
  const colors = colorClasses[color];
  
  const content = (
    <div className={`${colors.bg} border ${colors.border} rounded-[24px] p-5 shadow-sm ${href ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.title}`}>{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colors.value}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.iconBg} rounded-2xl p-2`}>
          <div className={`w-6 h-6 ${colors.icon}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

interface MinimalActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
}

export const MinimalActionCard: React.FC<MinimalActionCardProps> = ({
  title,
  description,
  icon,
  href,
  color
}) => {
  const colors = colorClasses[color];

  return (
    <Link 
      to={href}
      className="group rounded-[24px] border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-start space-x-3">
        <div className={`${colors.iconBg} rounded-2xl p-2 transition-transform group-hover:scale-110`}>
          <div className={`w-5 h-5 ${colors.icon}`}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
    </Link>
  );
};
