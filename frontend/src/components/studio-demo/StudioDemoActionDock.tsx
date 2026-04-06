import { CheckCircle2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StudioDemoActionDockProps {
  actionLabel: string
  detail: string
  onAction: () => void
  open: boolean
}

export function StudioDemoActionDock({
  actionLabel,
  detail,
  onAction,
  open,
}: StudioDemoActionDockProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        className={cn(
          'flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{detail}</p>
            <p className="text-xs text-slate-500">所有关键动作统一在底部收口，减少主区干扰。</p>
          </div>
        </div>
        <Button onClick={onAction} className="rounded-full px-5">
          <CheckCircle2 className="h-4 w-4" />
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
