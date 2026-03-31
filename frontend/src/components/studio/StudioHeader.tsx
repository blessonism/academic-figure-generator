import { Card, CardContent } from '@/components/ui/card';
import { STUDIO_STAGE_LABELS } from '@/studio/constants';
import type { StudioStage } from '@/studio/types';

interface StudioHeaderProps {
  projectId: string | null;
  currentStage: StudioStage;
}

export function StudioHeader({ projectId, currentStage }: StudioHeaderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">项目 {projectId ?? '未命名'}</p>
          <h1 className="text-3xl font-bold tracking-tight">Studio</h1>
        </div>

        <div className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
          当前阶段：{STUDIO_STAGE_LABELS[currentStage]}
        </div>
      </CardContent>
    </Card>
  );
}
