import { describe, expect, it } from 'vitest';

import {
  getPromptFigureTypeHint,
  getOverallPromptFigureTypes,
  getSectionPromptFigureTypes,
  resolvePromptGenerationPayload,
  STUDIO_PROMPT_FIGURE_TYPE_OPTIONS,
} from '@/studio/promptGeneration';

describe('promptGeneration', () => {
  it('在整体模式下默认请求整体架构图', () => {
    expect(getOverallPromptFigureTypes('overall_framework')).toEqual(['overall_framework']);
  });

  it('在整体模式下允许显式选择其他图型', () => {
    expect(getOverallPromptFigureTypes('network_architecture')).toEqual(['network_architecture']);
  });

  it('在按章节模式下默认交给后端自动判断', () => {
    expect(getSectionPromptFigureTypes([])).toBeNull();
  });

  it('在按章节模式下支持多选图型并保持稳定顺序', () => {
    expect(
      getSectionPromptFigureTypes(['comparison_ablation', 'network_architecture']),
    ).toEqual(['network_architecture', 'comparison_ablation']);
  });

  it('会根据当前模式生成最终请求参数', () => {
    expect(
      resolvePromptGenerationPayload({
        promptMode: 'overall',
        overallPromptFigureType: 'module_detail',
        sectionPromptFigureTypes: ['network_architecture'],
      }),
    ).toEqual({
      figure_types: ['module_detail'],
      max_figures: 1,
    });

    expect(
      resolvePromptGenerationPayload({
        promptMode: 'sections',
        overallPromptFigureType: 'overall_framework',
        sectionPromptFigureTypes: ['network_architecture', 'comparison_ablation'],
      }),
    ).toEqual({
      figure_types: ['network_architecture', 'comparison_ablation'],
      max_figures: null,
    });
  });

  it('会根据模式和选择状态返回对应提示文案', () => {
    expect(
      getPromptFigureTypeHint({
        promptMode: 'overall',
        overallPromptFigureType: 'data_behavior',
        sectionPromptFigureTypes: [],
      }),
    ).toContain('1 条草案');

    expect(
      getPromptFigureTypeHint({
        promptMode: 'sections',
        overallPromptFigureType: 'overall_framework',
        sectionPromptFigureTypes: [],
      }),
    ).toContain('自动判断');

    expect(
      getPromptFigureTypeHint({
        promptMode: 'sections',
        overallPromptFigureType: 'overall_framework',
        sectionPromptFigureTypes: ['network_architecture'],
      }),
    ).toContain('已选图型');
  });

  it('暴露自动推荐与 5 种图型选项', () => {
    expect(STUDIO_PROMPT_FIGURE_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      'overall_framework',
      'network_architecture',
      'module_detail',
      'comparison_ablation',
      'data_behavior',
    ]);
  });
});
