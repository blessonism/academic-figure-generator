import { Card, CardContent } from '@/components/ui/card';
import { STUDIO_STAGE_LABELS, STUDIO_STAGE_OBJECTIVES } from '@/studio/constants';
import type { StudioStage } from '@/studio/types';

interface StudioHeaderProps {
  projectId: string | null;
  currentStage: StudioStage;
}

export function StudioHeader({ projectId, currentStage }: StudioHeaderProps) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,_#0f172a,_#111827_45%,_#0f766e)] text-white shadow-lg shadow-slate-950/10">
      <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-300">项目 {projectId ?? '未命名'}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">研究型工作台</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              {STUDIO_STAGE_OBJECTIVES[currentStage]}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300">当前阶段</p>
          <p className="mt-2 font-medium text-white">{STUDIO_STAGE_LABELS[currentStage]}</p>
        </div>
      </CardContent>
    </Card>
  );
}
