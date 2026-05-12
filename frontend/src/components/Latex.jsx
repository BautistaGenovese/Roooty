import { useEffect, useRef } from 'react'

export default function Latex({ tex, display = false }) {
  const ref = useRef()

  useEffect(() => {
    if (!ref.current || !tex) return
    import('katex').then(({ default: katex }) => {
      try {
        katex.render(tex, ref.current, {
          displayMode: display,
          throwOnError: false,
          strict: false,
        })
      } catch {
        if (ref.current) ref.current.textContent = tex
      }
    })
  }, [tex, display])

  return (
    <span
      ref={ref}
      style={display ? { display: 'block', textAlign: 'center', padding: '4px 0', fontSize: '1.1rem' } : {}}
    />
  )
}
