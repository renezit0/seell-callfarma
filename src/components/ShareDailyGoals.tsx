import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { MetricData } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import { MetricCard } from "./MetricCard";

interface ShareDailyGoalsProps {
  metrics: MetricData[];
  lojaInfo?: { numero: string; nome: string } | null;
  selectedPeriod?: { label: string; startDate: Date; endDate: Date } | null;
}

export function ShareDailyGoals({ metrics, lojaInfo, selectedPeriod }: ShareDailyGoalsProps) {
  const shareRef = useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    if (!shareRef.current || !metrics.length) return;

    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#fafafa',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: shareRef.current.scrollWidth,
        height: shareRef.current.scrollHeight,
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      return null;
    }
  };

  const handleShare = async () => {
    try {
      const imageData = await generateImage();
      if (!imageData) return;

      // Converter para blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      if (navigator.share && navigator.canShare) {
        // Web Share API (mobile)
        const file = new File([blob], 'metas-diarias.png', { type: 'image/png' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Metas Diárias',
            text: 'Confira as metas diárias da nossa loja!',
            files: [file]
          });
          toast.success('Imagem compartilhada com sucesso!');
        } else {
          // Fallback para compartilhamento sem arquivo
          await navigator.share({
            title: 'Metas Diárias',
            text: 'Confira as metas diárias da nossa loja!'
          });
          downloadImage(imageData);
        }
      } else {
        // Fallback para download
        downloadImage(imageData);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar a imagem');
    }
  };

  const downloadImage = (imageData: string) => {
    const link = document.createElement('a');
    link.download = `metas-diarias-${format(new Date(), 'dd-MM-yyyy')}.png`;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagem baixada com sucesso!');
  };

  if (!metrics.length) return null;

  return (
    <div className="space-y-4">
      {/* Elemento invisível que será capturado */}
      <div 
        ref={shareRef} 
        className="fixed -top-[9999px] left-0 w-[540px] bg-background p-6 space-y-6"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">METAS DIÁRIAS</h1>
          <p className="text-base text-muted-foreground">
            {lojaInfo ? `${lojaInfo.numero} - ${lojaInfo.nome}` : 'Loja'}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {selectedPeriod && (
            <p className="text-sm text-muted-foreground">{selectedPeriod.label}</p>
          )}
        </div>

        {/* Cards das métricas - exatamente como aparecem na tela */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              todaySales={metric.todaySales}
              periodSales={metric.periodSales}
              target={metric.target}
              dailyTarget={metric.dailyTarget}
              missingToday={metric.missingToday}
              remainingDays={metric.remainingDays}
              category={metric.category}
              status={metric.status}
              className="w-full"
            />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleShare}
          className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Compartilhar Metas</span>
          <span className="sm:hidden">Compartilhar</span>
        </Button>
        <Button 
          onClick={async () => {
            const imageData = await generateImage();
            if (imageData) downloadImage(imageData);
          }}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}