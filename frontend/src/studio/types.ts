export type StudioStage = 'ingest' | 'scope' | 'prompt' | 'render' | 'review';
export type StudioScopeMode = 'preset' | 'custom';
export type StudioPromptMode = 'overall' | 'sections';
export type StudioScopePresetId =
  | 'full-paper'
  | 'methods-models'
  | 'experiments-results'
  | 'recommended'
  | 'custom';

export interface StudioStageSnapshot {
  hasParsedDocument: boolean;
  hasConfirmedScope?: boolean;
  hasAcceptedDraft?: boolean;
  hasRenderedAsset?: boolean;
}

export interface StudioConfirmedScope {
  mode: StudioScopeMode;
  presetId: StudioScopePresetId;
  sectionIndices: number[];
  documentId: string | null;
}

export interface StudioConfirmedScopeSummary {
  label: string;
  sectionCount: number;
  documentName: string | null;
}

export interface StudioDocumentSection {
  title?: string;
  content?: string;
  text?: string;
  level?: number;
  page_start?: number | null;
  page_end?: number | null;
}

export interface StudioDocumentItem {
  id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  page_count?: number | null;
  parse_status: 'pending' | 'parsing' | 'completed' | 'failed' | string;
  parse_error?: string | null;
  ocr_markdown?: string | null;
  sections?: StudioDocumentSection[] | null;
  created_at?: string;
}

export type StudioPromptDraftReviewStatus = 'pending' | 'accepted' | 'skipped';

export interface StudioPromptSourceSection {
  index: number;
  title: string;
}

export interface StudioPromptDraft {
  id: string;
  title: string;
  figureNumber?: number | null;
  figureType: string;
  status: StudioPromptDraftReviewStatus;
  promptText: string;
  generationStatus: string;
  suggestedAspectRatio?: string | null;
  sourceSections: StudioPromptSourceSection[];
}

export interface StudioRenderParameters {
  resolution: string;
  aspectRatio: string;
  colorScheme: string;
}

export interface StudioColorSchemeOption {
  value: string;
  label: string;
}

export interface StudioImagePricing {
  priceCnyDefault: number;
  priceCny1K: number;
  priceCny2K: number;
  priceCny4K: number;
}

export type StudioRenderAssetStatus = 'idle' | 'processing' | 'completed' | 'failed';

export interface StudioRenderAsset {
  id: string;
  promptId: string;
  title: string;
  figureType: string;
  status: StudioRenderAssetStatus;
  rawStatus: string;
  promptText: string;
  latestImageId: string | null;
  previewUrl: string | null;
  generationError: string | null;
  effectiveSettings: StudioRenderParameters;
  overrideSettings: Partial<StudioRenderParameters>;
  suggestedAspectRatio?: string | null;
  isPreviewLoading?: boolean;
  isDownloading?: boolean;
}

export interface StudioReviewVersion {
  id: string;
  imageId: string;
  label: string;
  status: StudioRenderAssetStatus;
  createdAt: string | null;
  previewUrl: string | null;
  generationError: string | null;
  editInstruction: string | null;
  resolution: string;
  aspectRatio: string;
  colorScheme: string | null;
  isPreviewLoading?: boolean;
  isDownloading?: boolean;
  isEditing?: boolean;
}

export interface StudioReviewAsset {
  id: string;
  promptId: string;
  title: string;
  figureType: string;
  promptText: string;
  finalVersionId: string | null;
  versions: StudioReviewVersion[];
}

export type StudioStageStatus = 'idle' | 'current' | 'complete' | 'blocked';

export interface StudioStageNavItem {
  id: StudioStage;
  label: string;
  status: StudioStageStatus;
  objective?: string;
  reason?: string;
  nextAction?: string;
}

export type StudioHealthStatus = 'ready' | 'warning';

export interface StudioHealthItem {
  id: string;
  label: string;
  status: StudioHealthStatus;
  description: string;
}

export type StudioTaskStatus = 'running' | 'failed' | 'completed';

export interface StudioTaskItem {
  id: string;
  type: string;
  target: string;
  status: StudioTaskStatus;
  detail: string;
}

export interface StudioStatusMessage {
  status: StudioTaskStatus;
  detail: string;
}
