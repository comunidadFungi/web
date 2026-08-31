'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const slides = [
  { src: '/images/inicio/hongo-1.webp', alt: 'Hongos medicinales' },
  { src: '/images/inicio/hongo-2.webp', alt: 'Hongo Psilocybe' },
  { src: '/images/inicio/hongo-3.webp', alt: 'Cultivo de hongos' },
  { src: '/images/inicio/hongo-4.webp', alt: 'Comunidad Fungi' },
]

const INTERVAL = 5000
const TRANSITION = 1000

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % slides.length)
        setFading(false)
      }, TRANSITION)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          className="object-cover object-center transition-opacity"
          style={{
            opacity: i === current ? (fading ? 0 : 1) : 0,
            transitionDuration: `${TRANSITION}ms`,
            zIndex: i === current ? 0 : -1,
          }}
        />
      ))}

      {/*
        El punto sigue midiendo 8 px, pero el botón que lo contiene ocupa 44,
        que es el mínimo cómodo para el pulgar. Antes el área táctil era el
        propio punto y resultaba casi imposible de acertar en el teléfono.
      */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(false); setCurrent(i) }}
            className="w-11 h-11 flex items-center justify-center group"
            aria-label={`Ir a imagen ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
          >
            <span
              className="w-2 h-2 rounded-full transition-all group-hover:scale-125"
              style={{
                backgroundColor: i === current ? '#C8923A' : 'rgba(255,255,255,0.5)',
                transform: i === current ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </button>
        ))}
      </div>
    </>
  )
}
