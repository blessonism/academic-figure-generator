import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, Save } from 'lucide-react';

import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import type { MarketCategory, MarketItem, MarketListResponse, MarketTag } from '@/lib/market';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ProjectOption = {
  id: string;
  name: string;
};

type PublishableImage = {
  id: string;
  prompt_id?: string | null;
  generation_status?: string | null;
  created_at?: string | null;
};

type EditableMarketItem = {
  title: string;
  summary: string;
  category_id: string;
  content_type: string;
  paper_url: string;
  status: string;
  tag_ids: string[];
};

export function MarketMine() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [projectImages, setProjectImages] = useState<PublishableImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishSummary, setPublishSummary] = useState('');
  const [publishCategoryId, setPublishCategoryId] = useState('');
  const [publishContentType, setPublishContentType] = useState<'ai_generated' | 'non_ai_figure'>('ai_generated');
  const [publishPaperUrl, setPublishPaperUrl] = useState('');
  const [publishTagIds, setPublishTagIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [tags, setTags] = useState<MarketTag[]>([]);
  const [myItems, setMyItems] = useState<MarketItem[]>([]);
  const [editingItems, setEditingItems] = useState<Record<string, EditableMarketItem>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const completedImages = useMemo(
    () => projectImages.filter((image) => image.generation_status === 'completed'),
    [projectImages],
  );

  const loadBaseData = async () => {
    const [projectsResponse, categoriesResponse, tagsResponse, myItemsResponse] = await Promise.all([
      api.get('/projects/?page=1&page_size=100&status=active'),
      api.get('/market/categories'),
      api.get('/market/tags'),
      api.get<MarketListResponse>('/market/my-items?page=1&page_size=100'),
    ]);

    const nextProjects = projectsResponse.data.items || [];
    const nextCategories = categoriesResponse.data || [];
    const nextTags = tagsResponse.data || [];
    const nextMyItems = myItemsResponse.data.items || [];

    setProjects(nextProjects);
    setCategories(nextCategories);
    setTags(nextTags);
    setMyItems(nextMyItems);
    setEditingItems(
      nextMyItems.reduce<Record<string, EditableMarketItem>>((accumulator, item) => {
        accumulator[item.id] = {
          title: item.title,
          summary: item.summary || '',
          category_id: item.category.id,
          content_type: item.content_type,
          paper_url: item.paper_url || '',
          status: item.status,
          tag_ids: item.tags.map((tag) => tag.id),
        };
        return accumulator;
      }, {}),
    );

    if (!selectedProjectId) {
      setSelectedProjectId(initialProjectId || nextProjects[0]?.id || '');
    }
    if (!publishCategoryId) {
      setPublishCategoryId(nextCategories[0]?.id || '');
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        await loadBaseData();
      } catch (nextError) {
        setError(getApiErrorMessage(nextError, '我的市场数据加载失败，请稍后重试。'));
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectImages([]);
      setSelectedImageId('');
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const response = await api.get(`/projects/${selectedProjectId}/images`);
        if (!mounted) {
          return;
        }
        const nextImages = response.data || [];
        setProjectImages(nextImages);
        setSelectedImageId(nextImages.find((image: PublishableImage) => image.generation_status === 'completed')?.id || '');
      } catch (nextError) {
        if (!mounted) {
          return;
        }
        setError(getApiErrorMessage(nextError, '项目图片加载失败，请稍后重试。'));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedProjectId]);

  const toggleTag = (
    currentTagIds: string[],
    tagId: string,
    setter: (nextValue: string[]) => void,
  ) => {
    setter(
      currentTagIds.includes(tagId)
        ? currentTagIds.filter((value) => value !== tagId)
        : [...currentTagIds, tagId],
    );
  };

  const handlePublish = async () => {
    if (!selectedImageId || !publishTitle.trim() || !publishCategoryId) {
      setError('请先选择图片，并补全标题与分类。');
      return;
    }
    if (publishContentType === 'non_ai_figure' && !publishPaperUrl.trim()) {
      setError('非 AI 配图发布时必须填写论文链接。');
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await api.post(`/market/items/from-images/${selectedImageId}`, {
        title: publishTitle.trim(),
        summary: publishSummary.trim() || null,
        category_id: publishCategoryId,
        tag_ids: publishTagIds,
        content_type: publishContentType,
        paper_url: publishPaperUrl.trim() || null,
      });
      setPublishTitle('');
      setPublishSummary('');
      setPublishPaperUrl('');
      setPublishTagIds([]);
      setMessage('图片已发布到市场。');
      await loadBaseData();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '发布失败，请稍后重试。'));
    }
  };

  const handleSaveItem = async (itemId: string) => {
    const payload = editingItems[itemId];
    if (!payload) {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      await api.put(`/market/my-items/${itemId}`, {
        title: payload.title.trim(),
        summary: payload.summary.trim() || null,
        category_id: payload.category_id,
        content_type: payload.content_type,
        paper_url: payload.paper_url.trim() || null,
        status: payload.status,
        tag_ids: payload.tag_ids,
      });
      setMessage('市场条目已更新。');
      await loadBaseData();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '条目保存失败，请稍后重试。'));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <section className="space-y-2">
        <Badge variant="secondary">我的市场发布</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">管理我的市场作品</h1>
        <p className="text-sm leading-6 text-slate-600">
          从已完成的项目图片中手动发布到市场，并维护标题、分类、标签、论文链接与上下架状态。
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

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>从项目图片发布</CardTitle>
            <CardDescription>只允许发布你自己已生成完成的图片。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>选择项目</Label>
              <div className="flex flex-wrap gap-2">
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    size="sm"
                    variant={selectedProjectId === project.id ? 'default' : 'outline'}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    {project.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>选择图片</Label>
              <div className="flex flex-wrap gap-2">
                {completedImages.length === 0 ? (
                  <p className="text-sm text-slate-500">当前项目暂无可发布的已完成图片。</p>
                ) : (
                  completedImages.map((image) => (
                    <Button
                      key={image.id}
                      size="sm"
                      variant={selectedImageId === image.id ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedImageId(image.id);
                        setPublishTitle(`项目图片 ${image.id.slice(0, 8)}`);
                      }}
                    >
                      {image.id.slice(0, 8)}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-title">标题</Label>
              <Input id="publish-title" value={publishTitle} onChange={(event) => setPublishTitle(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-summary">简介</Label>
              <Textarea id="publish-summary" value={publishSummary} onChange={(event) => setPublishSummary(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>分类</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={publishCategoryId === category.id ? 'default' : 'outline'}
                    onClick={() => setPublishCategoryId(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>内容类型</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={publishContentType === 'ai_generated' ? 'default' : 'outline'}
                  onClick={() => setPublishContentType('ai_generated')}
                >
                  AI 生成
                </Button>
                <Button
                  size="sm"
                  variant={publishContentType === 'non_ai_figure' ? 'default' : 'outline'}
                  onClick={() => setPublishContentType('non_ai_figure')}
                >
                  非 AI 配图
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-paper">论文链接</Label>
              <Input
                id="publish-paper"
                placeholder="非 AI 配图必填"
                value={publishPaperUrl}
                onChange={(event) => setPublishPaperUrl(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    size="sm"
                    variant={publishTagIds.includes(tag.id) ? 'secondary' : 'outline'}
                    onClick={() => toggleTag(publishTagIds, tag.id, setPublishTagIds)}
                  >
                    #{tag.name}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handlePublish}>
              <Globe className="mr-2 h-4 w-4" />
              发布到市场
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>我的已发布条目</CardTitle>
            <CardDescription>支持编辑基础信息、分类标签与上下架状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myItems.length === 0 ? (
              <p className="text-sm text-slate-500">你还没有发布任何市场条目。</p>
            ) : (
              myItems.map((item) => {
                const editing = editingItems[item.id];
                if (!editing) {
                  return null;
                }

                return (
                  <div key={item.id} className="space-y-3 rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{item.category.name}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <Input
                      value={editing.title}
                      onChange={(event) =>
                        setEditingItems((previous) => ({
                          ...previous,
                          [item.id]: { ...previous[item.id], title: event.target.value },
                        }))
                      }
                    />
                    <Textarea
                      value={editing.summary}
                      onChange={(event) =>
                        setEditingItems((previous) => ({
                          ...previous,
                          [item.id]: { ...previous[item.id], summary: event.target.value },
                        }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          size="sm"
                          variant={editing.category_id === category.id ? 'default' : 'outline'}
                          onClick={() =>
                            setEditingItems((previous) => ({
                              ...previous,
                              [item.id]: { ...previous[item.id], category_id: category.id },
                            }))
                          }
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={editing.content_type === 'ai_generated' ? 'default' : 'outline'}
                        onClick={() =>
                          setEditingItems((previous) => ({
                            ...previous,
                            [item.id]: { ...previous[item.id], content_type: 'ai_generated' },
                          }))
                        }
                      >
                        AI 生成
                      </Button>
                      <Button
                        size="sm"
                        variant={editing.content_type === 'non_ai_figure' ? 'default' : 'outline'}
                        onClick={() =>
                          setEditingItems((previous) => ({
                            ...previous,
                            [item.id]: { ...previous[item.id], content_type: 'non_ai_figure' },
                          }))
                        }
                      >
                        非 AI 配图
                      </Button>
                      <Button
                        size="sm"
                        variant={editing.status === 'published' ? 'secondary' : 'outline'}
                        onClick={() =>
                          setEditingItems((previous) => ({
                            ...previous,
                            [item.id]: { ...previous[item.id], status: 'published' },
                          }))
                        }
                      >
                        上架
                      </Button>
                      <Button
                        size="sm"
                        variant={editing.status === 'hidden' ? 'secondary' : 'outline'}
                        onClick={() =>
                          setEditingItems((previous) => ({
                            ...previous,
                            [item.id]: { ...previous[item.id], status: 'hidden' },
                          }))
                        }
                      >
                        隐藏
                      </Button>
                    </div>
                    <Input
                      placeholder="论文链接"
                      value={editing.paper_url}
                      onChange={(event) =>
                        setEditingItems((previous) => ({
                          ...previous,
                          [item.id]: { ...previous[item.id], paper_url: event.target.value },
                        }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Button
                          key={tag.id}
                          size="sm"
                          variant={editing.tag_ids.includes(tag.id) ? 'secondary' : 'outline'}
                          onClick={() =>
                            toggleTag(editing.tag_ids, tag.id, (nextTagIds) =>
                              setEditingItems((previous) => ({
                                ...previous,
                                [item.id]: { ...previous[item.id], tag_ids: nextTagIds },
                              })),
                            )
                          }
                        >
                          #{tag.name}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => handleSaveItem(item.id)}>
                        <Save className="mr-2 h-4 w-4" />
                        保存条目
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
