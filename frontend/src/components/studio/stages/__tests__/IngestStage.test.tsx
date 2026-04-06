import { render, screen } from '@/test/render';

import { IngestStage } from '@/components/studio/stages/IngestStage';

describe('IngestStage', () => {
  it('organizes ingest experience into four professional panels', () => {
    render(
      <IngestStage
        documents={[]}
        isUploading={false}
        uploadProgress={0}
        hasOcrConfig={true}
        ocrLoading={{}}
        statusMessage={null}
        onUploadClick={() => {}}
        onFileChange={() => {}}
        onTriggerOcr={() => {}}
        onDownloadMarkdown={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: '输入来源' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '上传与解析状态' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '已识别文档列表' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '就绪摘要' })).toBeInTheDocument();
  });

  it('shows setup checklist when OCR is unavailable', () => {
    render(
      <IngestStage
        documents={[]}
        isUploading={false}
        uploadProgress={0}
        hasOcrConfig={false}
        ocrLoading={{}}
        statusMessage={null}
        onUploadClick={() => {}}
        onFileChange={() => {}}
        onTriggerOcr={() => {}}
        onDownloadMarkdown={() => {}}
      />,
    );

    expect(screen.getByText('请先完成能力配置')).toBeInTheDocument();
    expect(screen.getByText(/PaddleOCR/)).toBeInTheDocument();
  });

  it('shows parsing status card while a document is parsing', () => {
    render(
      <IngestStage
        documents={[
          {
            id: 'doc-1',
            original_filename: 'paper.pdf',
            file_type: 'pdf',
            file_size_bytes: 1024,
            parse_status: 'parsing',
          },
        ]}
        isUploading={false}
        uploadProgress={0}
        hasOcrConfig={true}
        ocrLoading={{}}
        statusMessage={null}
        onUploadClick={() => {}}
        onFileChange={() => {}}
        onTriggerOcr={() => {}}
        onDownloadMarkdown={() => {}}
      />,
    );

    expect(screen.getByText('paper.pdf')).toBeInTheDocument();
    expect(screen.getByText('解析中')).toBeInTheDocument();
  });

  it('shows OCR markdown download action for completed OCR documents', () => {
    render(
      <IngestStage
        documents={[
          {
            id: 'doc-2',
            original_filename: 'paper.pdf',
            file_type: 'pdf',
            file_size_bytes: 1024,
            parse_status: 'completed',
            ocr_markdown: '# OCR result',
          },
        ]}
        isUploading={false}
        uploadProgress={0}
        hasOcrConfig={true}
        ocrLoading={{}}
        statusMessage={null}
        onUploadClick={() => {}}
        onFileChange={() => {}}
        onTriggerOcr={() => {}}
        onDownloadMarkdown={() => {}}
      />,
    );

    expect(screen.getByText('下载 MD')).toBeInTheDocument();
    expect(screen.getByText('PaddleOCR 解析')).toBeInTheDocument();
  });
});
