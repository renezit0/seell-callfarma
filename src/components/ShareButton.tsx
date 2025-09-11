import { Button } from "@/components/ui/button";
import { Share2, Download, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MetricData } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { getIconeCategoria, getCorCategoria, getClasseBgCategoria } from "@/utils/categories";

interface ShareButtonProps {
  metrics: MetricData[];
  lojaInfo?: { numero: string; nome: string } | null;
  selectedPeriod?: { label: string; startDate: Date; endDate: Date } | null;
}

export function ShareButton({ metrics, lojaInfo, selectedPeriod }: ShareButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isMobile = useIsMobile();

  const generateImage = async (): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !metrics.length) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    setIsGenerating(true);

    try {
      // Configurações para mobile (9:16 ratio)
      const width = 540;
      const height = 960;
      canvas.width = width;
      canvas.height = height;

      // Background gradient claro (igual ao design da página)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(0.5, '#f1f5f9');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Configurações de fonte
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Header principal
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText('METAS DIÁRIAS', width / 2, 70);
      
      // Informações da loja
      const lojaText = lojaInfo ? `${lojaInfo.numero} - ${lojaInfo.nome}` : 'Loja';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(lojaText, width / 2, 100);
      
      // Data de hoje
      const hoje = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(hoje, width / 2, 125);

      // Período selecionado
      if (selectedPeriod) {
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Período: ${selectedPeriod.label}`, width / 2, 145);
      }

      // Mapear categorias e configurações
      const categoryMap: Record<string, string> = {
        'geral': 'geral',
        'rentavel': 'r_mais',
        'perfumaria': 'perfumaria_r_mais',
        'conveniencia': 'conveniencia_r_mais',
        'goodlife': 'goodlife'
      };

      // Cards das metas
      let yPos = 180;
      const cardHeight = 120;
      const cardMargin = 12;
      const cardWidth = width - 40;
      const cardX = 20;

      metrics.forEach((metric) => {
        const mappedCategory = categoryMap[metric.category] || metric.category;
        const categoryColor = getCorCategoria(mappedCategory);
        
        // Sombra do card
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(cardX + 3, yPos + 3, cardWidth, cardHeight);
        
        // Background do card (branco)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cardX, yPos, cardWidth, cardHeight);
        
        // Borda do card
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, yPos, cardWidth, cardHeight);
        
        // Borda lateral colorida (seguindo o padrão dos cards reais)
        ctx.fillStyle = categoryColor;
        ctx.fillRect(cardX, yPos, 4, cardHeight);
        
        // Área do ícone (círculo colorido)
        const iconX = cardX + 20;
        const iconY = yPos + 20;
        const iconSize = 40;
        
        // Background do ícone (cor da categoria com transparência)
        const iconBgColor = categoryColor + '20'; // 20% transparency
        ctx.fillStyle = iconBgColor;
        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, 8);
        ctx.fill();
        
        // Símbolos para cada categoria (substituindo Font Awesome)
        const categoryIcons: Record<string, string> = {
          'geral': '🏪',
          'rentavel': '💰', 
          'perfumaria': '💄',
          'conveniencia': '🛒',
          'goodlife': '🌿'
        };
        
        const iconSymbol = categoryIcons[metric.category] || '📊';
        ctx.fillStyle = categoryColor;
        ctx.font = '20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(iconSymbol, iconX + iconSize/2, iconY + iconSize/2 + 2);
        
        // Título da categoria
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(metric.title, cardX + 80, yPos + 30);
        
        // Subtítulo "Categoria"
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('Categoria', cardX + 80, yPos + 50);
        
        // Meta diária - área destacada (seguindo o padrão dos cards reais)
        const metaAreaX = cardX + 15;
        const metaAreaY = yPos + 70;
        const metaAreaWidth = cardWidth - 30;
        const metaAreaHeight = 35;
        
        // Background da área da meta (azul claro como no design real)
        ctx.fillStyle = '#f0f9ff';
        ctx.beginPath();
        ctx.roundRect(metaAreaX, metaAreaY, metaAreaWidth, metaAreaHeight, 6);
        ctx.fill();
        
        // Borda da área da meta
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Ícone e texto "Meta Diária"
        ctx.fillStyle = '#0ea5e9';
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📈 Meta Diária', metaAreaX + 10, metaAreaY + 12);
        
        // Valor da meta
        ctx.fillStyle = '#0ea5e9';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(metric.dailyTarget || 'R$ 0,00', metaAreaX + metaAreaWidth - 10, metaAreaY + 25);
        
        yPos += cardHeight + cardMargin;
      });

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Gerado automaticamente • ' + format(new Date(), 'dd/MM/yyyy HH:mm'), 
        width / 2, 
        height - 20
      );

      return canvas.toDataURL('image/png');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      const imageData = await generateImage();
      if (!imageData) {
        toast.error('Erro ao gerar a imagem');
        return;
      }

      // Converter para blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      if (navigator.share && isMobile) {
        // Web Share API para mobile
        const file = new File([blob], 'metas-diarias.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Metas Diárias',
            text: 'Confira as metas diárias da nossa loja!',
            files: [file]
          });
          toast.success('Imagem compartilhada!');
        } else {
          // Fallback para download
          downloadImage(imageData);
        }
      } else {
        // Desktop ou fallback - fazer download
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
    toast.success('Imagem baixada!');
  };

  if (!metrics.length) return null;

  return (
    <div className="flex gap-2">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Botão principal de compartilhar */}
      <Button 
        onClick={handleShare}
        disabled={isGenerating}
        size="sm"
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isGenerating ? (
          <i className="fas fa-spinner fa-spin w-4 h-4 mr-2" />
        ) : (
          <Share2 className="w-4 h-4 mr-2" />
        )}
        <span className="hidden sm:inline">
          {isGenerating ? 'Gerando...' : 'Compartilhar'}
        </span>
        <span className="sm:hidden">
          <ImageIcon className="w-4 h-4" />
        </span>
      </Button>

      {/* Botão de download separado para desktop */}
      {!isMobile && (
        <Button 
          onClick={async () => {
            const imageData = await generateImage();
            if (imageData) downloadImage(imageData);
          }}
          disabled={isGenerating}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}