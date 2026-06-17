import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Target, Zap, Mail, MessageSquare, Gift, Clock, ChevronRight } from 'lucide-react'
import api from '../../services/api'

export default function NBACenter() {
  const { data: nbaOverview } = useQuery({
    queryKey: ['nbaOverview'],
    queryFn: () => api.get('/analytics/nba').then(r => r.data),
    refetchInterval: 15000,
  })

  const tierColors: Record<string, string> = { rules: '#10B981', ml: '#3B82F6', gemini: '#8B5CF6' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Next Best Action Center</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Hierarchical Inference Router: Rules → ML → Gemini</p>
        </div>

      </div>


        <div className="space-y-5">
          {/* NBA Statistics with NEW ANALYTICS CARDS */}
          <div className="grid grid-cols-5 gap-4">
            <motion.div className="card p-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs mb-1" style={{ color: '#64748B' }}>Total Decisions</p>
              <p className="text-2xl font-bold text-white mono">{nbaOverview?.total_decisions || 0}</p>
            </motion.div>
            
            <motion.div className="card p-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <p className="text-xs mb-1" style={{ color: '#64748B' }}>Avg Confidence</p>
              <p className="text-2xl font-bold mono" style={{ color: '#10B981' }}>{((nbaOverview?.avg_confidence || 0) * 100).toFixed(0)}%</p>
            </motion.div>
            
            <motion.div className="card p-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-xs mb-1" style={{ color: '#64748B' }}>High Confidence</p>
              <p className="text-2xl font-bold text-white mono">{nbaOverview?.high_confidence_decisions || 0}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>&gt;70% confidence</p>
            </motion.div>
            
            {Object.entries(nbaOverview?.tier_distribution || {}).map(([tier, count], i) => (
              <motion.div key={tier} className="card p-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + (i * 0.05) }}>
                <p className="text-xs mb-1 uppercase" style={{ color: tierColors[tier] || '#64748B' }}>{tier} Tier</p>
                <p className="text-2xl font-bold text-white mono">{count as number}</p>
              </motion.div>
            ))}
          </div>

          {/* Action & Channel Distribution Cards */}
          <div className="grid grid-cols-2 gap-5">
            <motion.div className="card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h3 className="text-sm font-semibold text-white mb-4">Actions by Type</h3>
              <div className="space-y-2">
                {Object.entries(nbaOverview?.action_distribution || {}).map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-xs capitalize" style={{ color: '#94A3B8' }}>{action.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-white mono">{count as number}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-sm font-semibold text-white mb-4">Channels by Type</h3>
              <div className="space-y-2">
                {Object.entries(nbaOverview?.channel_distribution || {}).map(([channel, count]) => (
                  <div key={channel} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-xs capitalize" style={{ color: '#94A3B8' }}>{channel}</span>
                    <span className="text-sm font-bold text-white mono">{count as number}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* NBA Decision Table with REAL DATABASE VALUES */}
          <motion.div className="card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h3 className="text-sm font-semibold text-white mb-4">Recent NBA Decisions (Highest Risk First)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Customer</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Risk</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Trust</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Engagement</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>CLV</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Action</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Channel</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Tier</th>
                    <th className="text-left text-xs font-medium py-2 px-3" style={{ color: '#64748B' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(nbaOverview?.decisions || []).map((d: any) => (
                    <tr key={d.decision_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <p className="text-xs font-medium text-white">{d.customer_name}</p>
                        <p className="text-[10px]" style={{ color: '#64748B' }}>{d.customer_id.slice(0, 12)}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-medium mono" style={{ color: d.churn_probability > 0.7 ? '#EF4444' : d.churn_probability > 0.5 ? '#F59E0B' : '#10B981' }}>
                          {(d.churn_probability * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs mono" style={{ color: '#94A3B8' }}>{d.trust_score?.toFixed(0) || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs mono" style={{ color: '#94A3B8' }}>{d.engagement_score?.toFixed(0) || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs mono" style={{ color: '#94A3B8' }}>₹{d.clv?.toLocaleString() || '0'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="badge badge-info text-[10px]">{d.recommended_action?.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-300 capitalize">{d.channel}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                          {d.inference_tier?.replace('Tier 1 ', '').replace('Tier 2 ', '').replace('Tier 3 ', '')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-medium mono" style={{ color: d.confidence > 0.7 ? '#10B981' : '#F59E0B' }}>
                          {(d.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
  )
}
