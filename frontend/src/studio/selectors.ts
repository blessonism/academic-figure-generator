import { STUDIO_STAGE_ORDER } from './constants';
import type {
  StudioDocumentSection,
  StudioScopePresetId,
  StudioStage,
  StudioStageSnapshot,
} from './types';

export function getFirstAccessibleStage(input: Pick<StudioStageSnapshot, 'hasParsedDocument'>): StudioStage {
  return input.hasParsedDocument ? STUDIO_STAGE_ORDER[1] : STUDIO_STAGE_ORDER[0];
}

export function getNextRecommendedStage(input: StudioStageSnapshot): StudioStage {
  if (!input.hasParsedDocument) {
    return 'ingest';
  }

  if (!input.hasConfirmedScope) {
    return 'scope';
  }

  if (!input.hasAcceptedDraft) {
    return 'prompt';
  }

  if (!input.hasRenderedAsset) {
    return 'render';
  }

  return 'review';
}

function matchSectionTitle(
  title: string,
  patterns: readonly RegExp[],
): boolean {
  return patterns.some((pattern) => pattern.test(title));
}

const METHOD_SECTION_PATTERNS = [
  /method/i,
  /approach/i,
  /model/i,
  /architecture/i,
  /framework/i,
  /algorithm/i,
  /pipeline/i,
  /方法/u,
  /模型/u,
  /架构/u,
  /算法/u,
  /框架/u,
] as const;

const EXPERIMENT_SECTION_PATTERNS = [
  /experiment/i,
  /result/i,
  /evaluation/i,
  /analysis/i,
  /ablation/i,
  /benchmark/i,
  /实验/u,
  /结果/u,
  /评估/u,
  /分析/u,
  /消融/u,
] as const;

export function getPresetSectionIndices(input: {
  presetId: Exclude<StudioScopePresetId, 'custom'>;
  sections: StudioDocumentSection[] | null | undefined;
}): number[] {
  const sections = input.sections ?? [];
  const allIndices = sections.map((_, index) => index);

  if (input.presetId === 'full-paper') {
    return allIndices;
  }

  const titles = sections.map((section) => (section.title ?? '').trim());

  const methodIndices = titles
    .map((title, index) =>
      matchSectionTitle(title, METHOD_SECTION_PATTERNS) ? index : null,
    )
    .filter((value): value is number => value !== null);

  const experimentIndices = titles
    .map((title, index) =>
      matchSectionTitle(title, EXPERIMENT_SECTION_PATTERNS) ? index : null,
    )
    .filter((value): value is number => value !== null);

  if (input.presetId === 'methods-models') {
    return methodIndices.length > 0 ? methodIndices : allIndices;
  }

  if (input.presetId === 'experiments-results') {
    return experimentIndices.length > 0 ? experimentIndices : allIndices;
  }

  const recommended = Array.from(new Set([...methodIndices, ...experimentIndices])).sort(
    (left, right) => left - right,
  );

  if (recommended.length > 0) {
    return recommended;
  }

  return allIndices.slice(0, Math.min(allIndices.length, 8));
}
