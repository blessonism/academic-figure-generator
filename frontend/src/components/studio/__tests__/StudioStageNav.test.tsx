import { render, screen } from '@/test/render';
import { StudioStageNav } from '@/components/studio/StudioStageNav';

describe('StudioStageNav', () => {
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
      />,
    );

    expect(screen.getByText('缺少已解析文档')).toBeInTheDocument();
    expect(screen.getByText('请先上传并解析论文')).toBeInTheDocument();
  });
});
