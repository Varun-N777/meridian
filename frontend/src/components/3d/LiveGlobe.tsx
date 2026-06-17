import { useEffect, useState, useRef, useMemo } from 'react'
import Globe from 'react-globe.gl'

// Datacenter location (e.g., San Francisco)
const DATACENTER = { lat: 37.7749, lng: -122.4194 }

// Generate a random location
function getRandomLocation() {
  return {
    lat: (Math.random() - 0.5) * 160,
    lng: (Math.random() - 0.5) * 360
  }
}

export default function LiveGlobe({ latestEvent }: { latestEvent: any }) {
  const globeEl = useRef<any>(null)
  const [arcsData, setArcsData] = useState<any[]>([])
  
  // Custom hook for window size to make globe responsive
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  // Generate static cities/data points to make the globe look populated
  const citiesData = useMemo(() => {
    return Array.from({ length: 60 }).map(() => ({
      ...getRandomLocation(),
      size: Math.random() * 0.3 + 0.1,
      color: ['#4F46E5', '#10B981', '#3B82F6', '#8B5CF6'][Math.floor(Math.random() * 4)]
    }))
  }, [])

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotate the globe slowly
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true
      globeEl.current.controls().autoRotateSpeed = 0.5
      globeEl.current.controls().enableZoom = false
      
      // Point camera to look at the globe nicely
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 })
    }
  }, [])

  // Continuous Background Traffic Loop
  useEffect(() => {
    const fireRandomArc = () => {
      const startLoc = getRandomLocation()
      const color = ['#3B82F6', '#4F46E5', '#10B981'][Math.floor(Math.random() * 3)]
      
      const newArc = {
        startLat: startLoc.lat,
        startLng: startLoc.lng,
        endLat: DATACENTER.lat,
        endLng: DATACENTER.lng,
        color: [color, 'rgba(255,255,255,0)'],
        arcAlt: 0.1 + Math.random() * 0.4,
        id: `bg-${Date.now()}-${Math.random()}`
      }

      setArcsData(prev => [...prev.slice(-30), newArc]) // Keep max 30 arcs in memory

      setTimeout(() => {
        setArcsData(prev => prev.filter(arc => arc.id !== newArc.id))
      }, 2500)
    }

    // Fire a random background event every 800ms to keep the globe bustling
    const interval = setInterval(fireRandomArc, 800)
    
    // Fire a few immediately on mount
    for(let i=0; i<5; i++) fireRandomArc()

    return () => clearInterval(interval)
  }, [])

  // Handle incoming LIVE events from WebSocket
  useEffect(() => {
    if (!latestEvent) return

    const type = latestEvent.event_type?.toLowerCase() || ''
    
    let color = '#4F46E5' 
    if (type.includes('churn') || type.includes('refund') || type.includes('ticket')) {
      color = '#EF4444' // Red for risk
    } else if (type.includes('purchase') || type.includes('register')) {
      color = '#10B981' // Green for success
    } else if (type.includes('cart') || type.includes('wishlist')) {
      color = '#F59E0B' // Yellow
    }

    const startLoc = getRandomLocation()
    
    const newArc = {
      startLat: startLoc.lat,
      startLng: startLoc.lng,
      endLat: DATACENTER.lat,
      endLng: DATACENTER.lng,
      color: [color, 'rgba(255,255,255,0.8)'], // Brighter than background arcs
      arcAlt: 0.2 + Math.random() * 0.3,
      id: `live-${Date.now()}`
    }

    setArcsData(prev => [...prev, newArc])

    setTimeout(() => {
      setArcsData(prev => prev.filter(arc => arc.id !== newArc.id))
    }, 3000)

  }, [latestEvent])

  return (
    <div className="absolute inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center">
      {/* Dark overlay gradient to blend edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_black_100%)] pointer-events-none z-10" />
      
      <Globe
        ref={globeEl}
        width={windowSize.width}
        height={windowSize.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        
        // Cities / Active Zones
        ringsData={citiesData}
        ringColor="color"
        ringMaxRadius="size"
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
        
        // Arc config
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.6}
        
        // Render atmosphere
        atmosphereColor="#4F46E5"
        atmosphereAltitude={0.15}
      />
    </div>
  )
}
