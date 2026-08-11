import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

export default function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value])

  return <>{format(display)}</>
}
