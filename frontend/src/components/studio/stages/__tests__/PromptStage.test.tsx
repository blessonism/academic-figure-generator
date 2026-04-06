import { render, screen } from '@/test/render';

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
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
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
        promptRequest=""
        templateMode={false}
        isGeneratingDrafts={false}
        savingDraftIds={{}}
        statusMessage={null}
        onPromptModeChange={() => {}}
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
});
