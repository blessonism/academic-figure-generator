import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Heart, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import type { MarketCategory, MarketItem, MarketListResponse, MarketTag } from '@/lib/market';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Market() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [tags, setTags] = useState<MarketTag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTagSlug, setSelectedTagSlug] = useState<string>('all');
  const [sort, setSort] = useState<'latest' | 'hot'>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          api.get('/market/categories'),
          api.get('/market/tags'),
        ]);
        if (!mounted) {
          return;
        }

        setCategories(categoriesResponse.data || []);
        setTags(tagsResponse.data || []);
      } catch (nextError) {
        if (!mounted) {
          return;
        }

        setError(getApiErrorMessage(nextError, '市场分类加载失败，请稍后重试。'));
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('page_size', '48');
        params.set('sort', sort);
        if (selectedCategoryId !== 'all') {
          params.set('category_id', selectedCategoryId);
        }
        if (selectedTagSlug !== 'all') {
          params.set('tag', selectedTagSlug);
        }

        const response = await api.get<MarketListResponse>(`/market/items?${params.toString()}`);
        if (!mounted) {
          return;
        }

        setItems(response.data.items || []);
      } catch (nextError) {
        if (!mounted) {
          return;
        }

        setError(getApiErrorMessage(nextError, '市场内容加载失败，请稍后重试。'));
        setItems([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedCategoryId, selectedTagSlug, sort]);

  const featuredItems = items.filter((item) => item.is_featured).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              科研配图市场
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                发现能下载、能垫图、能沉淀到项目里的科研配图
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                浏览社区发布与官方精选作品，筛选不同类型与标签，找到合适的科研配图后直接下载、垫图再创作，或导入到你的项目素材库。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(token ? '/market/mine' : '/login')}>
              {token ? '我的发布' : '登录后发布'}
            </Button>
            <Button onClick={() => navigate(token ? '/generate' : '/login')}>开始创作</Button>
          </div>
        </div>
      </section>

      {featuredItems.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">精选推荐</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => navigate(`/market/items/${item.id}`)}
              >
                <CardHeader className="space-y-3">
                  <img
                    src={item.cover_download_url}
                    alt={item.title}
                    className="h-44 w-full rounded-2xl border object-cover"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.category.name}</Badge>
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">精选</Badge>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.summary || '暂无简介'}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">筛选与排序</h2>
          </div>
          <div className="flex gap-2">
            <Button variant={sort === 'latest' ? 'default' : 'outline'} size="sm" onClick={() => setSort('latest')}>
              最新发布
            </Button>
            <Button variant={sort === 'hot' ? 'default' : 'outline'} size="sm" onClick={() => setSort('hot')}>
              热门优先
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategoryId === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategoryId('all')}
            >
              全部分类
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTagSlug === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedTagSlug('all')}
            >
              全部标签
            </Button>
            {tags.slice(0, 16).map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTagSlug === tag.slug ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTagSlug(tag.slug)}
              >
                #{tag.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">市场条目</h2>
          <p className="text-sm text-slate-500">共 {items.length} 条</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-slate-500">正在加载市场内容...</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-slate-500">
              当前筛选条件下暂无条目，可以切换分类/标签或稍后再来看看。
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer overflow-hidden border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => navigate(`/market/items/${item.id}`)}
              >
                <img
                  src={item.cover_download_url}
                  alt={item.title}
                  className="h-52 w-full border-b object-cover"
                />
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.category.name}</Badge>
                    <Badge variant="outline">
                      {item.content_type === 'ai_generated' ? 'AI 生成' : '非 AI 配图'}
                    </Badge>
                    {item.is_featured ? (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">精选</Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-1 text-lg">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.summary || '暂无简介'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-500">
                  <div className="flex flex-wrap gap-2">
                    {item.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{item.creator_name || '匿名用户'}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {item.like_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
