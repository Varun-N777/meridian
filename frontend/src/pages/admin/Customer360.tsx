import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Users, Search, ChevronRight, Shield, Heart, AlertTriangle, TrendingUp, ShoppingBag, ShoppingCart, Target, Brain, Zap, DollarSign, BarChart3, Eye, Network, GitBranch, Star, RotateCcw, LogIn, MessageSquare, Bot, Package, Activity } from 'lucide-react'
import api from '../../services/api'

function RiskBadge({ value }: { value: number }) {
  const color = value > 0.7 ? '#EF4444' : value > 0.4 ? '#F59E0B' : '#10B981'
  const label = value > 0.7 ? 'Critical' : value > 0.4 ? 'Medium' : 'Low'
  return <span className="badge text-[10px]" style={{ background: `${color}20`, color }}>{label} {(value * 100).toFixed(0)}%</span>
}

function EmotionBadge({ emotion }: { emotion: string }) {
  const colors: Record<string, string> = { happy: '#10B981', excited: '#8B5CF6', neutral: '#64748B', frustrated: '#F59E0B', angry: '#EF4444' }
  return <span className="badge text-[10px]" style={{ background: `${colors[emotion] || '#64748B'}20`, color: colors[emotion] || '#64748B' }}>{emotion}</span>
}

function ScoreGauge({ label, value, max = 100, color, sub }: { label: string; value: number; max?: number; color: string; sub?: string }) {
  const pct = (value / max) * 100
  return (
    <div className="text-center">
      <div className="relative w-14 h-14 mx-auto mb-1">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="var(--color-border)" strokeWidth="3" />
          <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${pct}, 100`}
            initial={{ strokeDasharray: '0, 100' }}
            animate={{ strokeDasharray: `${pct}, 100` }}
            transition={{ duration: 0.8 }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs mono font-bold text-white">{typeof value === 'number' ? value.toFixed(0) : value}</span>
        </div>
      </div>
      <p className="text-[10px]" style={{ color: '#64748B' }}>{label}</p>
      {sub && <p className="text-[9px]" style={{ color }}>{sub}</p>}
    </div>
  )
}

export default function Customer360() {
  const [searchParams] = useSearchParams()
  const deepLinkId = searchParams.get('id')
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (deepLinkId) setSelectedId(deepLinkId)
  }, [deepLinkId])

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })

  const { data: profile } = useQuery({
    queryKey: ['customer360', selectedId],
    queryFn: () => api.get(`/customers/360/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  const { data: ipcData } = useQuery({
    queryKey: ['ipc_intelligence', selectedId],
    queryFn: () => api.post(`/ipc/route`, {
      type: "customer_intelligence",
      payload: { customer_id: selectedId }
    }).then(r => r.data),
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  const filtered = (customers || []).filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  const intel = ipcData?.result || {}
  const tierUsed = ipcData?.tier_used || ""

  const churn = intel?.churn || {}
  const clv = intel?.clv || {}
  const trust = intel?.trust || {}
  const happiness = intel?.happiness || {}
  const risk = intel?.risk || {}
  const nba = intel?.nba || {}
  const campaign = intel?.campaign || null
  const twin = intel?.digital_twin || {}
  const execInsights = intel?.executive_insights || []

  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'risk'>('overview')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Customer 360 Super Panel</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Complete intelligence for every customer — live
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: '#10B98120', color: '#10B981' }}>● LIVE</span>
          </p>
        </div>
        {tierUsed && (
          <div className="px-3 py-1 rounded-lg flex items-center gap-2" style={{ background: '#3B82F620', border: '1px solid #3B82F640' }}>
            <Brain size={14} className="text-blue-400" />
            <span className="text-xs font-mono text-blue-400">Powered by Meridian IPC ({tierUsed})</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Customer List */}
        <div className="card p-4">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-2.5" style={{ color: '#64748B' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs text-white transition-colors"
              style={{ background: '#0F172A', border: '1px solid var(--color-border)' }}
              placeholder="Search customers..." />
          </div>
          <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
            {filtered.slice(0, 500).map((c: any) => (
              <button key={c.customer_id}
                onClick={() => setSelectedId(c.customer_id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-slate-800/50"
                style={{
                  background: selectedId === c.customer_id ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: selectedId === c.customer_id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                     style={{ background: 'var(--color-border)' }}>{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.email}</p>
                </div>
                <ChevronRight size={14} style={{ color: selectedId === c.customer_id ? '#3B82F6' : '#475569' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedId && profile ? (
              <motion.div key={selectedId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                
                {/* Profile Header (Always Visible) */}
                <div className="card p-5">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg"
                         style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff' }}>
                      {profile.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
                      <p className="text-xs text-slate-400 flex flex-wrap gap-2 items-center">
                        <span>{profile.email}</span>
                        <span>•</span>
                        <span>{profile.city}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{profile.segment || 'new'}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <RiskBadge value={profile.churn_probability || 0} />
                      <EmotionBadge emotion={happiness.emotion || profile.emotion || 'neutral'} />
                    </div>
                  </div>
                </div>

                {/* True Intelligence Core - Live Telemetry */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Decision Memory Live Status */}
                  <div className="glass-subtle p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
                        <Brain size={12} className="text-indigo-400" />
                      </div>
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Decision Memory</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[10px] text-slate-400 leading-tight">Live memory bank active for this customer.</p>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400">SYNCED</span>
                    </div>
                  </div>

                  {/* Counterfactuals */}
                  <div className="glass-subtle p-3 rounded-xl border border-purple-500/20 bg-purple-950/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                        <Network size={12} className="text-purple-400" />
                      </div>
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Counterfactuals</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[10px] text-slate-400 leading-tight">Simulating parallel realities.</p>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400">
                        {ipcData?.counterfactuals ? Object.keys(ipcData.counterfactuals.alternatives || {}).length + 1 : 0} PATHS
                      </span>
                    </div>
                  </div>

                  {/* Compression Score Live */}
                  <div className="glass-subtle p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
                        <Zap size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Compression Score</span>
                    </div>
                    <div className="mt-1 flex justify-between items-end">
                      <p className="text-[10px] text-slate-400 leading-tight max-w-[120px]">Real-time efficiency ratio of this decision.</p>
                      <div className="text-right leading-none">
                        <span className="text-lg font-bold text-emerald-400 mono">{ipcData?.decision_compression_score ? ipcData.decision_compression_score.toFixed(1) : '---'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-white/10">
                  <button onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-xs font-semibold tracking-wide uppercase transition-colors relative ${activeTab === 'overview' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    Overview
                    {activeTab === 'overview' && <motion.div layoutId="c360-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />}
                  </button>
                  <button onClick={() => setActiveTab('intelligence')}
                    className={`pb-3 text-xs font-semibold tracking-wide uppercase transition-colors relative ${activeTab === 'intelligence' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    Intelligence & AI
                    {activeTab === 'intelligence' && <motion.div layoutId="c360-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-t-full shadow-[0_-2px_10px_rgba(139,92,246,0.5)]" />}
                  </button>
                  <button onClick={() => setActiveTab('risk')}
                    className={`pb-3 text-xs font-semibold tracking-wide uppercase transition-colors relative ${activeTab === 'risk' ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    Risk & Trust
                    {activeTab === 'risk' && <motion.div layoutId="c360-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400 rounded-t-full shadow-[0_-2px_10px_rgba(239,68,68,0.5)]" />}
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="min-h-[400px]">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                      <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        
                        {/* Intelligence Gauges */}
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Brain size={14} style={{ color: '#8B5CF6' }} /> Core Intelligence
                          </h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            <ScoreGauge label="Trust" value={trust.trust_score ?? profile.intelligence?.trust_score ?? profile.trust_score ?? 0} color="#8B5CF6" sub={trust.trust_level} />
                            <ScoreGauge label="Happiness" value={happiness.happiness_score ?? profile.intelligence?.happiness_score ?? profile.happiness_score ?? 0} color="#EC4899" sub={happiness.mood} />
                            <ScoreGauge label="Engagement" value={profile.intelligence?.engagement_score ?? profile.engagement_score ?? 0} color="#3B82F6" sub={profile.segment} />
                            <ScoreGauge label="Risk" value={risk.risk_score ?? profile.intelligence?.risk_score ?? 0} color="#EF4444" sub={risk.risk_level} />
                            <ScoreGauge label="Churn" value={(churn.churn_probability ?? profile.intelligence?.churn_probability ?? 0) * 100} color="#F97316" sub={churn.churn_category} />
                            <ScoreGauge label="CLV Score" value={Math.min(100, ((clv.predicted_clv ?? profile.intelligence?.predicted_clv ?? 0) / 1000))} color="#10B981" sub={clv.value_tier} />
                          </div>
                        </div>

                        {/* CLV & Orders Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Current CLV', value: `₹${(clv.clv || 0).toLocaleString('en-IN')}`, color: '#10B981' },
                            { label: 'Predicted CLV', value: `₹${(clv.predicted_clv || 0).toLocaleString('en-IN')}`, color: '#3B82F6' },
                            { label: 'Value Tier', value: clv.value_tier || 'Bronze', color: '#F59E0B' },
                            { label: 'Total Orders', value: profile.orders?.length || 0, color: '#8B5CF6' },
                          ].map((kpi, i) => (
                            <div key={i} className="card p-4 text-center">
                              <p className="text-lg font-bold mono" style={{ color: kpi.color }}>{kpi.value}</p>
                              <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#64748B' }}>{kpi.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Recent Activity */}
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-400" /> Recent Journey
                          </h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {(profile.events || profile.journey_timeline || []).slice(0, 20).map((ev: any, i: number) => {
                              const getJourneyIcon = (type: string) => {
                                const t = type.toLowerCase()
                                if (t.includes('view') || t.includes('search')) return <Eye size={14} className="text-blue-400" />
                                if (t.includes('cart')) return <ShoppingCart size={14} className="text-orange-400" />
                                if (t.includes('purchase') || t.includes('checkout')) return <DollarSign size={14} className="text-emerald-400" />
                                if (t.includes('wishlist') || t.includes('heart')) return <Heart size={14} className="text-pink-400" />
                                if (t.includes('review') || t.includes('star')) return <Star size={14} className="text-yellow-400" />
                                if (t.includes('refund') || t.includes('return')) return <RotateCcw size={14} className="text-red-400" />
                                if (t.includes('login')) return <LogIn size={14} className="text-indigo-400" />
                                if (t.includes('support') || t.includes('ticket') || t.includes('complaint')) return <MessageSquare size={14} className="text-red-400" />
                                if (t.includes('assistant') || t.includes('bot')) return <Bot size={14} className="text-purple-400" />
                                return <Activity size={14} className="text-slate-400" />
                              }
                              return (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
                                    {getJourneyIcon(ev.event_type || '')}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[11px] font-medium text-slate-200">{(ev.event_type || '').replace(/_/g, ' ')}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{ev.event_value}</p>
                                  </div>
                                  <span className="mono text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-md">
                                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              )
                            })}
                            {(!profile.events?.length && !profile.journey_timeline?.length) && (
                              <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl">
                                <Package size={24} className="text-slate-500 mx-auto mb-2" />
                                <p className="text-xs text-slate-500">No activity recorded yet</p>
                              </div>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    )}

                    {/* TAB: INTELLIGENCE & AI */}
                    {activeTab === 'intelligence' && (
                      <motion.div key="intelligence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        
                        {/* Counterfactual Intelligence */}
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Brain size={14} style={{ color: '#8B5CF6' }} /> Counterfactual Simulator
                          </h3>
                          
                          {ipcData?.counterfactuals ? (
                            <div className="overflow-hidden rounded-xl border border-slate-700/50">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-800/50 text-[10px] text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4 font-medium">Scenario Pathway</th>
                                    <th className="py-3 px-4 font-medium">Predicted Risk</th>
                                    <th className="py-3 px-4 font-medium">Est. Cost</th>
                                    <th className="py-3 px-4 font-medium">Expected Value</th>
                                    <th className="py-3 px-4 font-medium">AI Conf</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                  {/* Baseline Row */}
                                  <tr className="bg-slate-900/40">
                                    <td className="py-3.5 px-4 text-[11px] font-semibold text-slate-300">
                                      Current Baseline (No Action)
                                    </td>
                                    <td className="py-3.5 px-4 text-[11px] text-red-400 font-mono">
                                      {(ipcData.counterfactuals.baseline.predicted_risk * 100).toFixed(1)}%
                                    </td>
                                    <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono">
                                      ${ipcData.counterfactuals.baseline.estimated_cost.toFixed(2)}
                                    </td>
                                    <td className="py-3.5 px-4 text-[11px] text-slate-300 font-mono">
                                      {ipcData.counterfactuals.baseline.expected_value.toFixed(1)}
                                    </td>
                                    <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                                      {(ipcData.counterfactuals.baseline.confidence * 100).toFixed(0)}%
                                    </td>
                                  </tr>
                                  
                                  {/* Alternatives */}
                                  {ipcData.counterfactuals.alternatives.map((alt: any, idx: number) => {
                                    const isRecommended = ipcData.counterfactuals.recommended.action === alt.action;
                                    return (
                                      <tr key={idx} className={`transition-colors hover:bg-slate-800/20 ${isRecommended ? 'bg-indigo-500/5' : ''}`}>
                                        <td className="py-3.5 px-4 text-[11px] font-semibold text-slate-200 flex items-center gap-2">
                                          {alt.action.replace(/_/g, ' ').toUpperCase()}
                                          {isRecommended && (
                                            <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold shadow-sm">Rec</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 text-[11px] font-mono" style={{ color: alt.predicted_risk > 0.5 ? '#EF4444' : '#10B981' }}>
                                          {(alt.predicted_risk * 100).toFixed(1)}%
                                        </td>
                                        <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono">
                                          ${alt.estimated_cost.toFixed(2)}
                                        </td>
                                        <td className="py-3.5 px-4 text-[11px] font-bold font-mono" style={{ color: isRecommended ? '#10B981' : '#E2E8F0' }}>
                                          {alt.expected_value.toFixed(1)}
                                        </td>
                                        <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono">
                                          {(alt.confidence * 100).toFixed(0)}%
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/20 rounded-xl border border-slate-700/30">
                              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                              <p className="text-[11px] text-slate-400">Simulating counterfactual futures...</p>
                            </div>
                          )}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* NBA */}
                          <div className="card p-5">
                            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                              <Target size={14} style={{ color: '#3B82F6' }} /> Next Best Action
                            </h3>
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-3">
                              <p className="text-sm font-bold text-white mb-1.5">{nba.action || 'Computing optimal path...'}</p>
                              <p className="text-xs text-slate-400 leading-relaxed">{nba.reason}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Conf: {((nba.confidence || 0) * 100).toFixed(0)}%
                              </span>
                              <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                {nba.channel}
                              </span>
                            </div>
                            {nba.offer && (
                              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                                <span className="text-amber-400">💡</span>
                                <p className="text-[11px] text-amber-400 font-medium">{nba.offer}</p>
                              </div>
                            )}
                          </div>

                          {/* Auto Campaign */}
                          <div className="card p-5">
                            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                              <Zap size={14} style={{ color: '#F59E0B' }} /> Automated Campaign
                            </h3>
                            {campaign ? (
                              <>
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-3">
                                  <p className="text-sm font-bold text-white mb-1.5">{campaign.name}</p>
                                  <p className="text-xs text-slate-400 leading-relaxed"><span className="text-slate-500">Trigger:</span> {campaign.trigger_reason}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <div className="flex-1 min-w-[30%] bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                                    <p className="text-[9px] text-emerald-500/70 uppercase tracking-wider mb-0.5">Est. Conv</p>
                                    <p className="text-sm font-bold mono text-emerald-400">{((campaign.predicted_conversion || 0) * 100).toFixed(0)}%</p>
                                  </div>
                                  <div className="flex-1 min-w-[30%] bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                                    <p className="text-[9px] text-blue-500/70 uppercase tracking-wider mb-0.5">Est. Rev</p>
                                    <p className="text-sm font-bold mono text-blue-400">₹{(campaign.predicted_revenue || 0).toLocaleString('en-IN')}</p>
                                  </div>
                                  <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 text-center mt-1">
                                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Channel</p>
                                    <p className="text-[11px] font-medium text-slate-300 capitalize">{campaign.channel}</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50 h-[180px]">
                                <span className="text-2xl mb-2 opacity-50">⏸️</span>
                                <p className="text-[11px] text-slate-400">No campaigns currently active<br/>Activity remains within normal bounds</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Executive Insights */}
                        {execInsights.length > 0 && (
                          <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800/80">
                            <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                              <Eye size={14} style={{ color: '#F59E0B' }} /> Executive Synthesis
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {execInsights.map((insight: string, i: number) => (
                                <div key={i} className="flex gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                                  <div className="text-amber-500/70 mt-0.5">•</div>
                                  <p className="text-[11px] text-slate-300 leading-relaxed">{insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* TAB: RISK & TRUST */}
                    {activeTab === 'risk' && (
                      <motion.div key="risk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        
                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* Churn Detail */}
                          <div className="card p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                                <AlertTriangle size={14} style={{ color: '#F97316' }} /> Churn Diagnosis
                              </h3>
                              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                                Conf: {((churn.churn_confidence || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                              <div className="flex flex-col items-center">
                                <span className="text-3xl font-mono font-black tracking-tight" style={{ color: churn.churn_probability > 0.6 ? '#EF4444' : churn.churn_probability > 0.3 ? '#F59E0B' : '#10B981' }}>
                                  {((churn.churn_probability || 0) * 100).toFixed(0)}%
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">Probability</span>
                              </div>
                              <div className="h-10 w-px bg-slate-700"></div>
                              <div className="flex-1">
                                <span className="badge text-[11px] font-bold tracking-wide uppercase px-3 py-1" style={{
                                  background: churn.churn_category === 'Critical' ? '#EF444420' : churn.churn_category === 'High' ? '#F9731620' : '#F59E0B20',
                                  color: churn.churn_category === 'Critical' ? '#EF4444' : churn.churn_category === 'High' ? '#F97316' : '#F59E0B',
                                }}>{churn.churn_category || 'Unknown'}</span>
                              </div>
                            </div>

                            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Driving Factors</h4>
                            <div className="space-y-2">
                              {(churn.churn_reasons || []).map((r: string, i: number) => {
                                const isPositive = r.startsWith('✓');
                                return (
                                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${isPositive ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-slate-800/30 border-slate-700/50'}`}>
                                    <span className="text-[10px] mt-0.5">{isPositive ? '✅' : '⚠️'}</span>
                                    <p className="text-[11px] leading-relaxed" style={{ color: isPositive ? '#34D399' : '#CBD5E1' }}>
                                      {r.replace(/^[✓⚠•-]\s*/, '')}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Trust Detail */}
                          <div className="card p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                                <Shield size={14} style={{ color: '#8B5CF6' }} /> Trust & Sentiment
                              </h3>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded border flex items-center gap-1" style={{ 
                                background: trust.trust_trend === 'declining' ? '#EF444410' : '#10B98110',
                                color: trust.trust_trend === 'declining' ? '#EF4444' : '#10B981',
                                borderColor: trust.trust_trend === 'declining' ? '#EF444430' : '#10B98130'
                              }}>
                                {trust.trust_trend === 'declining' ? '↘ Declining' : trust.trust_trend === 'improving' ? '↗ Improving' : '→ Stable'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                              <div className="flex flex-col items-center">
                                <span className="text-3xl font-mono font-black tracking-tight text-indigo-400">
                                  {(trust.trust_score || 50).toFixed(0)}
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">/ 100</span>
                              </div>
                              <div className="h-10 w-px bg-slate-700"></div>
                              <div className="flex-1">
                                <span className="badge text-[11px] font-bold tracking-wide uppercase px-3 py-1 bg-indigo-500/20 text-indigo-400">
                                  {trust.trust_level || 'Fair'}
                                </span>
                              </div>
                            </div>

                            <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Key Signals</h4>
                            <div className="space-y-2">
                              {(trust.trust_reasons || []).map((d: any, i: number) => {
                                const isPos = d.type === 'positive';
                                const isNeg = d.type === 'negative';
                                return (
                                  <div key={i} className={`flex flex-col gap-1 p-2.5 rounded-lg border ${isPos ? 'bg-emerald-500/5 border-emerald-500/10' : isNeg ? 'bg-red-500/5 border-red-500/10' : 'bg-slate-800/30 border-slate-700/50'}`}>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-medium" style={{ color: isPos ? '#34D399' : isNeg ? '#F87171' : '#94A3B8' }}>{d.impact}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">{d.signal}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Risk Dimensions */}
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-slate-300 mb-5 flex items-center gap-2 uppercase tracking-wider">
                            <BarChart3 size={14} style={{ color: '#EF4444' }} /> Sub-Risk Dimensions
                          </h3>
                          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            {Object.entries(risk.risk_dimensions || {}).map(([key, val]) => {
                              const v = val as number
                              const color = v > 60 ? '#EF4444' : v > 35 ? '#F59E0B' : '#10B981'
                              return (
                                <div key={key} className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-300 capitalize">{key}</span>
                                    <span className="text-xs font-mono font-bold" style={{ color }}>{v.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <motion.div className="h-full rounded-full shadow-[0_0_8px_currentColor]" style={{ background: color, color }}
                                      initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {(risk.risk_drivers || []).length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-800">
                              <h4 className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Primary Drivers</h4>
                              <div className="flex flex-wrap gap-2">
                                {(risk.risk_drivers || []).map((d: string, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-red-500/5 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
                                    <AlertTriangle size={10} className="text-red-400" />
                                    <span className="text-[10px] text-slate-300">{d}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <div className="card h-[80vh] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 w-full max-w-2xl text-center mb-12">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    <Brain size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Meridian True Intelligence Core</h3>
                  <p className="text-slate-400">Select a customer from the directory to unlock their complete, real-time intelligence profile powered by the IPC engine.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl relative z-10">
                  {/* Decision Memory */}
                  <div className="glass-subtle p-6 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 text-left hover:bg-indigo-950/20 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 shadow-inner shadow-indigo-500/20">
                      <Brain size={24} className="text-indigo-400" />
                    </div>
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">Decision Memory</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Meridian remembers the decisions it makes. Every decision routed through the IPC engine is stored to evaluate expected vs. actual outcomes and track real-world accuracy over time.
                    </p>
                  </div>

                  {/* Counterfactual Intel */}
                  <div className="glass-subtle p-6 rounded-2xl border border-purple-500/20 bg-purple-950/10 text-left hover:bg-purple-950/20 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 shadow-inner shadow-purple-500/20">
                      <Network size={24} className="text-purple-400" />
                    </div>
                    <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Counterfactual Intel</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Before executing actions, the Counterfactual Engine generates parallel timelines (e.g. "discount" vs "delay") to predict and recommend the highest expected value.
                    </p>
                  </div>

                  {/* Compression Score */}
                  <div className="glass-subtle p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 text-left hover:bg-emerald-950/20 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 shadow-inner shadow-emerald-500/20">
                      <Zap size={24} className="text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Compression Score</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      An overarching efficiency metric computing the ratio of Business Value to Compute Cost. Enforces an intelligent equilibrium between cheap heuristics and expensive LLMs.
                    </p>
                  </div>

                  {/* Three-Tiered Pipelining */}
                  <div className="glass-subtle p-6 rounded-2xl border border-blue-500/20 bg-blue-950/10 text-left hover:bg-blue-950/20 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 shadow-inner shadow-blue-500/20">
                      <GitBranch size={24} className="text-blue-400" />
                    </div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Three-Tiered Pipeline</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Routes tasks dynamically: <b>Tier 1</b> (Semantic Cache), <b>Tier 2</b> (Specialized ML Models), and <b>Tier 3</b> (LLMs) based on complexity to optimize cost.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
