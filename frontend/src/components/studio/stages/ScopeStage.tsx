import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ChevronLeft, ChevronRight, Eye, FileText, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  StudioDocumentSection,
  StudioScopeMode,
  StudioScopePresetId,
} from '@/studio/types';

interface ScopeStageProps {
  mode: StudioScopeMode;
  selectedPresetId: StudioScopePresetId;
  documentName?: string;
  sections: StudioDocumentSection[];
  selectedSectionIndices: number[];
  canConfirm: boolean;
  isConfirmed: boolean;
  onModeChange: (mode: StudioScopeMode) => void;
  onPresetSelect: (presetId: StudioScopePresetId) => void;
  onSelectedSectionIndicesChange: (indices: number[]) => void;
  onConfirm: () => void;
}

interface SectionNode {
  idx: number;
  title: string;
  level: number;
  preview: string;
  children: SectionNode[];
}

const SCOPE_PRESET_OPTIONS: Array<{
  id: StudioScopePresetId;
  label: string;
  description: string;
}> = [
  {
    id: 'full-paper',
    label: '整篇论文',
    description: '适合第一次生成，覆盖论文的完整方法、实验与结果。',
  },
  {
    id: 'methods-models',
    label: '方法与模型',
    description: '聚焦方法、架构、模块设计，适合做框架图和结构图。',
  },
  {
    id: 'experiments-results',
    label: '实验与结果',
    description: '聚焦实验设置、对比结果与分析，适合做结果图和对比图。',
  },
  {
    id: 'recommended',
    label: '智能推荐章节',
    description: '优先挑选更可能用于配图的章节，减少手工筛选成本。',
  },
  {
    id: 'custom',
    label: '自定义范围',
    description: '进入高级章节树，自行控制要参考的章节和预览内容。',
  },
];

function inferLevelFromTitle(rawTitle: string): number | null {
  const title = rawTitle.trim();
  if (!title) {
    return null;
  }

  if (/^第\s*[0-9一二三四五六七八九十百千]+\s*章\b/u.test(title)) {
    return 1;
  }

  if (/^chapter\s+\d+\b/i.test(title)) {
    return 1;
  }

  const dotted = title.match(/^(\d+(?:\.\d+)+)\b/);
  if (dotted) {
    return dotted[1].split('.').length;
  }

  if (/^\d+\b/.test(title)) {
    return 1;
  }

  return null;
}

function getSectionPreview(section: StudioDocumentSection): string {
  return (section.content ?? section.text ?? '').trim();
}

function buildSectionTree(sections: StudioDocumentSection[]): SectionNode[] {
  const normalized = sections.map((section, index) => {
    const title = (section.title ?? `Section ${index + 1}`).trim();
    const rawLevel = Number(section.level) || 1;
    const inferredLevel = inferLevelFromTitle(title);

    return {
      idx: index,
      title,
      rawLevel,
      inferredLevel,
      preview: getSectionPreview(section),
    };
  });

  const rawLevels = normalized.map((section) => section.rawLevel);
  const rawVaries = new Set(rawLevels).size > 1;
  const inferredLevels = normalized
    .map((section) => section.inferredLevel)
    .filter((value): value is number => typeof value === 'number');
  const inferredVaries = new Set(inferredLevels).size > 1;
  const useInferred = !rawVaries && inferredVaries;

  const nodes = normalized.map<SectionNode>((section) => ({
    idx: section.idx,
    title: section.title,
    level: useInferred ? section.inferredLevel ?? section.rawLevel : section.rawLevel,
    preview: section.preview,
    children: [],
  }));

  const roots: SectionNode[] = [];
  const stack: SectionNode[] = [];

  for (const node of nodes) {
    node.level = Math.max(1, Math.floor(node.level || 1));

    while (stack.length > 0 && node.level <= stack[stack.length - 1].level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function collectIndices(node: SectionNode): number[] {
  const indices = [node.idx];
  const stack = [...node.children];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    indices.push(current.idx);
    stack.push(...current.children);
  }

  return indices;
}

export function ScopeStage({
  mode,
  selectedPresetId,
  documentName,
  sections,
  selectedSectionIndices,
  canConfirm,
  isConfirmed,
  onModeChange,
  onPresetSelect,
  onSelectedSectionIndicesChange,
  onConfirm,
}: ScopeStageProps) {
  const [collapsedGroupOverrides, setCollapsedGroupOverrides] = useState<Record<string, boolean>>({});
  const [activePreviewIdx, setActivePreviewIdx] = useState<number | null>(null);

  const roots = useMemo(() => buildSectionTree(sections), [sections]);
  const defaultCollapsedGroups = useMemo(() => {
    const nextCollapsed: Record<string, boolean> = {};

    for (const root of roots) {
      nextCollapsed[`sec-${root.idx}`] = true;
    }

    return nextCollapsed;
  }, [roots]);
  const collapsedGroups = useMemo(
    () => ({ ...defaultCollapsedGroups, ...collapsedGroupOverrides }),
    [collapsedGroupOverrides, defaultCollapsedGroups],
  );
  const selectedSet = useMemo(() => new Set(selectedSectionIndices), [selectedSectionIndices]);
  const activeSection = activePreviewIdx !== null ? sections[activePreviewIdx] : null;
  const selectedCharCount = useMemo(
    () =>
      selectedSectionIndices.reduce((total, index) => total + getSectionPreview(sections[index] ?? {}).length, 0),
    [sections, selectedSectionIndices],
  );

  const selectedPreset = SCOPE_PRESET_OPTIONS.find((option) => option.id === selectedPresetId);
  const confirmButtonLabel = isConfirmed ? '继续前往生成草案' : '确认范围并继续';

  const selectMany = (indices: number[], checked: boolean) => {
    const next = new Set(selectedSectionIndices);

    for (const index of indices) {
      if (checked) {
        next.add(index);
      } else {
        next.delete(index);
      }
    }

    onSelectedSectionIndicesChange(Array.from(next).sort((left, right) => left - right));
  };

  const handlePresetClick = (presetId: StudioScopePresetId) => {
    onModeChange(presetId === 'custom' ? 'custom' : 'preset');
    onPresetSelect(presetId);
  };

  const renderNodes = (nodes: SectionNode[], depth: number): ReactElement[] =>
    nodes.map((node) => {
      const key = `node-${node.idx}`;
      const isChecked = selectedSet.has(node.idx);
      const isActive = activePreviewIdx === node.idx;
      const indentPx = depth * 16;

      return (
        <div key={key}>
          <div
            className={`group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors ${
              isActive ? 'border border-primary/30 bg-primary/10' : 'hover:bg-muted/50'
            }`}
            style={{ marginLeft: `${indentPx}px` }}
          >
            <input
              type="checkbox"
              className="shrink-0 accent-primary"
              checked={isChecked}
              onChange={(event) => {
                event.stopPropagation();
                selectMany([node.idx], event.target.checked);
              }}
              onClick={(event) => event.stopPropagation()}
            />
            <button
              type="button"
              className={`min-w-0 flex-1 truncate text-left text-sm ${
                isActive ? 'font-medium text-primary' : depth === 0 ? 'font-medium' : 'text-muted-foreground'
              }`}
              title={node.title}
              onClick={() => setActivePreviewIdx(isActive ? null : node.idx)}
            >
              {node.title}
            </button>
            <Eye
              className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                isActive ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-50'
              }`}
            />
          </div>

          {node.children.length > 0 && <div className="mt-0.5 space-y-0.5">{renderNodes(node.children, depth + 1)}</div>}
        </div>
      );
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">确认范围</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            先决定本次生成草案要参考论文的哪一部分，只有在需要精细控制时再展开章节树。
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{documentName ?? '暂无可用文档'}</Badge>
            <span>章节总数 {sections.length}</span>
            <span>已选章节 {selectedSectionIndices.length}</span>
            <span>预估参考长度 ≈ {(selectedCharCount / 500).toFixed(0)} 段落</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SCOPE_PRESET_OPTIONS.map((option) => {
              const isActive = selectedPresetId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  }`}
                  onClick={() => handlePresetClick(option.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{option.label}</span>
                    {isActive && <Badge variant="secondary">当前选择</Badge>}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {mode === 'preset' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              当前范围方案
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="font-medium">{selectedPreset?.label ?? '整篇论文'}</p>
              <p className="mt-1 text-muted-foreground">
                {selectedPreset?.description ?? '使用整篇论文作为默认参考范围。'}
              </p>
            </div>
            <div className="rounded-lg border border-dashed p-3 text-muted-foreground">
              当前先采用预设范围，等进入草案阶段后再逐步拆出更细的来源解释与推荐理由。
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">自定义范围</CardTitle>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无可用章节结构，请先返回上一步完成论文解析。</p>
            ) : (
              <div className="flex min-h-[420px] flex-col gap-0">
                <div className="flex items-center justify-between gap-2 border-b px-1 pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectedSectionIndicesChange(sections.map((_, index) => index))}
                    >
                      全选
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectedSectionIndicesChange([])}
                    >
                      全不选
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextCollapsed: Record<string, boolean> = {};
                        for (const root of roots) {
                          nextCollapsed[`sec-${root.idx}`] = false;
                        }
                        setCollapsedGroupOverrides(nextCollapsed);
                      }}
                    >
                      展开全部
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextCollapsed: Record<string, boolean> = {};
                        for (const root of roots) {
                          nextCollapsed[`sec-${root.idx}`] = true;
                        }
                        setCollapsedGroupOverrides(nextCollapsed);
                      }}
                    >
                      折叠全部
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b px-1 py-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    章节树
                  </span>
                  <span className="ml-auto font-medium text-foreground">
                    {selectedSectionIndices.length}/{sections.length} 段已选
                  </span>
                  {selectedCharCount > 0 && <span>≈ {(selectedCharCount / 500).toFixed(0)} 段落</span>}
                </div>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                  <div className="w-[55%] space-y-0.5 overflow-y-auto border-r py-2 pr-1">
                    {roots.map((chapter) => {
                      const indices = collectIndices(chapter);
                      const selectedCount = indices.reduce(
                        (count, index) => count + (selectedSet.has(index) ? 1 : 0),
                        0,
                      );
                      const allChecked = selectedCount === indices.length && indices.length > 0;
                      const partiallyChecked = selectedCount > 0 && selectedCount < indices.length;
                      const groupKey = `sec-${chapter.idx}`;
                      const isCollapsed = collapsedGroups[groupKey] ?? true;
                      const isActive = activePreviewIdx === chapter.idx;

                      return (
                        <div key={groupKey}>
                          <div
                            className={`flex items-center gap-2 rounded px-2 py-2 transition-colors ${
                              isActive ? 'border border-primary/30 bg-primary/10' : 'hover:bg-muted/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="shrink-0 accent-primary"
                              checked={allChecked}
                              ref={(element) => {
                                if (element) {
                                  element.indeterminate = partiallyChecked;
                                }
                              }}
                              onChange={(event) => selectMany(indices, event.target.checked)}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <button
                              type="button"
                              className={`min-w-0 flex-1 truncate text-left text-sm font-semibold ${
                                isActive ? 'text-primary' : ''
                              }`}
                              title={chapter.title}
                              onClick={() => setActivePreviewIdx(isActive ? null : chapter.idx)}
                            >
                              {chapter.title}
                            </button>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {selectedCount}/{indices.length}
                            </span>
                            <button
                              type="button"
                              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() =>
                                setCollapsedGroupOverrides((previous) => ({
                                  ...previous,
                                  [groupKey]: !isCollapsed,
                                }))
                              }
                            >
                              {isCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronLeft className="h-3.5 w-3.5 rotate-90" />
                              )}
                            </button>
                          </div>

                          {!isCollapsed && chapter.children.length > 0 && (
                            <div className="mt-0.5 space-y-0.5">{renderNodes(chapter.children, 1)}</div>
                          )}

                          {!isCollapsed && chapter.children.length === 0 && (
                            <div className="ml-7 py-1 text-xs text-muted-foreground">无子章节</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-[45%] overflow-y-auto py-2 pl-3">
                    {activeSection ? (
                      <div>
                        <div className="mb-3 flex items-start gap-2">
                          <div>
                            <h4 className="text-sm font-semibold leading-tight">
                              {activeSection.title ?? `Section ${activePreviewIdx !== null ? activePreviewIdx + 1 : 1}`}
                            </h4>
                            {activeSection.page_start != null && (
                              <span className="text-xs text-muted-foreground">
                                第 {activeSection.page_start + 1} 页
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/80">
                          {getSectionPreview(activeSection).slice(0, 2000) || '（无内容预览）'}
                          {getSectionPreview(activeSection).length > 2000 && (
                            <span className="italic text-muted-foreground">…（内容较长，已截断）</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                        <Eye className="h-8 w-8 opacity-30" />
                        <p className="text-xs">
                          点击左侧章节标题
                          <br />
                          在此预览内容
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm">
            <p className="font-medium">{isConfirmed ? '当前范围已确认' : '确认后将进入草案阶段'}</p>
            <p className="text-muted-foreground">
              {!canConfirm
                ? '自定义范围至少需要选择 1 个章节后才能继续。'
                : isConfirmed
                  ? '当前范围保持不变时，可直接继续前往生成草案。'
                  : '系统会保留本次范围选择，下一步进入草案生成。'}
            </p>
          </div>

          <Button type="button" onClick={onConfirm} disabled={!canConfirm}>
            {confirmButtonLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
