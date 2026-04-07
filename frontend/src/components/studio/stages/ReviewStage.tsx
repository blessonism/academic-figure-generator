import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Flag,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type {
  StudioReviewAsset,
  StudioReviewVersion,
  StudioStatusMessage,
} from '@/studio/types';

interface ReviewStageProps {
  assets: StudioReviewAsset[];
  statusMessage: StudioStatusMessage | null;
  onEditAsset: (imageId: string, instruction: string) => Promise<void> | void;
  onMarkVersionFinal: (promptId: string, imageId: string) => void;
  onPreviewAsset: (imageId: string) => void;
  onDownloadAsset: (imageId: string) => void;
}

function getVersionStatusLabel(status: StudioReviewVersion['status']) {
  if (status === 'completed') {
    return '已完成';
  }

  if (status === 'failed') {
    return '失败';
  }

  if (status === 'processing') {
    return '处理中';
  }

  return '待处理';
}

function getVersionStatusVariant(status: StudioReviewVersion['status']) {
  if (status === 'completed') {
    return 'secondary' as const;
  }

  if (status === 'failed') {
    return 'destructive' as const;
  }

  return 'outline' as const;
}

function formatVersionTime(value: string | null) {
  if (!value) {
    return '时间未知';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getPreferredVersionId(asset: StudioReviewAsset): string | null {
  if (asset.finalVersionId && asset.versions.some((version) => version.imageId === asset.finalVersionId)) {
    return asset.finalVersionId;
  }

  return asset.versions.find((version) => version.status === 'completed')?.imageId ?? asset.versions[0]?.imageId ?? null;
}

export function ReviewStage({
  assets,
  statusMessage,
  onEditAsset,
  onMarkVersionFinal,
  onPreviewAsset,
  onDownloadAsset,
}: ReviewStageProps) {
  const [manualSelectedAssetId, setManualSelectedAssetId] = useState<string | null>(null);
  const [manualSelectedVersionIds, setManualSelectedVersionIds] = useState<Record<string, string>>({});
  const [editInputs, setEditInputs] = useState<Record<string, string>>({});
  const autoPreviewRequestedRef = useRef<Set<string>>(new Set());

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === manualSelectedAssetId) ?? assets[0] ?? null,
    [assets, manualSelectedAssetId],
  );

  const latestVersion = selectedAsset?.versions[0] ?? null;
  const selectedVersionId =
    selectedAsset &&
    manualSelectedVersionIds[selectedAsset.id] &&
    selectedAsset.versions.some((version) => version.imageId === manualSelectedVersionIds[selectedAsset.id])
      ? manualSelectedVersionIds[selectedAsset.id]
      : selectedAsset
        ? getPreferredVersionId(selectedAsset)
        : null;
  const selectedVersion =
    selectedAsset?.versions.find((version) => version.imageId === selectedVersionId) ?? latestVersion ?? null;
  const editValue = selectedAsset ? editInputs[selectedAsset.id] ?? '' : '';
  const isViewingHistoricalVersion = Boolean(
    selectedAsset &&
      latestVersion &&
      selectedVersion &&
      latestVersion.imageId !== selectedVersion.imageId,
  );

  useEffect(() => {
    if (selectedVersion.status !== 'completed') {
      return;
    }

    if (selectedVersion.previewUrl || selectedVersion.isPreviewLoading) {
      return;
    }

    if (autoPreviewRequestedRef.current.has(selectedVersion.imageId)) {
      return;
    }

    autoPreviewRequestedRef.current.add(selectedVersion.imageId);
    onPreviewAsset(selectedVersion.imageId);
  }, [
    onPreviewAsset,
    selectedVersion.imageId,
    selectedVersion.isPreviewLoading,
    selectedVersion.previewUrl,
    selectedVersion.status,
  ]);

  const handleSubmitEdit = async () => {
    if (!selectedAsset || !selectedVersion) {
      return;
    }

    const nextInstruction = editValue.trim();
    if (!nextInstruction) {
      return;
    }

    await Promise.resolve(onEditAsset(selectedVersion.imageId, nextInstruction));
    setEditInputs((previous) => ({
      ...previous,
      [selectedAsset.id]: '',
    }));
  };

  if (assets.length === 0 || !selectedAsset || !selectedVersion) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">精修交付</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            还没有可精修的图片结果，请先在生成配图阶段完成至少一张图片。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">状态更新</p>
          <p className="mt-1 text-muted-foreground">{statusMessage.detail}</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="min-h-[540px] xl:col-span-2 2xl:col-span-1">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold text-slate-950">结果清单</h2>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ScrollArea className="h-[460px]">
              <div className="space-y-2 px-4 pb-4">
                {assets.map((asset) => {
                  const assetLatestVersion = asset.versions[0];
                  const isActive = asset.id === selectedAsset.id;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                      }`}
                      onClick={() => setManualSelectedAssetId(asset.id)}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="line-clamp-2 break-words text-sm font-medium leading-5">{asset.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {assetLatestVersion ? `${asset.versions.length} 个版本` : '暂无版本'}
                          </p>
                        </div>
                        <Badge
                          variant={getVersionStatusVariant(assetLatestVersion?.status ?? 'idle')}
                          className="shrink-0 self-start"
                        >
                          {getVersionStatusLabel(assetLatestVersion?.status ?? 'idle')}
                        </Badge>
                      </div>
                      {asset.finalVersionId && (
                        <p className="mt-2 text-xs text-emerald-600">已标记最终稿</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="min-h-[540px] min-w-0">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-950">当前版本详情</h2>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="line-clamp-2 break-words text-base leading-6">{selectedAsset.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedAsset.figureType}</p>
                </div>
                <Badge variant={getVersionStatusVariant(selectedVersion.status)} className="shrink-0 self-start sm:self-auto">
                  {getVersionStatusLabel(selectedVersion.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-2xl border bg-muted/20">
              <div className="aspect-[16/10] bg-muted/40">
                {selectedVersion.status === 'completed' && selectedVersion.previewUrl ? (
                  <img
                    src={selectedVersion.previewUrl}
                    alt={`${selectedAsset.title} 预览`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {selectedVersion.status === 'processing' ? (
                      <div className="flex max-w-sm flex-col items-center gap-3 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>当前版本生成中，请稍候刷新。</p>
                        {selectedVersion.generationError && (
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">系统正在自动重试</p>
                            <p>{selectedVersion.generationError}</p>
                          </div>
                        )}
                      </div>
                    ) : selectedVersion.status === 'failed' ? (
                      <div className="max-w-sm space-y-2 text-center text-sm">
                        <p className="font-medium text-destructive">当前版本生成失败</p>
                        <p className="text-muted-foreground">
                          {selectedVersion.generationError || '请回到上一版本继续精修，或重新发起一次修改。'}
                        </p>
                      </div>
                    ) : selectedVersion.status === 'completed' ? (
                      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                        {selectedVersion.isPreviewLoading ? (
                          <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>正在自动加载当前版本预览...</p>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8" />
                            <p>正在准备当前版本预览...</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <p>当前版本暂不可预览。</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{selectedVersion.label}</p>
                  <p className="text-xs text-muted-foreground">{formatVersionTime(selectedVersion.createdAt)}</p>
                </div>
                {selectedAsset.finalVersionId === selectedVersion.imageId && (
                  <Badge variant="secondary">最终稿</Badge>
                )}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">分辨率</p>
                  <p className="text-sm font-medium">{selectedVersion.resolution}</p>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">比例</p>
                  <p className="text-sm font-medium">{selectedVersion.aspectRatio}</p>
                </div>
                <div className="rounded-lg border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">配色</p>
                  <p className="text-sm font-medium">{selectedVersion.colorScheme || '未指定'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[540px] min-w-0">
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold text-slate-950">精修动作</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">当前版本说明</p>
                    <p className="text-muted-foreground">
                      当前选中 {selectedVersion.label}，后续精修会基于这个版本继续生成。
                    </p>
                    {isViewingHistoricalVersion && (
                      <Button
                        variant="link"
                        className="h-auto px-0 text-xs"
                        onClick={() =>
                          setManualSelectedVersionIds((previous) => ({
                            ...previous,
                            [selectedAsset.id]: latestVersion?.imageId ?? selectedVersion.imageId,
                          }))
                        }
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        回到最新版本
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">精修说明</p>
                <Textarea
                  value={editValue}
                  onChange={(event) =>
                    setEditInputs((previous) => ({
                      ...previous,
                      [selectedAsset.id]: event.target.value,
                    }))
                  }
                  placeholder="描述你想调整的内容，例如：加粗主路径并弱化背景模块。"
                  className="min-h-[120px]"
                />
                <Button
                  className="w-full"
                  onClick={() => {
                    void handleSubmitEdit();
                  }}
                  disabled={
                    !editValue.trim() ||
                    selectedVersion.status !== 'completed' ||
                    Boolean(selectedVersion.isEditing)
                  }
                >
                  {selectedVersion.isEditing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中
                    </>
                  ) : (
                    '提交精修'
                  )}
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => onMarkVersionFinal(selectedAsset.promptId, selectedVersion.imageId)}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  标记为最终稿
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDownloadAsset(selectedVersion.imageId)}
                  disabled={selectedVersion.isDownloading}
                >
                  {selectedVersion.isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      下载中
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <h3 className="text-base font-semibold text-slate-950">交付摘要</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">当前选中版本</p>
                    <p className="text-sm font-medium">{selectedVersion.label}</p>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-2">
                    <p className="text-xs text-muted-foreground">最终稿状态</p>
                    <p className="text-sm font-medium">
                      {selectedAsset.finalVersionId === selectedVersion.imageId ? '已标记' : '未标记'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">版本历史</p>
              <div className="space-y-2">
                {selectedAsset.versions.map((version) => {
                  const isActive = version.imageId === selectedVersion.imageId;
                  return (
                    <button
                      key={version.imageId}
                      type="button"
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                      }`}
                      onClick={() =>
                        setManualSelectedVersionIds((previous) => ({
                          ...previous,
                          [selectedAsset.id]: version.imageId,
                        }))
                      }
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start gap-2">
                            <p className="line-clamp-2 break-words text-sm font-medium leading-5">{version.label}</p>
                            {selectedAsset.finalVersionId === version.imageId && (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatVersionTime(version.createdAt)}</p>
                        </div>
                        <Badge variant={getVersionStatusVariant(version.status)} className="shrink-0 self-start">
                          {getVersionStatusLabel(version.status)}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
