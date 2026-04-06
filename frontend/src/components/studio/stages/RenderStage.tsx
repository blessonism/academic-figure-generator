import { useMemo, useState } from 'react';
import { Download, Eye, Image as ImageIcon, Loader2, RefreshCw, Settings2, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  StudioColorSchemeOption,
  StudioImagePricing,
  StudioRenderAsset,
  StudioRenderAssetStatus,
  StudioRenderParameters,
  StudioStatusMessage,
} from '@/studio/types';

type RenderFilter = 'all' | 'processing' | 'completed' | 'failed';

interface RenderStageProps {
  projectDefaults: StudioRenderParameters;
  sessionDefaults: StudioRenderParameters;
  colorSchemeOptions: StudioColorSchemeOption[];
  imagePricing: StudioImagePricing | null;
  assets: StudioRenderAsset[];
  statusMessage: StudioStatusMessage | null;
  onSessionDefaultsChange: (field: keyof StudioRenderParameters, value: string) => void;
  onAssetOverrideChange: (
    promptId: string,
    field: keyof StudioRenderParameters,
    value: string,
  ) => void;
  onResetAssetOverrides: (promptId: string) => void;
  onGenerateAsset: (promptId: string) => void;
  onPreviewAsset: (imageId: string) => void;
  onDownloadAsset: (imageId: string) => void;
}

const RESOLUTION_OPTIONS = ['1K', '2K', '4K'] as const;
const ASPECT_RATIO_OPTIONS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'] as const;

function getRenderStatusLabel(status: StudioRenderAssetStatus) {
  if (status === 'processing') {
    return '处理中';
  }

  if (status === 'completed') {
    return '已完成';
  }

  if (status === 'failed') {
    return '失败';
  }

  return '待生成';
}

function getRenderStatusVariant(status: StudioRenderAssetStatus) {
  if (status === 'completed') {
    return 'secondary' as const;
  }

  if (status === 'failed') {
    return 'destructive' as const;
  }

  return 'outline' as const;
}

function getFilterLabel(filter: RenderFilter) {
  if (filter === 'processing') {
    return '处理中';
  }

  if (filter === 'completed') {
    return '已完成';
  }

  if (filter === 'failed') {
    return '失败';
  }

  return '全部';
}

function getResolutionPriceText(
  resolution: string,
  imagePricing: StudioImagePricing | null,
) {
  if (!imagePricing) {
    return null;
  }

  const normalized = resolution.trim().toUpperCase();

  if (normalized === '1K') {
    return imagePricing.priceCny1K;
  }

  if (normalized === '4K') {
    return imagePricing.priceCny4K;
  }

  if (normalized === '2K') {
    return imagePricing.priceCny2K;
  }

  return imagePricing.priceCnyDefault;
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

function RenderParameterSummary({
  title,
  description,
  parameters,
  imagePricing,
}: {
  title: string;
  description: string;
  parameters: StudioRenderParameters;
  imagePricing: StudioImagePricing | null;
}) {
  const price = getResolutionPriceText(parameters.resolution, imagePricing);

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">分辨率</p>
          <p className="text-sm font-medium">{parameters.resolution}</p>
        </div>
        <div className="rounded-lg border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">比例</p>
          <p className="text-sm font-medium">{parameters.aspectRatio}</p>
        </div>
        <div className="rounded-lg border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">配色</p>
          <p className="text-sm font-medium">{parameters.colorScheme}</p>
          {price !== null && <p className="text-xs text-muted-foreground">约 ¥{price.toFixed(2)}/张</p>}
        </div>
      </div>
    </div>
  );
}

export function RenderStage({
  projectDefaults,
  sessionDefaults,
  colorSchemeOptions,
  imagePricing,
  assets,
  statusMessage,
  onSessionDefaultsChange,
  onAssetOverrideChange,
  onResetAssetOverrides,
  onGenerateAsset,
  onPreviewAsset,
  onDownloadAsset,
}: RenderStageProps) {
  const [filter, setFilter] = useState<RenderFilter>('all');

  const filterCounts = useMemo(() => {
    return assets.reduce<Record<RenderFilter, number>>(
      (counts, asset) => {
        counts.all += 1;

        if (asset.status === 'processing') {
          counts.processing += 1;
        }

        if (asset.status === 'completed') {
          counts.completed += 1;
        }

        if (asset.status === 'failed') {
          counts.failed += 1;
        }

        return counts;
      },
      {
        all: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
    );
  }, [assets]);

  const visibleAssets = useMemo(() => {
    if (filter === 'all') {
      return assets;
    }

    return assets.filter((asset) => asset.status === filter);
  }, [assets, filter]);

  const availableColorSchemeOptions =
    colorSchemeOptions.length > 0
      ? colorSchemeOptions
      : [{ value: sessionDefaults.colorScheme, label: sessionDefaults.colorScheme }];
  const estimatedDefaultPrice = getResolutionPriceText(sessionDefaults.resolution, imagePricing);

  return (
    <div className="space-y-4">
      <div className="grid gap-5 xl:grid-cols-2">
        <StagePanel
          title="输出规格"
          description="先统一本轮输出规格，再决定是否为单张资产追加覆盖值。"
        >
          <RenderParameterSummary
            title="项目默认参数"
            description="当前项目和账号设置推导出的基础默认值。"
            parameters={projectDefaults}
            imagePricing={imagePricing}
          />

          <div className="rounded-xl border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">本次默认参数</p>
              <p className="text-xs text-muted-foreground">
                只影响当前会话。未设置单项覆盖的结果卡片都会继承这里。
              </p>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">分辨率</p>
                <Select
                  value={sessionDefaults.resolution}
                  onValueChange={(value) => onSessionDefaultsChange('resolution', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_OPTIONS.map((resolution) => (
                      <SelectItem key={resolution} value={resolution}>
                        {resolution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">比例</p>
                <Select
                  value={sessionDefaults.aspectRatio}
                  onValueChange={(value) => onSessionDefaultsChange('aspectRatio', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIO_OPTIONS.map((aspectRatio) => (
                      <SelectItem key={aspectRatio} value={aspectRatio}>
                        {aspectRatio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">配色</p>
                <Select
                  value={sessionDefaults.colorScheme}
                  onValueChange={(value) => onSessionDefaultsChange('colorScheme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColorSchemeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {estimatedDefaultPrice !== null && (
              <p className="mt-3 text-xs text-muted-foreground">
                当前会话默认价格约为 ¥{estimatedDefaultPrice.toFixed(2)}/张。
              </p>
            )}
          </div>
        </StagePanel>

        <StagePanel
          title="成本预估"
          description="规格变化会直接影响成本和处理规模，先确认预算边界再进入提交。"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">当前筛选结果</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{visibleAssets.length} 张</p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">默认单价</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {estimatedDefaultPrice !== null ? `¥${estimatedDefaultPrice.toFixed(2)}` : '待配置'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-600">
            {estimatedDefaultPrice !== null
              ? `按当前默认规格估算，本轮批量出图的基础成本约为 ¥${(
                  estimatedDefaultPrice * Math.max(assets.length, 1)
                ).toFixed(2)}。`
              : '当前价格信息不可用，请先确认服务端价格配置。'}
          </div>
        </StagePanel>

        <StagePanel
          title="资产队列"
          description="先查看这一轮真正待处理的资产规模，再按状态筛选结果列表。"
        >
          <div className="flex flex-wrap gap-2">
            {(['all', 'processing', 'completed', 'failed'] as RenderFilter[]).map((candidate) => (
              <Button
                key={candidate}
                type="button"
                size="sm"
                variant={filter === candidate ? 'default' : 'outline'}
                onClick={() => setFilter(candidate)}
              >
                {getFilterLabel(candidate)}
                <span aria-hidden="true" className="ml-1 text-xs opacity-80">
                  {filterCounts[candidate]}
                </span>
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {assets.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                当前还没有待出图资产，请先在草案阶段接受至少一条草案。
              </div>
            ) : (
              visibleAssets.map((asset) => (
                <div key={`queue-${asset.id}`} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {asset.effectiveSettings.resolution} · {asset.effectiveSettings.aspectRatio} ·{' '}
                        {asset.effectiveSettings.colorScheme}
                      </p>
                    </div>
                    <Badge variant={getRenderStatusVariant(asset.status)}>
                      {getRenderStatusLabel(asset.status)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </StagePanel>

        <StagePanel
          title="提交动作"
          description="把本轮默认参数、预算和队列状态统一收口，再继续到每张资产的生成动作。"
        >
          {statusMessage ? (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">状态更新</p>
              <p className="mt-1 text-muted-foreground">{statusMessage.detail}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-600">
            当前阶段建议先检查资产队列与成本预估，再到下方结果列表逐条发起生成或重试。
          </div>
        </StagePanel>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">结果列表</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              请先在草案阶段接受至少一条草案，再到这里开始正式出图。
            </div>
          ) : visibleAssets.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              当前筛选条件下还没有结果，请切换过滤器或先发起新的渲染任务。
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAssets.map((asset) => {
                const effectivePrice = getResolutionPriceText(asset.effectiveSettings.resolution, imagePricing);

                return (
                  <Card key={asset.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted/40">
                      {asset.previewUrl ? (
                        <img
                          src={asset.previewUrl}
                          alt={asset.title}
                          className="h-full w-full object-cover"
                        />
                      ) : asset.status === 'processing' ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="max-w-sm text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm font-medium">生成中…</p>
                            {asset.generationError && (
                              <>
                                <p className="mt-3 text-sm font-medium text-foreground">
                                  系统正在自动重试
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {asset.generationError}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      ) : asset.status === 'failed' ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="max-w-sm text-center text-sm text-muted-foreground">
                            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 font-medium text-foreground">本次生成失败</p>
                            <p className="mt-1">{asset.generationError || '请调整参数后重试。'}</p>
                          </div>
                        </div>
                      ) : asset.status === 'completed' ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">图片已生成，可点击预览加载。</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">尚未开始生成</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base">{asset.title}</CardTitle>
                            <Badge variant={getRenderStatusVariant(asset.status)}>
                              {getRenderStatusLabel(asset.status)}
                            </Badge>
                            <Badge variant="outline">{asset.figureType}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>分辨率 {asset.effectiveSettings.resolution}</span>
                            <span>比例 {asset.effectiveSettings.aspectRatio}</span>
                            <span>配色 {asset.effectiveSettings.colorScheme}</span>
                            {effectivePrice !== null && <span>约 ¥{effectivePrice.toFixed(2)}/张</span>}
                          </div>
                          {asset.suggestedAspectRatio && (
                            <p className="text-xs text-muted-foreground">
                              草案建议比例：{asset.suggestedAspectRatio}
                            </p>
                          )}
                        </div>

                        {Object.keys(asset.overrideSettings).length > 0 && (
                          <Badge variant="secondary">已设置单项覆盖</Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pb-3">
                      <details className="rounded-lg border">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium">
                          <span className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4" />
                            单项覆盖
                          </span>
                          <span className="text-xs text-muted-foreground">
                            仅在这张图上覆盖会话默认值
                          </span>
                        </summary>

                        <div className="grid gap-3 border-t px-3 py-3 md:grid-cols-3">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">分辨率</p>
                            <Select
                              value={asset.overrideSettings.resolution ?? asset.effectiveSettings.resolution}
                              onValueChange={(value) =>
                                onAssetOverrideChange(asset.promptId, 'resolution', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESOLUTION_OPTIONS.map((resolution) => (
                                  <SelectItem key={resolution} value={resolution}>
                                    {resolution}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">比例</p>
                            <Select
                              value={asset.overrideSettings.aspectRatio ?? asset.effectiveSettings.aspectRatio}
                              onValueChange={(value) =>
                                onAssetOverrideChange(asset.promptId, 'aspectRatio', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ASPECT_RATIO_OPTIONS.map((aspectRatio) => (
                                  <SelectItem key={aspectRatio} value={aspectRatio}>
                                    {aspectRatio}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">配色</p>
                            <Select
                              value={asset.overrideSettings.colorScheme ?? asset.effectiveSettings.colorScheme}
                              onValueChange={(value) =>
                                onAssetOverrideChange(asset.promptId, 'colorScheme', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableColorSchemeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="border-t px-3 py-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onResetAssetOverrides(asset.promptId)}
                          >
                            恢复会话默认值
                          </Button>
                        </div>
                      </details>
                    </CardContent>

                    <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                      <Button type="button" size="sm" onClick={() => onGenerateAsset(asset.promptId)}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        {asset.latestImageId ? '重新生成' : '开始生成'}
                      </Button>

                      {asset.latestImageId && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onPreviewAsset(asset.latestImageId!)}
                            disabled={asset.status !== 'completed' || Boolean(asset.isPreviewLoading)}
                          >
                            {asset.isPreviewLoading ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="mr-1 h-3.5 w-3.5" />
                            )}
                            预览
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onDownloadAsset(asset.latestImageId!)}
                            disabled={asset.status !== 'completed' || Boolean(asset.isDownloading)}
                          >
                            {asset.isDownloading ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="mr-1 h-3.5 w-3.5" />
                            )}
                            下载
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
