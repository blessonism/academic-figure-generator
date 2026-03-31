import { render, screen } from '@/test/render';
import { StudioShell } from '@/components/studio/StudioShell';

describe('StudioShell', () => {
  it('renders all layout slots', () => {
    render(
      <StudioShell
        header={<div>Header Slot</div>}
        stageNav={<div>Stage Nav Slot</div>}
        sidebar={<div>Sidebar Slot</div>}
        main={<div>Main Slot</div>}
        inspector={<div>Inspector Slot</div>}
        tasks={<div>Task Slot</div>}
      />,
    );

    expect(screen.getByText('Header Slot')).toBeInTheDocument();
    expect(screen.getByText('Stage Nav Slot')).toBeInTheDocument();
    expect(screen.getByText('Sidebar Slot')).toBeInTheDocument();
    expect(screen.getByText('Main Slot')).toBeInTheDocument();
    expect(screen.getByText('Inspector Slot')).toBeInTheDocument();
    expect(screen.getByText('Task Slot')).toBeInTheDocument();
  });
});
