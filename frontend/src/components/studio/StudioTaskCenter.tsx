import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudioTaskItem } from '@/studio/types';

interface StudioTaskCenterProps {
  tasks: StudioTaskItem[];
}

export function StudioTaskCenter({ tasks }: StudioTaskCenterProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">任务中心</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{task.type}</p>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{task.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{task.target}</p>
            <p className="mt-1 text-sm text-foreground">{task.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
