'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { DeviceMobile, X } from '@phosphor-icons/react'

/** Evento no estándar, solo en navegadores basados en Chromium. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'fungi-install-dismissed'

/** Estos datos no cambian durante la vida de la página. */
const neverChanges = () => () => {}

/**
 * Lee un dato del navegador sin desajustar la hidratación: en el servidor
 * devuelve `false` y React vuelve a renderizar con el valor real tras montar.
 */
function useBrowserFlag(read: () => boolean): boolean {
  return useSyncExternalStore(neverChanges, read, () => false)
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // Safari en iOS no expone display-mode hasta iOS 16.4.
  (window.navigator as { standalone?: boolean }).standalone === true

const isIOSDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    // Almacenamiento bloqueado: se muestra el aviso igual.
    return false
  }
}

export default function InstallPrompt() {
  const standalone = useBrowserFlag(isStandalone)
  const ios = useBrowserFlag(isIOSDevice)
  const dismissedBefore = useBrowserFlag(wasDismissed)

  const [dismissed, setDismissed] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Sin almacenamiento el aviso reaparecerá; es aceptable.
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  // En iOS no existe beforeinstallprompt: solo cabe explicar el gesto.
  const canOffer = ios || deferred !== null
  if (standalone || dismissedBefore || dismissed || !canOffer) return null

  return (
    <div className="mb-6 bg-[#4A1E0A] text-[#F5ECD7] rounded-2xl p-4 flex items-start gap-3">
      <DeviceMobile weight="fill" size={22} className="text-[#C8923A] shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Instala el dispensario en tu dispositivo</p>
        {ios ? (
          <p className="text-xs text-[#F5ECD7]/70 mt-1 leading-relaxed">
            Toca el botón Compartir de Safari y elige «Agregar a inicio» para abrirlo como una app.
          </p>
        ) : (
          <>
            <p className="text-xs text-[#F5ECD7]/70 mt-1 leading-relaxed">
              Se abre a pantalla completa y queda a un toque, como una aplicación.
            </p>
            <button
              onClick={install}
              className="mt-2.5 bg-[#C8923A] text-[#4A1E0A] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#F5ECD7] transition-colors"
            >
              Instalar
            </button>
          </>
        )}
      </div>

      <button
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="text-[#F5ECD7]/50 hover:text-[#F5ECD7] transition-colors shrink-0"
      >
        <X weight="bold" size={16} />
      </button>
    </div>
  )
}
