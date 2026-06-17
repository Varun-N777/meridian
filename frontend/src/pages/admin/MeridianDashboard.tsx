import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Server, Activity, Database, Zap, ShieldCheck, Box, Network } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import api from '../../services/api'
import { useWsContext } from '../../layouts/AdminLayout'

export default function MeridianDashboard() {
  const [pipelineMetrics, setPipelineMetrics] = useState<any>(null)
  const [aiMetrics, setAiMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { events } = useWsContext()
  const lastMessage = events?.[0] || null

  useEffect(() => {
    // Initial fetch to paint the screen immediately
    const fetchData = async () => {
      try {
        const [pipeRes, aiRes] = await Promise.all([
          api.get('/metrics/pipeline'),
          api.get('/metrics/ai-efficiency')
        ])
        setPipelineMetrics(pipeRes.data)
        setAiMetrics(aiRes.data)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Listen for WebSocket updates from metrics_broadcaster
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'metrics_update') {
      setPipelineMetrics(lastMessage.data.pipeline)
      setAiMetrics(lastMessage.data.ai_efficiency)
    }
  }, [lastMessage])

  if (loading) return <div className="text-white">Loading Meridian Metrics...</div>

  // AI Usage Data for Pie Chart
  const aiUsage = [
    { name: 'Tier 1 (Cache & Rules)', value: aiMetrics?.usage_distribution?.tier1_percent || 0, color: '#10B981' },
    { name: 'Tier 2 (ML Heuristics)', value: aiMetrics?.usage_distribution?.tier2_percent || 0, color: '#F59E0B' },
    { name: 'Tier 3 (Gemini LLM)', value: aiMetrics?.usage_distribution?.tier3_percent || 0, color: '#EF4444' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Network className="text-indigo-400" size={24} />
          Meridian IPC Infrastructure
        </h1>
        <p className="text-sm text-slate-400">
          Real-time metrics for the Intelligence-Per-Compute (IPC) event-driven pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Event Queue Depth</span>
            <Activity size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{pipelineMetrics?.queue_depth || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Pending Redis stream events</p>
        </motion.div>

        <motion.div className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Decision Cache Hit Rate</span>
            <Database size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{pipelineMetrics?.cache_hit_rate || 0}%</p>
          <p className="text-xs text-slate-500 mt-1">Tier 1 Cache optimizations</p>
        </motion.div>

        <motion.div className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">LLM Calls Avoided</span>
            <ShieldCheck size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{aiMetrics?.llm_calls_avoided || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Resolved via heuristics</p>
        </motion.div>

        <motion.div className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Est. API Cost Saved</span>
            <Zap size={16} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">${aiMetrics?.estimated_cost_saved_usd || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Reduced Gemini usage</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div className="card p-6" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Intelligence Routing Distribution
          </h2>
          <div className="h-64 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={aiUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {aiUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--color-border)', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 w-full mt-4 gap-2 text-center">
              {aiUsage.map(d => (
                <div key={d.name}>
                  <p className="text-lg font-bold text-white">{d.value}%</p>
                  <p className="text-[10px] text-slate-500">{d.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div className="card p-6" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Total Intelligence Decisions
          </h2>
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold text-indigo-400 font-mono tracking-tighter">
                {aiMetrics?.total_decisions || 0}
              </h1>
              <p className="text-slate-400 uppercase tracking-widest text-sm">
                Decisions Executed
              </p>
              <div className="mt-8 pt-8 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Meridian Architecture actively routes decisions through Tier 1 heuristics and Decision Cache first, scaling to Tier 3 LLMs only on high ambiguity.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Compression Score */}
        <motion.div className="card p-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" /> Decision Compression Score
          </h2>
          <div className="flex items-center gap-6 h-32">
            <div className="text-center w-32">
              <span className="text-5xl font-bold font-mono" style={{ color: (aiMetrics?.decision_compression_score || 0) > 80 ? '#10B981' : (aiMetrics?.decision_compression_score || 0) > 50 ? '#F59E0B' : '#EF4444' }}>
                {aiMetrics?.decision_compression_score || 0}
              </span>
              <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Efficiency</p>
            </div>
            <div className="flex-1 h-full">
              {aiMetrics?.compression_trend && aiMetrics.compression_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aiMetrics.compression_trend.map((v: number, i: number) => ({ name: i, value: v }))}>
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-600 border border-dashed border-slate-700/50 rounded-lg">
                  Awaiting Telemetry...
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Decision Memory Learning */}
        <motion.div className="card p-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Network size={16} className="text-emerald-400" /> Decision Memory Bank
          </h2>
          <div className="grid grid-cols-3 gap-4 h-32 items-center">
            <div className="text-center border-r border-slate-700/50">
              <p className="text-3xl font-bold text-white font-mono">{aiMetrics?.memory_learning?.decisions_learned_today || 0}</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Outcomes Learned</p>
            </div>
            <div className="text-center border-r border-slate-700/50">
              <p className="text-3xl font-bold text-emerald-400 font-mono">{aiMetrics?.memory_learning?.prediction_accuracy || 0}%</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Engine Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-400 font-mono">{aiMetrics?.memory_learning?.memory_growth || 0}</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Total Memories</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
