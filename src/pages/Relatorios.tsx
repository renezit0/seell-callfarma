import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function Relatorios() {
  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-2xl mx-auto mt-20">
        <CardHeader className="text-center">
          <Construction className="w-16 h-16 mx-auto text-warning mb-4" />
          <CardTitle className="text-2xl text-foreground">
            Página em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground text-lg">
            A funcionalidade de <strong>Relatórios</strong> está sendo desenvolvida e estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}