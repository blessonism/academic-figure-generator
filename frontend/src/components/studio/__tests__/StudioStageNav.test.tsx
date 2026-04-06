import { render, screen } from '@/test/render';
import { StudioStageNav } from '@/components/studio/StudioStageNav';
import type { StudioStageNavItem } from '@/studio/types';

describe('StudioStageNav', () => {
  it('shows stage objective alongside blocked reason and next action', () => {
    const stages: StudioStageNavItem[] = [
      {
        id: 'scope',
        label: '确认范围',
        status: 'blocked',
        objective: '先确认输入与解析是否就绪，再进入范围设计。',
        reason: '缺少已解析文档',
        nextAction: '请先上传并解析论文',
      },
    ];

    render(
      <StudioStageNav
        currentStage="ingest"
        stages={stages}
        onStageSelect={() => {}}
      />,
    );

    expect(screen.getByText('先确认输入与解析是否就绪，再进入范围设计。')).toBeInTheDocument();
    expect(screen.getByText('缺少已解析文档')).toBeInTheDocument();
    expect(screen.getByText('请先上传并解析论文')).toBeInTheDocument();
  });

  it('shows blocked stage with reason and next action', () => {
    render(
      <StudioStageNav
        currentStage="ingest"
        stages={[
          {
            id: 'scope',
            label: '确认范围',
            status: 'blocked',
            reason: '缺少已解析文档',
            nextAction: '请先上传并解析论文',
          },
        ]}
        onStageSelect={() => {}}
      />,
    );

    expect(screen.getByText('缺少已解析文档')).toBeInTheDocument();
    expect(screen.getByText('请先上传并解析论文')).toBeInTheDocument();
  });
});
