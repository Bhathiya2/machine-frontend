import { motion } from 'motion/react'

export function LoginIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <motion.div
        className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">System status</span>
          <span className="flex items-center gap-1.5 text-xs text-white/80">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            Online
          </span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Machines monitored', value: '12' },
            { label: 'Active work orders', value: '3' },
            { label: 'Uptime', value: '98.4%' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <span className="text-xs text-white/60">{item.label}</span>
              <span className="font-mono text-sm font-semibold text-white">{item.value}</span>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full rounded-full bg-white"
            animate={{ width: ['40%', '85%', '60%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>

      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute size-1 rounded-full bg-white/40"
          style={{ top: `${20 + i * 25}%`, right: `${8 + i * 12}%` }}
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </div>
  )
}
