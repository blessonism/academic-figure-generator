import { render, screen } from '@/test/render';

import { ScopeStage } from '@/components/studio/stages/ScopeStage';

describe('ScopeStage', () => {
  it('shows scope preset cards before advanced tree picker', () => {
    render(
      <ScopeStage
        mode="preset"
        selectedPresetId="full-paper"
        documentName="paper.pdf"
        sections={[
          {
            title: '1 Introduction',
            content: 'Intro content',
          },
        ]}
        selectedSectionIndices={[]}
        onModeChange={() => {}}
        onPresetSelect={() => {}}
        onSelectedSectionIndicesChange={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /整篇论文/ })).toBeInTheDocument();
    expect(screen.queryByText('展开全部')).not.toBeInTheDocument();
  });

  it('reveals advanced tree controls when custom mode is selected', () => {
    render(
      <ScopeStage
        mode="custom"
        selectedPresetId="custom"
        documentName="paper.pdf"
        sections={[
          {
            title: '1 Introduction',
            content: 'Intro content',
          },
          {
            title: '1.1 Background',
            content: 'Background content',
          },
        ]}
        selectedSectionIndices={[0]}
        onModeChange={() => {}}
        onPresetSelect={() => {}}
        onSelectedSectionIndicesChange={() => {}}
      />,
    );

    expect(screen.getByText('展开全部')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /自定义范围/ })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('点击左侧章节标题'))).toBeInTheDocument();
  });
});
