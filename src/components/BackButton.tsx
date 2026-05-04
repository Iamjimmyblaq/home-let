import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BackButton = ({ to, label = 'Back', className = '' }: { to?: string; label?: string; className?: string }) => {
  const navigate = useNavigate();
  const onClick = () => {
    if (to) navigate(to);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={`-ml-2 mb-4 ${className}`}>
      <ArrowLeft className="h-4 w-4" /> {label}
    </Button>
  );
};
