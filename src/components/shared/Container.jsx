import { cn } from '@/lib/utils/cn';

export function Container({ as: Tag = 'div', className, children, size = 'lg', ...rest }) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[88rem]',
    full: 'max-w-none',
  };
  return (
    <Tag className={cn('mx-auto w-full px-5 sm:px-8 lg:px-10', sizes[size], className)} {...rest}>
      {children}
    </Tag>
  );
}
