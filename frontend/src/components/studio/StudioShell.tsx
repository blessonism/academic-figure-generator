import type { ReactNode } from 'react';

interface StudioShellProps {
  header: ReactNode;
  stageNav: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  inspector: ReactNode;
  tasks: ReactNode;
}

export function StudioShell({ header, stageNav, sidebar, main, inspector, tasks }: StudioShellProps) {
  return (
    <section className="space-y-5">
      <div>{header}</div>
      <div>{stageNav}</div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">{main}</main>
        <aside className="space-y-4">
          {sidebar}
          {inspector}
          {tasks}
        </aside>
      </div>
    </section>
  );
}
