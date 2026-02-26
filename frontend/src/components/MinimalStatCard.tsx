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
    icon: 'text-[#1D79C4]',
    iconBg: 'bg-[#1D79C4] bg-opacity-10',
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-[#1f2937]',
    value: 'text-[#000000]'
  },
  green: {
    icon: 'text-green-600',
    iconBg: 'bg-green-600 bg-opacity-10',
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-[#1f2937]',
    value: 'text-[#000000]'
  },
  red: {
    icon: 'text-red-600',
    iconBg: 'bg-red-600 bg-opacity-10',
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-[#1f2937]',
    value: 'text-[#000000]'
  },
  orange: {
    icon: 'text-orange-600',
    iconBg: 'bg-orange-600 bg-opacity-10',
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-[#1f2937]',
    value: 'text-[#000000]'
  },
  purple: {
    icon: 'text-purple-600',
    iconBg: 'bg-purple-600 bg-opacity-10',
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-[#1f2937]',
    value: 'text-[#000000]'
  },
  gray: {
    icon: 'text-gray-600',
    iconBg: 'bg-gray-600 bg-opacity-10',
    bg: 'bg-white',
    border: 'border-gray-200',
    title: 'text-[#1f2937]',
    value: 'text-[#000000]'
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
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-5 shadow-sm ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.title}`}>{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colors.value}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.iconBg} p-2 rounded-lg`}>
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
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="flex items-start space-x-3">
        <div className={`${colors.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
          <div className={`w-5 h-5 ${colors.icon}`}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
};
