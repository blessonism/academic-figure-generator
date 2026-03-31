import userEvent from '@testing-library/user-event';

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
        canConfirm={true}
        isConfirmed={false}
        onModeChange={() => {}}
        onPresetSelect={() => {}}
        onSelectedSectionIndicesChange={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /整篇论文/ })).toBeInTheDocument();
    expect(screen.queryByText('展开全部')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确认范围并继续' })).toBeInTheDocument();
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
        canConfirm={true}
        isConfirmed={false}
        onModeChange={() => {}}
        onPresetSelect={() => {}}
        onSelectedSectionIndicesChange={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByText('展开全部')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /自定义范围/ })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('点击左侧章节标题'))).toBeInTheDocument();
  });

  it('disables confirm action when custom mode has no selected sections', () => {
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
        ]}
        selectedSectionIndices={[]}
        canConfirm={false}
        isConfirmed={false}
        onModeChange={() => {}}
        onPresetSelect={() => {}}
        onSelectedSectionIndicesChange={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: '确认范围并继续' })).toBeDisabled();
  });

  it('calls confirm handler when primary action is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ScopeStage
        mode="preset"
        selectedPresetId="methods-models"
        documentName="paper.pdf"
        sections={[
          {
            title: '1 Introduction',
            content: 'Intro content',
          },
        ]}
        selectedSectionIndices={[0]}
        canConfirm={true}
        isConfirmed={false}
        onModeChange={() => {}}
        onPresetSelect={() => {}}
        onSelectedSectionIndicesChange={() => {}}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: '确认范围并继续' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
