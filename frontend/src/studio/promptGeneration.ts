import type { StudioPromptFigureType, StudioPromptMode } from '@/studio/types';

export interface StudioPromptFigureTypeOption {
  value: StudioPromptFigureType;
  label: string;
}

export const STUDIO_PROMPT_FIGURE_TYPE_OPTIONS: StudioPromptFigureTypeOption[] = [
  { value: 'overall_framework', label: '整体架构图' },
  { value: 'network_architecture', label: '网络架构图' },
  { value: 'module_detail', label: '模块细节图' },
  { value: 'comparison_ablation', label: '对比 / 消融图' },
  { value: 'data_behavior', label: '数据行为图' },
];

const STUDIO_PROMPT_FIGURE_TYPE_ORDER = STUDIO_PROMPT_FIGURE_TYPE_OPTIONS.map(
  (option) => option.value,
);

export function getOverallPromptFigureTypes(
  overallPromptFigureType: StudioPromptFigureType,
): string[] {
  return [overallPromptFigureType];
}

export function getSectionPromptFigureTypes(
  sectionPromptFigureTypes: StudioPromptFigureType[],
): string[] | null {
  if (sectionPromptFigureTypes.length === 0) {
    return null;
  }

  const selected = new Set(sectionPromptFigureTypes);
  return STUDIO_PROMPT_FIGURE_TYPE_ORDER.filter((value) => selected.has(value));
}

export function resolvePromptGenerationPayload(input: {
  promptMode: StudioPromptMode;
  overallPromptFigureType: StudioPromptFigureType;
  sectionPromptFigureTypes: StudioPromptFigureType[];
}): {
  figure_types: string[] | null;
  max_figures: number | null;
} {
  if (input.promptMode === 'overall') {
    return {
      figure_types: getOverallPromptFigureTypes(input.overallPromptFigureType),
      max_figures: 1,
    };
  }

  return {
    figure_types: getSectionPromptFigureTypes(input.sectionPromptFigureTypes),
    max_figures: null,
  };
}

export function getPromptFigureTypeHint(input: {
  promptMode: StudioPromptMode;
  overallPromptFigureType: StudioPromptFigureType;
  sectionPromptFigureTypes: StudioPromptFigureType[];
}): string {
  if (input.promptMode === 'overall') {
    return '本次只生成 1 条草案，并按所选单一图型收敛表达。';
  }

  if (input.sectionPromptFigureTypes.length === 0) {
    return '当前会按章节内容自动判断更合适的图型，不只局限于整体架构图。';
  }

  return '当前将优先围绕已选图型生成章节草案，帮助你更快筛到目标表达。';
}
