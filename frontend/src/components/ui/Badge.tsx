import React from 'react';
import type { HttpMethod } from '@/types';
import { getMethodBadgeClass, getStatusBadgeClass } from '@/lib/utils';

interface MethodBadgeProps {
  method: HttpMethod;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-bold tracking-wider rounded',
    md: 'text-xs px-2.5 py-1 font-bold tracking-wide rounded-md',
    lg: 'text-sm px-3.5 py-1.5 font-bold tracking-wide rounded-lg',
  }[size];

  return (
    <span className={`inline-flex items-center justify-center font-mono uppercase ${sizeClasses} ${getMethodBadgeClass(method)} ${className}`}>
      {method}
    </span>
  );
};

interface StatusBadgeProps {
  status: number;
  statusText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, statusText, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded font-mono font-medium',
    md: 'text-sm px-3 py-1 rounded-md font-mono font-semibold',
    lg: 'text-base px-4 py-1.5 rounded-lg font-mono font-bold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} ${getStatusBadgeClass(status)} ${className}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-80 animate-pulse" />
      <span>{status}</span>
      {statusText && <span className="font-sans font-normal opacity-85 text-xs">({statusText})</span>}
    </span>
  );
};
