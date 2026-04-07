import { useEffect, useState } from 'react';
import { EyeOff, Star, Upload } from 'lucide-react';

import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import type { MarketCategory, MarketItem, MarketListResponse, MarketTag } from '@/lib/market';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AdminMarket() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [tags, setTags] = useState<MarketTag[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState('');
  const [uploadContentType, setUploadContentType] = useState<'ai_generated' | 'non_ai_figure'>('non_ai_figure');
  const [uploadPaperUrl, setUploadPaperUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'draft' | 'published'>('draft');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    const [itemsResponse, categoriesResponse, tagsResponse] = await Promise.all([
      api.get<MarketListResponse>('/admin/market/items?page=1&page_size=100'),
      api.get('/market/categories'),
      api.get('/market/tags'),
    ]);

    const nextCategories = categoriesResponse.data || [];
    setItems(itemsResponse.data.items || []);
    setCategories(nextCategories);
    setTags(tagsResponse.data || []);
    if (!uploadCategoryId) {
      setUploadCategoryId(nextCategories[0]?.id || '');
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        await loadData();
      } catch (nextError) {
        setError(getApiErrorMessage(nextError, '市场管理数据加载失败，请稍后重试。'));
      }
    })();
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagId) ? previous.filter((value) => value !== tagId) : [...previous, tagId],
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await api.post('/admin/market/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      setMessage('分类已创建。');
      await loadData();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '创建分类失败，请稍后重试。'));
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await api.post('/admin/market/tags', { name: newTagName.trim() });
      setNewTagName('');
      setMessage('标签已创建。');
      await loadData();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '创建标签失败，请稍后重试。'));
    }
  };

  const handleUploadItem = async () => {
    if (!uploadFile || !uploadTitle.trim() || !uploadCategoryId) {
      setError('请补全官方条目上传信息。');
      return;
    }
    if (uploadContentType === 'non_ai_figure' && !uploadPaperUrl.trim()) {
      setError('非 AI 配图官方条目必须附带论文链接。');
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle.trim());
      formData.append('summary', uploadSummary.trim());
      formData.append('category_id', uploadCategoryId);
      formData.append('content_type', uploadContentType);
      formData.append('paper_url', uploadPaperUrl.trim());
      formData.append('status', uploadStatus);
      formData.append('is_featured', String(uploadFeatured));
      formData.append('tag_ids', selectedTagIds.join(','));
      formData.append('image_file', uploadFile);

      await api.post('/admin/market/items', formData);
      setUploadTitle('');
      setUploadSummary('');
      setUploadPaperUrl('');
      setUploadFile(null);
      setSelectedTagIds([]);
      setUploadFeatured(false);
      setMessage('官方市场条目已创建。');
      await loadData();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '上传官方条目失败，请稍后重试。'));
    }
  };

  const handleFeatureToggle = async (item: MarketItem) => {
    const formData = new FormData();
    formData.append('featured', String(!item.is_featured));
    await api.put(`/admin/market/items/${item.id}/feature`, formData);
    await loadData();
  };

  const handleHiddenToggle = async (item: MarketItem) => {
    const formData = new FormData();
    formData.append('hidden', String(item.status !== 'hidden'));
    await api.put(`/admin/market/items/${item.id}/hide`, formData);
    await loadData();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <section className="space-y-2">
        <Badge variant="secondary">管理员市场台</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">运营市场内容与精选</h1>
        <p className="text-sm leading-6 text-slate-600">
          维护分类与标签，上传官方作品，对用户条目加精、隐藏与治理。
        </p>
      </section>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {message ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6 text-sm text-emerald-700">{message}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[380px_380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>创建分类</CardTitle>
            <CardDescription>市场大类由管理员维护。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="例如：架构图" />
            <Button className="w-full" onClick={handleCreateCategory}>创建分类</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>创建标签</CardTitle>
            <CardDescription>发布时仅支持选择已有标签。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="例如：Transformer" />
            <Button className="w-full" onClick={handleCreateTag}>创建标签</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>上传官方作品</CardTitle>
            <CardDescription>适用于官方精选或非 AI 配图示例。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-upload-title">标题</Label>
              <Input id="admin-upload-title" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-upload-summary">简介</Label>
              <Textarea id="admin-upload-summary" value={uploadSummary} onChange={(event) => setUploadSummary(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-upload-file">上传图片</Label>
              <Input id="admin-upload-file" type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>分类</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={uploadCategoryId === category.id ? 'default' : 'outline'}
                    onClick={() => setUploadCategoryId(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>内容类型</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={uploadContentType === 'ai_generated' ? 'default' : 'outline'} onClick={() => setUploadContentType('ai_generated')}>
                  AI 生成
                </Button>
                <Button size="sm" variant={uploadContentType === 'non_ai_figure' ? 'default' : 'outline'} onClick={() => setUploadContentType('non_ai_figure')}>
                  非 AI 配图
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>初始状态</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={uploadStatus === 'draft' ? 'default' : 'outline'} onClick={() => setUploadStatus('draft')}>
                  草稿
                </Button>
                <Button size="sm" variant={uploadStatus === 'published' ? 'default' : 'outline'} onClick={() => setUploadStatus('published')}>
                  发布
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-upload-paper">论文链接</Label>
              <Input id="admin-upload-paper" value={uploadPaperUrl} onChange={(event) => setUploadPaperUrl(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    size="sm"
                    variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
                    onClick={() => toggleTag(tag.id)}
                  >
                    #{tag.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Button variant={uploadFeatured ? 'default' : 'outline'} size="sm" onClick={() => setUploadFeatured((previous) => !previous)}>
                {uploadFeatured ? '已标记精选' : '设为精选'}
              </Button>
            </div>
            <div className="md:col-span-2">
              <Button className="w-full" onClick={handleUploadItem}>
                <Upload className="mr-2 h-4 w-4" />
                创建官方条目
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">全部市场条目</h2>
          <p className="text-sm text-slate-500">共 {items.length} 条</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.category.name}</Badge>
                  <Badge variant="outline">{item.status}</Badge>
                  {item.is_featured ? (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">精选</Badge>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.summary || '暂无简介'}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void handleFeatureToggle(item)}>
                  <Star className="mr-2 h-4 w-4" />
                  {item.is_featured ? '取消精选' : '设为精选'}
                </Button>
                <Button variant="outline" onClick={() => void handleHiddenToggle(item)}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  {item.status === 'hidden' ? '恢复公开' : '隐藏条目'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
