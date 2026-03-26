import { Card, CardContent } from '@/components/ui/card';
import type { StudioStage, StudioStageNavItem } from '@/studio/types';

interface StudioStageNavProps {
  currentStage: StudioStage;
  stages: StudioStageNavItem[];
}

function getStageClasses(isCurrent: boolean, status: StudioStageNavItem['status']) {
  if (status === 'blocked') {
    return 'border-amber-300 bg-amber-50';
  }

  if (isCurrent || status === 'current') {
    return 'border-primary/40 bg-primary/5';
  }

  if (status === 'complete') {
    return 'border-emerald-300 bg-emerald-50';
  }

  return 'border-border bg-card';
}

export function StudioStageNav({ currentStage, stages }: StudioStageNavProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {stages.map((stage) => {
        const isCurrent = stage.id === currentStage;

        return (
          <Card key={stage.id} className={getStageClasses(isCurrent, stage.status)}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{stage.label}</p>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{stage.status}</span>
              </div>

              {stage.reason ? <p className="text-sm text-muted-foreground">{stage.reason}</p> : null}
              {stage.nextAction ? <p className="text-sm font-medium text-foreground">{stage.nextAction}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
