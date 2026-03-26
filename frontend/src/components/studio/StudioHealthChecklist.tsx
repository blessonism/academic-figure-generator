import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudioHealthItem } from '@/studio/types';

interface StudioHealthChecklistProps {
  items: StudioHealthItem[];
}

export function StudioHealthChecklist({ items }: StudioHealthChecklistProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">准备清单</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{item.label}</p>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
