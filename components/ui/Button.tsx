import React from 'react';

// FIX: Added 'size' to the ButtonProps interface.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'link';
  size?: 'default' | 'sm' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'default',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'hover:bg-slate-100 hover:text-slate-900',
    outline: 'border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900',
    link: 'text-blue-600 underline-offset-4 hover:underline bg-transparent',
  };

  const sizeClasses = {
    default: 'px-4 py-2',
    sm: 'p-2',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      // FIX: Replaced hardcoded padding with dynamic size classes.
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};
