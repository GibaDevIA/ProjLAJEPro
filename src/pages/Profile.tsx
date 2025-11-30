import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getProfile, updateProfile, createProfile } from '@/services/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const Profile = () => {
  const { user, updatePassword } = useAuth()

  const [fullName, setFullName] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        let { data, error } = await getProfile(user.id)

        if (error && error.code === 'PGRST116') {
          try {
            const { data: newProfile, error: createError } =
              await createProfile(user.id, user.email || null)

            if (createError) {
              console.error('Error creating automatic profile:', createError)
            } else {
              data = newProfile
              error = null
            }
          } catch (err) {
            console.error(
              'Unexpected error during automatic profile creation:',
              err,
            )
          }
        }

        if (error) {
          toast.error('Erro ao carregar perfil.')
        } else if (data) {
          setFullName(data.full_name || '')
        }
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSavingProfile(true)
    try {
      const { error } = await updateProfile(user.id, { full_name: fullName })
      if (error) {
        toast.error('Erro ao atualizar perfil: ' + error.message)
      } else {
        toast.success('Perfil atualizado com sucesso!')
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('As novas senhas não conferem.')
      return
    }

    setSavingPassword(true)
    try {
      const { error } = await updatePassword(newPassword)
      if (error) {
        toast.error('Erro ao alterar senha: ' + error.message)
      } else {
        toast.success('Senha alterada com sucesso!')
        setNewPassword('')
        setConfirmPassword('')
        setCurrentPassword('')
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple Header for Profile Page */}
      <header className="bg-white border-b h-16 flex items-center px-4 lg:px-8 mb-8">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </header>

      <div className="container max-w-4xl mx-auto px-4 space-y-8 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e segurança.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seu nome e veja seu email.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Altere a senha da sua conta.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    Senha Atual (opcional para referência)
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={savingPassword}
                >
                  {savingPassword && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Alterar Senha
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
