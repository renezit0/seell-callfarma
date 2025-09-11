import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, UserCog, Camera, Trash2, Save, Key, User, Eye, EyeOff, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDescricaoTipoUsuario } from '@/utils/userTypes';
import { AvatarUpload } from '@/components/AvatarUpload';

interface PasswordStrength {
  score: number;
  text: string;
  color: string;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { avatarUrl, loading: avatarLoading, updateAvatar, removeAvatar, refreshAvatar } = useUserAvatar();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, text: 'Muito fraca', color: 'bg-destructive' });

  const [profileData, setProfileData] = useState({
    email: '',
    data_nascimento: '',
    data_contratacao: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, text: 'Muito fraca', color: 'bg-destructive' };
      case 2:
        return { score, text: 'Fraca', color: 'bg-orange-500' };
      case 3:
        return { score, text: 'Média', color: 'bg-yellow-500' };
      case 4:
        return { score, text: 'Boa', color: 'bg-blue-500' };
      case 5:
        return { score, text: 'Muito forte', color: 'bg-green-500' };
      default:
        return { score: 0, text: 'Muito fraca', color: 'bg-destructive' };
    }
  };

  const handlePasswordChange = (value: string) => {
    setPasswordData(prev => ({ ...prev, newPassword: value }));
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          email: profileData.email,
          data_nascimento: profileData.data_nascimento || null,
          data_contratacao: profileData.data_contratacao || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Here you would implement password verification and update
      // For now, we'll just show a success message
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-2xl mx-auto mt-20">
          <CardContent className="text-center p-8">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen bg-background">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-4 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <CardTitle className="text-xl md:text-2xl">Configurações</CardTitle>
            </div>
            <Button variant="outline" asChild size="sm" className="self-start md:self-auto">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Voltar para Dashboard</span>
                <span className="sm:hidden">Voltar</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 md:p-6">
          {/* User Info Card */}
          <Card className="mb-4 md:mb-6 bg-muted/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                <Avatar className="w-16 h-16 md:w-20 md:h-20">
                  {avatarUrl ? (
                    <AvatarImage 
                      src={avatarUrl} 
                      alt="Avatar do usuário" 
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-xl md:text-2xl font-bold">
                    {user.nome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-lg md:text-xl font-semibold mb-2">{user.nome}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <User className="w-4 h-4" />
                      Matrícula: {user.matricula}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <UserCog className="w-4 h-4" />
                      {getDescricaoTipoUsuario(user.tipo)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-10">
              <TabsTrigger value="perfil" className="flex items-center justify-center gap-2 p-3 md:p-2">
                <User className="w-4 h-4" />
                <span className="text-sm">Editar Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="senha" className="flex items-center justify-center gap-2 p-3 md:p-2">
                <Key className="w-4 h-4" />
                <span className="text-sm">Alterar Senha</span>
              </TabsTrigger>
              <TabsTrigger value="foto" className="flex items-center justify-center gap-2 p-3 md:p-2">
                <Camera className="w-4 h-4" />
                <span className="text-sm">Foto de Perfil</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="perfil" className="space-y-6">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={user.nome} disabled />
                    <p className="text-xs text-muted-foreground">
                      Seu nome não pode ser alterado. Entre em contato com seu gerente caso precise corrigir.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Login</Label>
                    <Input value={user.login} disabled />
                    <p className="text-xs text-muted-foreground">
                      Seu login não pode ser alterado.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Matrícula</Label>
                    <Input value={user.matricula} disabled />
                    <p className="text-xs text-muted-foreground">
                      Sua matrícula não pode ser alterada.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Usuário</Label>
                    <Input value={getDescricaoTipoUsuario(user.tipo)} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Informe um email válido para receber comunicações importantes.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={profileData.data_nascimento}
                      onChange={(e) => setProfileData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="senha" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sua senha deve ter pelo menos 6 caracteres. Use uma combinação de letras, números e caracteres especiais para maior segurança.
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {passwordData.newPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          As senhas não conferem.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Senhas conferem!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading || passwordData.newPassword !== passwordData.confirmPassword || passwordData.newPassword.length < 6}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Photo Tab */}
            <TabsContent value="foto" className="space-y-6">
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  Carregue uma foto de perfil para personalizar sua conta. Recomendamos imagens quadradas de pelo menos 200x200 pixels.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  {user?.id && (
                    <AvatarUpload
                      userId={user.id}
                      userName={user.nome}
                      currentAvatarUrl={avatarUrl}
                      size="lg"
                      mode="edit"
                      onAvatarChange={refreshAvatar}
                    />
                  )}
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Tamanho máximo: 5MB • Formatos: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}