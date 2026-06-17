import { useEffect, useState, useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import { Activity, Brain, ShieldAlert, Gift, Zap, LogIn, ShoppingCart } from 'lucide-react'

/* ── Custom Nodes ─────────────────────────────────── */

function InputNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 rounded-xl glass-subtle border border-white/10 flex items-center gap-3 min-w-[160px]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${data.color}20` }}>
        <data.icon size={16} style={{ color: data.color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{data.label}</p>
        <p className="text-[10px] text-slate-400">{data.subLabel}</p>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-500 border-none" />
    </div>
  )
}

function AICoreNode({ data }: { data: any }) {
  return (
    <div className="relative">
      {/* Outer pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(79, 70, 229, 0.5)' }}
        animate={{ scale: data.isPulsing ? 1.4 : 1, opacity: data.isPulsing ? 0 : 0.8 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 z-10 relative bg-black/80 backdrop-blur-md"
           style={{ borderColor: data.isPulsing ? '#4F46E5' : 'rgba(79, 70, 229, 0.3)', boxShadow: data.isPulsing ? '0 0 30px rgba(79, 70, 229, 0.6)' : '0 0 10px rgba(79, 70, 229, 0.2)', transition: 'all 0.3s ease' }}>
        <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-indigo-500 border-none" />
        <Brain size={28} className={data.isPulsing ? 'text-white' : 'text-indigo-400'} />
        <span className="text-[10px] font-bold mt-1 text-indigo-300 uppercase tracking-widest">Meridian</span>
        <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-indigo-500 border-none" />
      </div>
    </div>
  )
}

function OutputNode({ data }: { data: any }) {
  return (
    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 min-w-[180px] bg-black/60 backdrop-blur-md border border-${data.colorClass}-500/30 transition-all ${data.isActive ? `shadow-[0_0_15px_rgba(var(--color-${data.colorClass}),0.4)] border-${data.colorClass}-500` : ''}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-500 border-none" />
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${data.colorClass}-500/20`}>
        <data.icon size={16} className={`text-${data.colorClass}-400`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{data.label}</p>
        <p className="text-[10px] text-slate-400">{data.subLabel}</p>
      </div>
    </div>
  )
}

const nodeTypes = {
  inputNode: InputNode,
  aiCoreNode: AICoreNode,
  outputNode: OutputNode,
}

/* ── Graph Component ──────────────────────────────── */

const initialNodes = [
  // Inputs (Left)
  { id: 'in_traffic', type: 'inputNode', position: { x: 100, y: 150 }, data: { label: 'Web Traffic', subLabel: 'Page Views', icon: Activity, color: '#3B82F6' } },
  { id: 'in_auth', type: 'inputNode', position: { x: 100, y: 250 }, data: { label: 'Auth Events', subLabel: 'Logins/Regs', icon: LogIn, color: '#10B981' } },
  { id: 'in_txn', type: 'inputNode', position: { x: 100, y: 350 }, data: { label: 'Transactions', subLabel: 'Purchases/Carts', icon: ShoppingCart, color: '#F59E0B' } },
  
  // Center (AI)
  { id: 'ai_core', type: 'aiCoreNode', position: { x: 450, y: 220 }, data: { isPulsing: false } },
  
  // Outputs (Right)
  { id: 'out_campaign', type: 'outputNode', position: { x: 800, y: 150 }, data: { label: 'Trigger Campaign', subLabel: 'Email/SMS', icon: Gift, colorClass: 'blue', isActive: false } },
  { id: 'out_intervention', type: 'outputNode', position: { x: 800, y: 250 }, data: { label: 'Churn Intervention', subLabel: 'Discount Sent', icon: ShieldAlert, colorClass: 'red', isActive: false } },
  { id: 'out_nba', type: 'outputNode', position: { x: 800, y: 350 }, data: { label: 'Next Best Action', subLabel: 'UI Personalization', icon: Zap, colorClass: 'yellow', isActive: false } },
]

const initialEdges = [
  { id: 'e_traffic_ai', source: 'in_traffic', target: 'ai_core', animated: true, style: { stroke: '#334155' } },
  { id: 'e_auth_ai', source: 'in_auth', target: 'ai_core', animated: true, style: { stroke: '#334155' } },
  { id: 'e_txn_ai', source: 'in_txn', target: 'ai_core', animated: true, style: { stroke: '#334155' } },
  
  { id: 'e_ai_campaign', source: 'ai_core', target: 'out_campaign', animated: true, style: { stroke: '#334155' } },
  { id: 'e_ai_interv', source: 'ai_core', target: 'out_intervention', animated: true, style: { stroke: '#334155' } },
  { id: 'e_ai_nba', source: 'ai_core', target: 'out_nba', animated: true, style: { stroke: '#334155' } },
]

export default function LiveDecisionGraph({ latestEvent }: { latestEvent: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // React to live events
  useEffect(() => {
    if (!latestEvent) return

    const type = latestEvent.event_type?.toLowerCase() || ''
    
    // 1. Determine which input node fired
    let sourceId = 'in_traffic'
    if (type.includes('login') || type.includes('register')) sourceId = 'in_auth'
    else if (type.includes('purchase') || type.includes('cart') || type.includes('checkout')) sourceId = 'in_txn'

    // 2. Determine likely output node (mocked AI logic for visualization)
    let targetId = 'out_nba'
    let edgeColor = '#EAB308' // Yellow for NBA
    if (type.includes('churn') || type.includes('refund') || type.includes('ticket')) {
      targetId = 'out_intervention'
      edgeColor = '#EF4444' // Red
    } else if (type.includes('purchase') || type.includes('register')) {
      targetId = 'out_campaign'
      edgeColor = '#3B82F6' // Blue
    }

    // Update nodes to pulse/activate
    setNodes(nds => nds.map(node => {
      if (node.id === 'ai_core') return { ...node, data: { ...node.data, isPulsing: true } }
      if (node.id === targetId) return { ...node, data: { ...node.data, isActive: true } }
      return node
    }))

    // Highlight the path (Input -> AI -> Output)
    setEdges(eds => eds.map(edge => {
      if (edge.source === sourceId && edge.target === 'ai_core') {
        return { ...edge, style: { stroke: edgeColor, strokeWidth: 2 }, animated: true }
      }
      if (edge.source === 'ai_core' && edge.target === targetId) {
        return { ...edge, style: { stroke: edgeColor, strokeWidth: 2 }, animated: true }
      }
      return edge
    }))

    // Reset after animation
    const timeout = setTimeout(() => {
      setNodes(nds => nds.map(node => ({ ...node, data: { ...node.data, isPulsing: false, isActive: false } })))
      setEdges(eds => eds.map(edge => ({ ...edge, style: { stroke: '#334155', strokeWidth: 1 } })))
    }, 1500)

    return () => clearTimeout(timeout)
  }, [latestEvent, setNodes, setEdges])

  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black opacity-60 z-0" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        zoomOnScroll={false}
        panOnDrag={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        className="z-10 pointer-events-none" // Disable interaction so it sits safely in background
      >
        <Background color="#1E293B" gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}
