import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Generate a sphere of points
function generateSphereParticles(count: number, radius: number) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random())
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

function CoreSphere({ latestEvent }: { latestEvent: any }) {
  const ref = useRef<THREE.Points>(null)
  
  // State for reacting to events
  const [pulseIntensity, setPulseIntensity] = useState(0)
  const [targetColor, setTargetColor] = useState(new THREE.Color('#4F46E5')) // Default Electric Indigo

  // Generate particles
  const particleCount = 4000
  const positions = useMemo(() => generateSphereParticles(particleCount, 3.5), [])

  // React to incoming events
  useEffect(() => {
    if (!latestEvent) return

    setPulseIntensity(1.0) // Trigger pulse
    
    // Determine color based on event type
    const type = latestEvent.event_type || ''
    if (type.includes('PURCHASE') || type.includes('REGISTERED')) {
      setTargetColor(new THREE.Color('#10B981')) // Emerald Green
    } else if (type.includes('TICKET') || type.includes('CHURN') || type.includes('REFUND')) {
      setTargetColor(new THREE.Color('#EF4444')) // Red
    } else {
      setTargetColor(new THREE.Color('#4F46E5')) // Electric Indigo
    }
  }, [latestEvent])

  useFrame((state, delta) => {
    if (ref.current) {
      // Slow elegant rotation
      ref.current.rotation.y -= delta * 0.05
      ref.current.rotation.x -= delta * 0.02
      
      // Idle pulsing
      const idlePulse = Math.sin(state.clock.elapsedTime * 2) * 0.05
      
      // Event pulsing decay
      if (pulseIntensity > 0) {
        setPulseIntensity((prev) => Math.max(0, prev - delta * 1.5))
      }
      
      const scale = 1 + idlePulse + (pulseIntensity * 0.15)
      ref.current.scale.set(scale, scale, scale)
    }
  })

  // Smoothly interpolate color
  const materialRef = useRef<any>(null)
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, delta * 3)
      // Base opacity is subtle (0.4), spikes up to 0.9 during events
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, 0.4 + (pulseIntensity * 0.5), delta * 5)
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          ref={materialRef}
          transparent
          color="#4F46E5"
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Inner dense core */}
      <Points positions={useMemo(() => generateSphereParticles(1000, 1.5), [])} stride={3}>
        <PointMaterial
          transparent
          color="#FAFAFA"
          opacity={0.15}
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  )
}

export default function IntelligenceCore({ latestEvent }: { latestEvent: any }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <CoreSphere latestEvent={latestEvent} />
        <EffectComposer>
          {/* Subtle bloom, not overwhelming to maintain enterprise look */}
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
