import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users, DollarSign, TrendingUp, ShieldAlert, Heart, Activity,
  AlertTriangle, Megaphone, Eye, ShoppingCart, UserPlus, LogIn,
  Package, Search, Star, MessageSquare, RotateCcw, ArrowUpRight, ArrowDownRight, Zap, Brain, Network, GitBranch
} from 'lucide-react'
import api from '../../services/api'
import { useWsContext } from '../../layouts/AdminLayout'
import LiveGlobe from '../../components/3d/LiveGlobe'

/* ── Animated Counter ─────────────────────────────── */
function AnimatedValue({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const duration = 1200
    const start = ref.current
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (value - start) * eased
      setDisplay(current)
      ref.current = current
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  return <span>{prefix}{typeof value === 'number' && value >= 1000 ? display.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : display.toFixed(1)}{suffix}</span>
}

/* ── HUD KPI Card ─────────────────────────────────── */
function HudKpi({ icon: Icon, label, value, prefix, suffix, trend, color, delay }: any) {
  return (
    <motion.div
      className="glass-subtle p-3 rounded-xl border border-white/5"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white mono" style={{ textShadow: `0 0 10px ${color}50` }}>
              <AnimatedValue value={value} prefix={prefix} suffix={suffix} />
            </span>
            {trend && (
              <span className={`text-[10px] flex items-center ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Event Icon ───────────────────────────────────── */
function getEventConfig(eventType: string) {
  const configs: Record<string, { icon: any; color: string; label: string }> = {
    'PRODUCT_VIEW': { icon: Eye, color: '#8B5CF6', label: 'viewed' },
    'product_view': { icon: Eye, color: '#8B5CF6', label: 'viewed' },
    'ADD_TO_CART': { icon: ShoppingCart, color: '#F59E0B', label: 'added to cart' },
    'cart_add': { icon: ShoppingCart, color: '#F59E0B', label: 'added to cart' },
    'REMOVE_FROM_CART': { icon: ShoppingCart, color: '#6B7280', label: 'removed from cart' },
    'cart_remove': { icon: ShoppingCart, color: '#6B7280', label: 'removed from cart' },
    'PURCHASE_COMPLETED': { icon: DollarSign, color: '#10B981', label: 'purchased' },
    'purchase': { icon: DollarSign, color: '#10B981', label: 'purchased' },
    'USER_REGISTERED': { icon: UserPlus, color: '#10B981', label: 'registered' },
    'USER_LOGIN': { icon: LogIn, color: '#3B82F6', label: 'logged in' },
    'SUPPORT_TICKET_CREATED': { icon: MessageSquare, color: '#EF4444', label: 'submitted ticket' },
    'ticket_created': { icon: MessageSquare, color: '#EF4444', label: 'submitted ticket' },
    'SEARCH': { icon: Search, color: '#06B6D4', label: 'searched' },
    'search': { icon: Search, color: '#06B6D4', label: 'searched' },
    'ADD_TO_WISHLIST': { icon: Heart, color: '#EF4444', label: 'wishlisted' },
    'wishlist_add': { icon: Heart, color: '#EF4444', label: 'wishlisted' },
    'CHECKOUT_STARTED': { icon: Package, color: '#F97316', label: 'started checkout' },
    'REVIEW_SUBMITTED': { icon: Star, color: '#F59E0B', label: 'reviewed' },
    'REFUND_REQUESTED': { icon: RotateCcw, color: '#EF4444', label: 'requested refund' },
  }
  return configs[eventType] || { icon: Activity, color: '#64748B', label: eventType?.replace(/_/g, ' ').toLowerCase() || 'activity' }
}

/* ── Dashboard ────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const { events: wsEvents } = useWsContext()

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: recentEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events?limit=20').then(r => r.data),
  })

  // Merge WS events with DB events
  const allEvents = [...wsEvents, ...(recentEvents || [])].slice(0, 20)
  const o = overview || {}
  const latestEvent = allEvents[0]

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-black overflow-hidden">
      {/* Live 3D Globe Background */}
      <LiveGlobe latestEvent={latestEvent} />

      {/* ── HUD OVERLAY ───────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* TOP ROW */}
        <div className="flex justify-between items-start pointer-events-auto z-10">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Mission Control
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="live-indicator" />
                <span className="text-[10px] font-semibold text-green-400 tracking-widest uppercase">System Online • Monitoring Core</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-64 mt-4">
              <HudKpi icon={Users} label="Active Users" value={o.total_customers || 0} color="#4F46E5" trend={o.customer_trend} delay={0.1} />
              <HudKpi icon={DollarSign} label="Revenue Pulse" value={o.total_revenue || 0} prefix="₹" color="#10B981" trend={o.revenue_trend_pct} delay={0.2} />
              <HudKpi icon={Heart} label="Happiness Index" value={o.avg_happiness_score || 0} suffix="/100" color="#F59E0B" trend={o.happiness_trend} delay={0.3} />
            </div>
          </div>

          <div className="w-72 space-y-3">
            <motion.div className="glass-strong p-4 rounded-xl border border-red-500/20"
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">Critical Alerts</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold text-white mono">{o.high_risk_customers || 0}</p>
                  <p className="text-[10px] text-slate-400">High Risk Customers</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-400 mono">₹{(o.revenue_at_risk || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-400">Revenue at Risk</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex justify-between items-end pointer-events-auto z-10">
          
          {/* Live Feed Terminal */}
          <motion.div 
            className="w-96 rounded-xl overflow-hidden glass-subtle border border-white/5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Global Data Stream</span>
              <Activity size={12} className="text-blue-400" />
            </div>
            <div className="p-2 space-y-1 h-64 overflow-y-auto scrollbar-hide flex flex-col-reverse">
              {allEvents.map((e: any, i: number) => {
                const config = getEventConfig(e.event_type)
                const Icon = config.icon
                return (
                  <motion.button
                    key={e.event_id || e.id || i}
                    onClick={() => e.customer_id && navigate(`/admin/customer360?id=${e.customer_id}`)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-white/5 text-left w-full group transition-colors"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1 - (i * 0.08), x: 0 }}
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}20` }}>
                      <Icon size={12} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate group-hover:text-white transition-colors">
                        <span className="font-semibold">{e.customer_name || e.customer_id?.slice(0, 8)}</span>
                        <span className="text-slate-500"> {config.label} </span>
                        {e.event_value && <span style={{ color: config.color }}>{e.event_value}</span>}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Meridian Core USP Panel */}
          <motion.div 
            className="w-[450px] rounded-xl overflow-hidden glass-strong border border-blue-500/20"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            <div className="px-4 py-3 border-b border-white/10 bg-blue-950/30 flex items-center gap-3">
              <Brain size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Meridian Core Intelligence</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Decision Memory</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Evaluates expected vs. actual outcomes, allowing the engine to learn and track its real-world accuracy over time.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Network size={16} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">Counterfactual Intel</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Simulates parallel timelines (e.g., "discount" vs "delay") prior to execution to recommend the highest expected value path.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Compression Score</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Efficiency metric enforcing an intelligent equilibrium between cheap heuristics and expensive deep-reasoning LLMs.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GitBranch size={16} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Three-Tiered Pipeline</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Routes tasks dynamically: <span className="font-semibold text-white">Tier 1</span> (Semantic Cache), <span className="font-semibold text-white">Tier 2</span> (Specialized ML Models), <span className="font-semibold text-white">Tier 3</span> (LLMs).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
