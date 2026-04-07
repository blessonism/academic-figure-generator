export interface MarketCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface MarketTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface MarketItem {
  id: string;
  title: string;
  summary: string | null;
  source_type: 'user_image' | 'curated_upload';
  content_type: 'ai_generated' | 'non_ai_figure';
  paper_url: string | null;
  is_featured: boolean;
  status: 'draft' | 'published' | 'hidden';
  like_count: number;
  favorite_count: number;
  download_count: number;
  cover_download_url: string;
  published_at: string | null;
  created_at: string;
  creator_name: string | null;
  category: MarketCategory;
  tags: MarketTag[];
  origin_image_id?: string | null;
  viewer_has_liked?: boolean;
  viewer_has_favorited?: boolean;
}

export interface MarketListResponse {
  items: MarketItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProjectReferenceAsset {
  id: string;
  project_id: string;
  market_item_id: string;
  title: string;
  source_type: string;
  storage_path: string;
  download_url: string | null;
  created_at: string;
}
