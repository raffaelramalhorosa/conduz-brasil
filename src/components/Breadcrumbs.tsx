import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { routeLabels } from '@/lib/routes';

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 sm:mb-6">
      <Link 
        to="/" 
        className="hover:text-primary flex items-center gap-1 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathnames.map((_, index) => {
        const path = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[path] || pathnames[index];

        return (
          <div key={path} className={cn(
            "flex items-center gap-2",
            !isLast && "hidden sm:flex"
          )}>
            <ChevronRight className="w-4 h-4" />
            {isLast ? (
              <span className="font-medium text-foreground capitalize truncate max-w-[200px] sm:max-w-none">{label}</span>
            ) : (
              <Link 
                to={path} 
                className="hover:text-primary capitalize transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
