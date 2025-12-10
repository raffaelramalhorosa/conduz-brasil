import { Construction } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';

interface AdminPlaceholderProps {
  title: string;
}

export default function AdminPlaceholder({ title }: AdminPlaceholderProps) {
  return (
    <div>
      <AdminHeader title={title} />
      
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Construction className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Página em Construção
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
