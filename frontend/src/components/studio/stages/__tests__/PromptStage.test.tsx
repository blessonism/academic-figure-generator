import { render, screen, userEvent } from '@/test/render';

import { PromptStage } from '@/components/studio/stages/PromptStage';

describe('PromptStage', () => {
  it('organizes prompt review into candidate pool, intent, risk and retained set panels', () => {
    render(
      <PromptStage
        confirmedScopeSummary={{
          label: '方法与模型',
          sectionCount: 3,
          documentName: 'paper.pdf',
        }}
        drafts={[
          {
            id: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'accepted',
            promptText: '请生成一张整体架构图，突出模型主干与关键模块。',
            generationStatus: 'completed',
            sourceSections: [{ index: 0, title: '1 Introduction' }],
          },
        ]}
        promptMode="overall"
        overallPromptFigureType="overall_framework"
        sectionPromptFigureTypes={[]}
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
        onOverallPromptFigureTypeChange={() => {}}
        onSectionPromptFigureTypeToggle={() => {}}
        onSectionPromptFigureTypesReset={() => {}}
        onPromptRequestChange={() => {}}
        onTemplateModeChange={() => {}}
        onGenerateDrafts={() => {}}
        onDraftStatusChange={() => {}}
        onDraftPromptChange={() => {}}
        onSaveDraftPrompt={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: '候选草案池' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '用途标签 / 生成意图' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '风险提示' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '已保留集' })).toBeInTheDocument();
  });

  it('renders prompt drafts with accept and skip actions', () => {
    render(
      <PromptStage
        confirmedScopeSummary={null}
        drafts={[
          {
            id: 'draft-1',
            title: '整体架构图',
            figureType: 'overall_framework',
            status: 'pending',
            promptText: '请生成一张整体架构图，突出模型主干与关键模块。',
            generationStatus: 'completed',
            sourceSections: [{ index: 0, title: '1 Introduction' }],
          },
        ]}
        promptMode="overall"
        overallPromptFigureType="overall_framework"
        sectionPromptFigureTypes={[]}
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
        onOverallPromptFigureTypeChange={() => {}}
        onSectionPromptFigureTypeToggle={() => {}}
        onSectionPromptFigureTypesReset={() => {}}
        onPromptRequestChange={() => {}}
        onTemplateModeChange={() => {}}
        onGenerateDrafts={() => {}}
        onDraftStatusChange={() => {}}
        onDraftPromptChange={() => {}}
        onSaveDraftPrompt={() => {}}
      />,
    );

    expect(screen.getAllByText('整体架构图').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '接受' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳过' })).toBeInTheDocument();
    expect(screen.getByText('查看来源范围')).toBeInTheDocument();
  });

  it('在按章节模式下显示自动推荐与图型多选按钮组', () => {
    render(
      <PromptStage
        confirmedScopeSummary={null}
        drafts={[]}
        promptMode="sections"
        overallPromptFigureType="overall_framework"
        sectionPromptFigureTypes={[]}
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
        onOverallPromptFigureTypeChange={() => {}}
        onSectionPromptFigureTypeToggle={() => {}}
        onSectionPromptFigureTypesReset={() => {}}
        onPromptRequestChange={() => {}}
        onTemplateModeChange={() => {}}
        onGenerateDrafts={() => {}}
        onDraftStatusChange={() => {}}
        onDraftPromptChange={() => {}}
        onSaveDraftPrompt={() => {}}
      />,
    );

    expect(screen.getByText('图型偏好')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '自动推荐' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '网络架构图' })).toBeInTheDocument();
  });

  it('在按章节模式下点击图型按钮会触发切换回调，并带上 aria-pressed', async () => {
    const user = userEvent.setup();
    const onSectionPromptFigureTypeToggle = vi.fn();

    render(
      <PromptStage
        confirmedScopeSummary={null}
        drafts={[]}
        promptMode="sections"
        overallPromptFigureType="overall_framework"
        sectionPromptFigureTypes={['network_architecture']}
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
        onOverallPromptFigureTypeChange={() => {}}
        onSectionPromptFigureTypeToggle={onSectionPromptFigureTypeToggle}
        onSectionPromptFigureTypesReset={() => {}}
        onPromptRequestChange={() => {}}
        onTemplateModeChange={() => {}}
        onGenerateDrafts={() => {}}
        onDraftStatusChange={() => {}}
        onDraftPromptChange={() => {}}
        onSaveDraftPrompt={() => {}}
      />,
    );

    const selectedButton = screen.getByRole('button', { name: '网络架构图' });
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '对比 / 消融图' }));
    expect(onSectionPromptFigureTypeToggle).toHaveBeenCalledWith('comparison_ablation');
  });

  it('在按章节模式下点击自动推荐会触发重置回调', async () => {
    const user = userEvent.setup();
    const onSectionPromptFigureTypesReset = vi.fn();

    render(
      <PromptStage
        confirmedScopeSummary={null}
        drafts={[]}
        promptMode="sections"
        overallPromptFigureType="overall_framework"
        sectionPromptFigureTypes={['network_architecture']}
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
        onOverallPromptFigureTypeChange={() => {}}
        onSectionPromptFigureTypeToggle={() => {}}
        onSectionPromptFigureTypesReset={onSectionPromptFigureTypesReset}
        onPromptRequestChange={() => {}}
        onTemplateModeChange={() => {}}
        onGenerateDrafts={() => {}}
        onDraftStatusChange={() => {}}
        onDraftPromptChange={() => {}}
        onSaveDraftPrompt={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: '自动推荐' }));
    expect(onSectionPromptFigureTypesReset).toHaveBeenCalledTimes(1);
  });
});
