import { render, screen } from '@/test/render';

import { PromptStage } from '@/components/studio/stages/PromptStage';

describe('PromptStage', () => {
  it('renders prompt drafts with accept and skip actions', () => {
    render(
      <PromptStage
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

    expect(screen.getByText('整体架构图')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '接受' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '跳过' })).toBeInTheDocument();
    expect(screen.getByText('查看来源范围')).toBeInTheDocument();
  });
});
