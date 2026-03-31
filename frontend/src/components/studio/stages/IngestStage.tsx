import { useRef } from 'react';
import type { ChangeEventHandler } from 'react';
import { AlertCircle, CheckCircle2, FileDown, FileUp, Loader2, ScanText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">准备论文</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={onFileChange}
          />

          <div className="rounded-lg border-2 border-dashed p-6 text-center">
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

          {isUploading && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>上传中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">已上传文档</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
