import { forwardRef } from 'react';
import './Card.css';

const Card = forwardRef(({ 
  children, 
  variant = 'default',
  padding = 'medium',
  hoverable = false,
  onClick,
  className = '',
  ...props 
}, ref) => {
  const baseClass = 'card';
  const variantClass = `card-${variant}`;
  const paddingClass = `card-padding-${padding}`;
  const hoverClass = hoverable || onClick ? 'card-hoverable' : '';
  const customClass = className;

  const cardClasses = [
    baseClass,
    variantClass,
    paddingClass,
    hoverClass,
    customClass
  ].filter(Boolean).join(' ');

  const handleClick = onClick ? (e) => {
    if (!props.disabled) {
      onClick(e);
    }
  } : undefined;

  const cardProps = {
    ...props,
    ref,
    className: cardClasses,
    ...(onClick && { 
      onClick: handleClick,
      role: 'button',
      tabIndex: 0,
      onKeyDown: (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          handleClick(e);
        }
      }
    })
  };

  return (
    <div {...cardProps}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
