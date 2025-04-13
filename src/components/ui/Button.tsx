import React, { ButtonHTMLAttributes, useState } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isOutlined?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const VariantStyles = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-400 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-800 border-slate-500 text-white',
  danger: 'bg-red-600 hover:bg-red-700 border-red-400 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 border-amber-300 text-white',
  info: 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400 text-white',
};

const OutlinedStyles = {
  primary: 'bg-transparent hover:bg-indigo-900/20 text-indigo-400 border-indigo-500',
  secondary: 'bg-transparent hover:bg-slate-900/30 text-slate-300 border-slate-500',
  danger: 'bg-transparent hover:bg-red-900/20 text-red-400 border-red-500',
  success: 'bg-transparent hover:bg-emerald-900/20 text-emerald-400 border-emerald-500',
  warning: 'bg-transparent hover:bg-amber-900/20 text-amber-400 border-amber-500',
  info: 'bg-transparent hover:bg-cyan-900/20 text-cyan-400 border-cyan-500',
};

const SizeStyles = {
  sm: 'text-xs py-1 px-2',
  md: 'text-sm py-2 px-4',
  lg: 'text-base py-3 px-6',
};

const GlowStyles = {
  primary: 'shadow-[0_0_15px_rgba(79,70,229,0.5)]',
  secondary: 'shadow-[0_0_15px_rgba(100,116,139,0.5)]',
  danger: 'shadow-[0_0_15px_rgba(220,38,38,0.5)]',
  success: 'shadow-[0_0_15px_rgba(5,150,105,0.5)]',
  warning: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
  info: 'shadow-[0_0_15px_rgba(8,145,178,0.5)]',
};

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isOutlined = false,
  leftIcon,
  rightIcon,
  glow = false,
  disabled,
  ...props
}: ButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const variantStyle = isOutlined ? OutlinedStyles[variant] : VariantStyles[variant];
  const sizeStyle = SizeStyles[size];
  const glowStyle = glow ? GlowStyles[variant] : '';
  
  return (
    <button
      className={cn(
        'relative select-none rounded border transition-all duration-200 ease-out',
        'backdrop-blur-sm font-medium tracking-wide',
        'inline-flex items-center justify-center overflow-hidden',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantStyle,
        sizeStyle,
        glowStyle,
        className,
        isPressed && 'scale-95'
      )}
      disabled={disabled || isLoading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => isPressed && setIsPressed(false)}
      {...props}
    >
      {/* Hover effect */}
      <span className="absolute inset-0 overflow-hidden rounded">
        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shine_1.5s_ease-in-out]" />
      </span>
      
      {/* Button content */}
      <span className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span>{leftIcon}</span>}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
          </>
        )}
      </span>
      
      {/* Bottom scanner effect */}
      <span className="absolute bottom-0 left-0 h-[2px] w-full">
        <span className={cn(
          "absolute h-full w-10 animate-[scanner_3s_ease-in-out_infinite] opacity-50",
          variant === 'primary' && 'bg-indigo-300',
          variant === 'secondary' && 'bg-slate-300',
          variant === 'danger' && 'bg-red-300',
          variant === 'success' && 'bg-emerald-300',
          variant === 'warning' && 'bg-amber-300',
          variant === 'info' && 'bg-cyan-300',
        )} />
      </span>
    </button>
  );
};

export default Button; 