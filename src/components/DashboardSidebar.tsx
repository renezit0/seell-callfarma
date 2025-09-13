import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import miniIconWhite from "@/assets/mini-icon-white.png";
import { getDescricaoTipoUsuario } from "@/utils/userTypes";

interface SidebarItem {
  icon: string;
  label: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: "fas fa-tachometer-alt", label: "Dashboard", href: "/" },
  { icon: "fas fa-chart-line", label: "Vendas", href: "/vendas" },
  { icon: "fas fa-chart-bar", label: "Gráficos", href: "/graficos" },
  { icon: "fas fa-bullseye", label: "Metas", href: "/metas" },
  { icon: "fas fa-store", label: "Metas da Loja", href: "/metas-loja" },
  { icon: "fas fa-bullhorn", label: "Campanhas", href: "/campanhas" },
  { icon: "fas fa-trophy", label: "Rankings", href: "/rankings" },
  { icon: "fas fa-file-alt", label: "Relatórios", href: "/relatorios" },
  { icon: "fas fa-calendar-alt", label: "Escala", href: "/escala" },
  { icon: "fas fa-users", label: "Usuários", href: "/usuarios" },
  { icon: "fas fa-cog", label: "Configurações", href: "/configuracoes" }
];

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { avatarUrl } = useUserAvatar();

  return (
    <div className={cn(
      "sidebar fixed top-0 left-0 z-50 flex flex-col h-full text-sidebar-foreground shadow-lg transition-all duration-300 ease-in-out bg-sidebar overflow-hidden",
      "w-16 hover:w-56 group",
      className?.includes('expanded') ? "w-56" : "",
      className
    )}>
      {/* Header */}
      <div className="sidebar-header flex items-center justify-center p-3 mb-3">
        <div className="sidebar-logo flex items-center justify-center w-full">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-sidebar-accent">
            <img src={miniIconWhite} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-menu flex-1 flex flex-col gap-1 px-1 overflow-y-auto scrollbar-none">
        {sidebarItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          
          // Verificar permissões para mostrar/ocultar usuários
          if (item.href === '/usuarios') {
            const canManageUsers = user?.tipo && ['admin', 'supervisor', 'rh', 'gerente', 'lider', 'sublider', 'subgerente'].includes(user.tipo);
            if (!canManageUsers) {
              return null;
            }
          }

          // Verificar permissões para mostrar/ocultar metas
          if (item.href === '/metas') {
            const canViewMetas = user?.tipo && ['admin', 'supervisor', 'rh', 'gerente', 'lider', 'sublider', 'subgerente', 'auxiliar', 'farmaceutico', 'consultora'].includes(user.tipo);
            if (!canViewMetas) {
              return null;
            }
          }

          // Verificar permissões para mostrar/ocultar rankings
          if (item.href === '/rankings') {
            const canViewRankings = user?.tipo && ['gerente', 'lider', 'sublider', 'subgerente', 'admin', 'supervisor', 'rh'].includes(user.tipo);
            if (!canViewRankings) {
              return null;
            }
          }

          // Verificar permissões para mostrar/ocultar escala
          if (item.href === '/escala') {
            // Todos os usuários autenticados podem ver a escala (alguns apenas visualizam)
            // Continue com o fluxo normal
          }
          
          return (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "nav-item flex items-center rounded-lg text-sidebar-foreground/80 transition-all duration-150 relative",
                "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                "p-2",
                "justify-start",
                isActive && "active bg-sidebar-accent text-sidebar-foreground border-l-3 border-l-sidebar-primary"
              )}
            >
              <div className={cn(
                "nav-icon w-10 h-10 rounded-lg flex items-center transition-all duration-150 flex-shrink-0 justify-center",
                !className?.includes('expanded') && "group-hover:justify-center",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-sidebar-accent hover:bg-primary/20 hover:text-sidebar-foreground"
              )}>
                <i className={`${item.icon} text-base`}></i>
              </div>
              <span className={cn(
                "nav-label ml-3 font-medium transition-opacity duration-200 whitespace-nowrap",
                className?.includes('expanded') ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="user-profile flex items-center p-3 border-t border-sidebar-border bg-sidebar flex-shrink-0">
        <Avatar className="w-10 h-10 flex-shrink-0">
          {avatarUrl ? (
            <AvatarImage 
              src={avatarUrl} 
              alt={`Avatar de ${user?.nome}`}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            {user?.nome?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "user-info ml-3 transition-opacity duration-200 overflow-hidden flex-1",
          className?.includes('expanded') ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <div className="user-name text-sidebar-foreground font-semibold text-sm truncate">
            {user?.nome}
          </div>
          <div className="user-role text-sidebar-foreground/60 text-xs truncate capitalize">
            {getDescricaoTipoUsuario(user?.tipo || '')}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "transition-opacity duration-200 ml-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
            className?.includes('expanded') ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <i className="fas fa-sign-out-alt text-sm"></i>
        </Button>
      </div>
    </div>
  );
}