import { CheckCircle2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface StudioDemoCompletionCardProps {
  detail: string
  onDismiss: () => void
  title: string
}

export function StudioDemoCompletionCard({
  detail,
  onDismiss,
  title,
}: StudioDemoCompletionCardProps) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/80 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-emerald-950">{title}</h2>
            <p className="text-sm leading-6 text-emerald-900/80">{detail}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
          <span className="sr-only">关闭完成提示</span>
        </Button>
      </CardContent>
    </Card>
  )
}
