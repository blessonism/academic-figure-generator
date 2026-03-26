import { describe, expect, it } from 'vitest';

import { getFirstAccessibleStage, getNextRecommendedStage } from '@/studio/selectors';

describe('studio stage selectors', () => {
  it('returns ingest when project has no parsed document', () => {
    expect(getFirstAccessibleStage({ hasParsedDocument: false })).toBe('ingest');
  });

  it('recommends prompt after scope is confirmed', () => {
    expect(
      getNextRecommendedStage({
        hasParsedDocument: true,
        hasConfirmedScope: true,
        hasAcceptedDraft: false,
        hasRenderedAsset: false,
      }),
    ).toBe('prompt');
  });
});
