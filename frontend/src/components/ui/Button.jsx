import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props 
}, ref) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = fullWidth ? 'btn-full' : '';
  const disabledClass = disabled || loading ? 'btn-disabled' : '';
  const customClass = className;

  const buttonClasses = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    disabledClass,
    customClass
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-loader">
          <svg className="btn-spinner" viewBox="0 0 24 24">
            <circle className="btn-spinner-circle" cx="12" cy="12" r="10" />
          </svg>
        </span>
      )}
      {!loading && icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-content">{children}</span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
