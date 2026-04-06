import { useMemo, useRef } from 'react';
import type { ChangeEventHandler } from 'react';
import { AlertCircle, CheckCircle2, FileDown, FileUp, Loader2, ScanText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StudioDocumentItem, StudioStatusMessage } from '@/studio/types';

interface IngestStageProps {
  documents: StudioDocumentItem[];
  isUploading: boolean;
  uploadProgress: number;
  hasOcrConfig: boolean;
  ocrLoading: Record<string, boolean>;
  statusMessage: StudioStatusMessage | null;
  onUploadClick: () => void;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  onTriggerOcr: (document: StudioDocumentItem) => void;
  onDownloadMarkdown: (document: StudioDocumentItem) => void;
}

function getDocumentBadgeLabel(status: StudioDocumentItem['parse_status']) {
  if (status === 'completed') {
    return '已解析';
  }

  if (status === 'failed') {
    return '失败';
  }

  if (status === 'parsing') {
    return '解析中';
  }

  return '待解析';
}

function getDocumentBadgeVariant(status: StudioDocumentItem['parse_status']) {
  if (status === 'completed') {
    return 'secondary' as const;
  }

  if (status === 'failed') {
    return 'destructive' as const;
  }

  return 'outline' as const;
}

function StagePanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function IngestStage({
  documents,
  isUploading,
  uploadProgress,
  hasOcrConfig,
  ocrLoading,
  statusMessage,
  onUploadClick,
  onFileChange,
  onTriggerOcr,
  onDownloadMarkdown,
}: IngestStageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const completedCount = useMemo(
    () => documents.filter((document) => document.parse_status === 'completed').length,
    [documents],
  );
  const parsingCount = useMemo(
    () =>
      documents.filter(
        (document) => document.parse_status === 'parsing' || document.parse_status === 'pending',
      ).length,
    [documents],
  );
  const readyForScope = completedCount > 0;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <StagePanel
        title="输入来源"
        description="先把本轮研究材料上传进项目，后续范围设计和草案评审都会围绕这里的文档展开。"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={onFileChange}
        />

        <div className="rounded-2xl border-2 border-dashed p-6 text-center">
          <FileUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">上传论文文档</p>
          <p className="mt-1 text-xs text-muted-foreground">支持 PDF, DOCX, TXT（最大 50MB）</p>
          <Button
            className="mt-4"
            onClick={() => {
              onUploadClick();
              inputRef.current?.click();
            }}
          >
            选择文件
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">当前文档数</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{documents.length}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">可进入范围阶段</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{readyForScope ? '是' : '否'}</p>
          </div>
        </div>
      </StagePanel>

      <StagePanel
        title="上传与解析状态"
        description="把上传进度、OCR 可用性和系统状态集中展示，先判断输入链路是否可靠。"
      >
        {!hasOcrConfig && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">请先完成能力配置</p>
            <p className="mt-1 text-amber-800">
              当前缺少 PaddleOCR Server URL 或 Token，PDF 暂时无法触发 OCR 重解析。
            </p>
          </div>
        )}

        {statusMessage && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">状态更新</p>
            <p className="mt-1 text-muted-foreground">{statusMessage.detail}</p>
          </div>
        )}

        {isUploading ? (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>上传中...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">OCR 能力</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {hasOcrConfig ? '已配置，可直接重解析 PDF' : '未配置，仅支持基础上传'}
              </p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">解析状态</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {parsingCount > 0 ? `${parsingCount} 份文档处理中` : '当前无进行中的解析任务'}
              </p>
            </div>
          </div>
        )}
      </StagePanel>

      <StagePanel
        title="已识别文档列表"
        description="查看每份输入材料的解析结果，并在需要时重新触发 OCR 或下载 Markdown。"
        className="xl:col-span-1"
      >
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无文档，请先上传 PDF / DOCX / TXT。</p>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => {
              const isParsing =
                document.parse_status === 'parsing' || document.parse_status === 'pending';

              return (
                <div key={document.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{document.original_filename}</p>
                      {document.parse_status === 'failed' && document.parse_error && (
                        <p className="mt-1 text-xs text-destructive">{document.parse_error}</p>
                      )}
                      {document.parse_status === 'completed' && document.ocr_markdown && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                          <ScanText className="h-3 w-3" />
                          PaddleOCR 解析
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isParsing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {document.parse_status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {document.parse_status === 'failed' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge variant={getDocumentBadgeVariant(document.parse_status)}>
                        {getDocumentBadgeLabel(document.parse_status)}
                      </Badge>
                    </div>
                  </div>

                  {document.file_type === 'pdf' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!hasOcrConfig || ocrLoading[document.id] || isParsing}
                        onClick={() => onTriggerOcr(document)}
                      >
                        {ocrLoading[document.id] ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ScanText className="mr-1 h-3.5 w-3.5" />
                        )}
                        {ocrLoading[document.id] ? 'OCR 解析中…' : 'OCR 重新解析'}
                      </Button>

                      {document.ocr_markdown && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadMarkdown(document)}
                        >
                          <FileDown className="mr-1 h-3.5 w-3.5" />
                          下载 MD
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </StagePanel>

      <StagePanel
        title="就绪摘要"
        description="把进入范围阶段真正需要的信号统一收口，避免在上传区和文档列表之间来回判断。"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">已完成解析</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{completedCount}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">处理中</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{parsingCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-600">
          {readyForScope
            ? '当前已有至少一份可用文档，可以继续进入范围确认阶段。'
            : '当前还没有可用章节结构，请先完成文档上传与解析。'}
        </div>
      </StagePanel>
    </div>
  );
}
