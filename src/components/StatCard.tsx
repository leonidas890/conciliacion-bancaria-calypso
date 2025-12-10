import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, color = 'primary', className }: StatCardProps) => {
  return (
    <div className={cn("w-[189px] h-[189px]", className)}>
      <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-shadow">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full gap-3">
          <div className={cn(
            "p-3 rounded-full",
            color === 'success' && "bg-success/20 text-success",
            color === 'warning' && "bg-warning/20 text-warning",
            color === 'primary' && "bg-primary/20 text-primary",
            color === 'accent' && "bg-accent text-accent-foreground"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
