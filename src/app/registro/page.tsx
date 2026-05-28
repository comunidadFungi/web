'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Eye, EyeSlash, CheckCircle, EnvelopeSimple, Lock, User, Sparkle } from '@phosphor-icons/react'
import Image from 'next/image'

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este email ya está registrado. Intenta iniciar sesión.'
        : 'Error al registrarse. Intenta de nuevo.')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle weight="fill" size={72} className="text-[#6B8F71] mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">¡Bienvenido a la comunidad!</h2>
          <p className="text-[#7A3B1E] mb-6">
            Te enviamos un correo de confirmación a <strong>{email}</strong>. Confírmalo para activar tu cuenta.
          </p>
          <Link href="/login" className="bg-[#C4513A] text-white px-8 py-3 rounded-full hover:bg-[#A83D28] transition-colors">
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.webp" alt="Comunidad Fungi" width={72} height={72} className="rounded-full mx-auto mb-4 object-cover" />
          <h1 className="font-display text-3xl font-bold text-[#4A1E0A]">Únete a la comunidad</h1>
          <p className="text-[#7A3B1E] mt-2 text-sm">Registro gratuito · Acceso inmediato a productos exclusivos</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-lg p-8 border border-[#E8D5B5]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-[#4A1E0A] mb-2">Nombre completo</label>
            <div className="relative">
              <User weight="fill" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8923A]" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-[#E8D5B5] rounded-xl pl-10 pr-4 py-3 text-[#4A1E0A] focus:outline-none focus:border-[#C4513A] focus:ring-2 focus:ring-[#C4513A]/20 transition-colors bg-[#FDFAF5]"
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-[#4A1E0A] mb-2">Email</label>
            <div className="relative">
              <EnvelopeSimple weight="fill" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8923A]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-[#E8D5B5] rounded-xl pl-10 pr-4 py-3 text-[#4A1E0A] focus:outline-none focus:border-[#C4513A] focus:ring-2 focus:ring-[#C4513A]/20 transition-colors bg-[#FDFAF5]"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4A1E0A] mb-2">Contraseña</label>
            <div className="relative">
              <Lock weight="fill" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8923A]" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-[#E8D5B5] rounded-xl pl-10 pr-12 py-3 text-[#4A1E0A] focus:outline-none focus:border-[#C4513A] focus:ring-2 focus:ring-[#C4513A]/20 transition-colors bg-[#FDFAF5]"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A3B1E] hover:text-[#4A1E0A]"
              >
                {showPass ? <EyeSlash weight="fill" size={18} /> : <Eye weight="fill" size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C4513A] text-white py-3 rounded-xl font-medium hover:bg-[#A83D28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>

          <div className="mt-6 pt-6 border-t border-[#E8D5B5]">
            <p className="text-xs text-[#7A3B1E] text-center mb-3 font-medium">Al registrarte accedes a:</p>
            <ul className="space-y-2">
              {['Micelio en grano avanzado', 'Kit de laboratorio básico', 'Curso online completo'].map(b => (
                <li key={b} className="flex items-center gap-2 text-xs text-[#7A3B1E]">
                  <Sparkle weight="fill" size={14} className="text-[#C8923A] shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-sm text-[#7A3B1E] mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#C4513A] font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
