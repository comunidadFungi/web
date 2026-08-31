import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Comunidad Fungi — Dispensario',
    short_name: 'Fungi',
    description:
      'Gestión de pacientes, recetas, producción y stock del dispensario Comunidad Fungi.',
    // Arranca en el panel: es la parte que se instala y se usa como app.
    start_url: '/admin/dispensario',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#F5ECD7',
    theme_color: '#4A1E0A',
    lang: 'es-CL',
    categories: ['medical', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Nueva receta',
        url: '/admin/dispensario/recetas/nueva',
        description: 'Registrar una receta y calcular su consumo',
      },
      {
        name: 'Stock',
        url: '/admin/dispensario/stock',
        description: 'Registrar movimientos de inventario',
      },
      {
        name: 'Pacientes',
        url: '/admin/dispensario/pacientes',
        description: 'Fichas de pacientes',
      },
    ],
  }
}
