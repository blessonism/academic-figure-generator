import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Download, Heart, LibraryBig, Sparkles, Star } from 'lucide-react';

import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { fetchAuthedBlob, triggerBrowserDownload } from '@/lib/blob';
import type { MarketItem } from '@/lib/market';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProjectOption = {
  id: string;
  name: string;
};

export function MarketItemDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [item, setItem] = useState<MarketItem | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);
    setMessage(null);

    void (async () => {
      try {
        const detailResponse = await api.get(`/market/items/${id}`);
        if (!mounted) {
          return;
        }
        setItem(detailResponse.data);

        if (token) {
          const projectsResponse = await api.get('/projects/?page=1&page_size=100&status=active');
          if (!mounted) {
            return;
          }
          const nextProjects = projectsResponse.data.items || [];
          setProjects(nextProjects);
          setSelectedProjectId(nextProjects[0]?.id || '');
        } else {
          setProjects([]);
          setSelectedProjectId('');
        }
      } catch (nextError) {
        if (!mounted) {
          return;
        }

        setError(getApiErrorMessage(nextError, '市场详情加载失败，请稍后重试。'));
        setItem(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, token]);

  const requireLogin = () => {
    navigate('/login', { state: { from: location } });
  };

  const refreshDetail = async () => {
    if (!id) {
      return;
    }

    const response = await api.get(`/market/items/${id}`);
    setItem(response.data);
  };

  const handleToggleLike = async () => {
    if (!item || !id) {
      return;
    }
    if (!token) {
      requireLogin();
      return;
    }

    setIsActing(true);
    setError(null);
    try {
      const response = item.viewer_has_liked
        ? await api.delete(`/market/items/${id}/like`)
        : await api.put(`/market/items/${id}/like`);

      setItem((previous) =>
        previous
          ? {
              ...previous,
              like_count: response.data.like_count,
              favorite_count: response.data.favorite_count,
              download_count: response.data.download_count,
              viewer_has_liked: response.data.viewer_has_liked,
              viewer_has_favorited: response.data.viewer_has_favorited,
            }
          : previous,
      );
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '点赞操作失败，请稍后重试。'));
    } finally {
      setIsActing(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!item || !id) {
      return;
    }
    if (!token) {
      requireLogin();
      return;
    }

    setIsActing(true);
    setError(null);
    try {
      const response = item.viewer_has_favorited
        ? await api.delete(`/market/items/${id}/favorite`)
        : await api.put(`/market/items/${id}/favorite`);

      setItem((previous) =>
        previous
          ? {
              ...previous,
              like_count: response.data.like_count,
              favorite_count: response.data.favorite_count,
              download_count: response.data.download_count,
              viewer_has_liked: response.data.viewer_has_liked,
              viewer_has_favorited: response.data.viewer_has_favorited,
            }
          : previous,
      );
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '收藏操作失败，请稍后重试。'));
    } finally {
      setIsActing(false);
    }
  };

  const handleDownload = async () => {
    if (!item || !id) {
      return;
    }
    if (!token) {
      requireLogin();
      return;
    }

    setIsActing(true);
    setError(null);
    try {
      const { blob, ext } = await fetchAuthedBlob(`/market/items/${id}/download`);
      triggerBrowserDownload(blob, `${item.title}.${ext}`);
      await refreshDetail();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '下载失败，请稍后重试。'));
    } finally {
      setIsActing(false);
    }
  };

  const handleImportToProject = async () => {
    if (!item || !id) {
      return;
    }
    if (!token) {
      requireLogin();
      return;
    }
    if (!selectedProjectId) {
      setError('请先选择一个项目。');
      return;
    }

    setIsActing(true);
    setError(null);
    setMessage(null);
    try {
      await api.post(`/market/items/${id}/import-to-project`, { project_id: selectedProjectId });
      setMessage('素材已导入到选中的项目，可在项目工作台中查看。');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, '导入项目失败，请稍后重试。'));
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">正在加载市场详情...</CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            {error || '未找到对应的市场条目。'}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
        <Card className="overflow-hidden">
          <img src={item.cover_download_url} alt={item.title} className="max-h-[640px] w-full object-cover" />
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{item.category.name}</Badge>
                <Badge variant="outline">
                  {item.content_type === 'ai_generated' ? 'AI 生成' : '非 AI 配图'}
                </Badge>
                {item.is_featured ? (
                  <Badge className="bg-amber-500 text-white hover:bg-amber-500">精选</Badge>
                ) : null}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  {item.summary || '暂无简介'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                <p>发布者：{item.creator_name || '匿名用户'}</p>
                <p>点赞：{item.like_count}，收藏：{item.favorite_count}，下载：{item.download_count}</p>
                {item.paper_url ? (
                  <p>
                    论文链接：
                    <a
                      href={item.paper_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-sky-600 underline underline-offset-4"
                    >
                      查看来源论文
                    </a>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">市场动作</CardTitle>
              <CardDescription>登录后即可点赞、收藏、下载、垫图生成与导入项目。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant={item.viewer_has_liked ? 'default' : 'outline'} onClick={handleToggleLike} disabled={isActing}>
                  <Heart className="mr-2 h-4 w-4" />
                  {item.viewer_has_liked ? '取消点赞' : '点赞'}
                </Button>
                <Button variant={item.viewer_has_favorited ? 'default' : 'outline'} onClick={handleToggleFavorite} disabled={isActing}>
                  <Star className="mr-2 h-4 w-4" />
                  {item.viewer_has_favorited ? '取消收藏' : '收藏'}
                </Button>
                <Button onClick={handleDownload} disabled={isActing}>
                  <Download className="mr-2 h-4 w-4" />
                  下载原图
                </Button>
                <Button variant="outline" onClick={() => (token ? navigate(`/generate?referenceMarketItemId=${id}`) : requireLogin())}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  作为垫图生成
                </Button>
              </div>

              <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
                <div className="space-y-2">
                  <Label htmlFor="project-select">导入到项目素材库</Label>
                  <Input
                    id="project-select"
                    value={projects.find((project) => project.id === selectedProjectId)?.name || ''}
                    onChange={() => {}}
                    readOnly
                    placeholder={token ? '请先在下方选择项目' : '登录后可导入项目'}
                  />
                </div>
                {token ? (
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
                ) : null}
                <Button variant="secondary" onClick={handleImportToProject} disabled={isActing}>
                  <LibraryBig className="mr-2 h-4 w-4" />
                  导入到我的项目
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
