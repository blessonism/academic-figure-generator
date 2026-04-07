import { useEffect, useState } from 'react';
import { Cpu, Lock, Palette, RefreshCw, Settings2, UserRound } from 'lucide-react';

import { api } from '../lib/api';
import { PromptAIEffectiveConfigSummary, type PromptAIEffectiveConfig } from '../components/PromptAIEffectiveConfigSummary';
import { PromptAIModelField, type PromptAIModelOption } from '../components/PromptAIModelField';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '@/lib/utils';

type ColorSchemeOption = {
    value: string;
    label: string;
};

type SettingsUpdatePayload = {
    display_name?: string;
    default_color_scheme?: string;
    default_resolution?: string;
    default_aspect_ratio?: string;
    prompt_ai_provider?: 'anthropic' | 'openai-compatible';
    prompt_ai_api_key?: string | null;
    prompt_ai_api_base_url?: string | null;
    prompt_ai_model?: string | null;
};

function getErrorDetail(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
        return undefined;
    }

    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    return typeof response?.data?.detail === 'string' ? response.data.detail : undefined;
}

const RESOLUTION_OPTIONS = ['1K', '2K', '4K'] as const;
const ASPECT_RATIO_OPTIONS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'] as const;

function SectionBanner({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

export function Settings({ embedded = false }: { embedded?: boolean }) {
    const { user, updateUser } = useAuthStore();
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingAi, setIsSavingAi] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [aiSuccess, setAiSuccess] = useState('');
    const [colorSchemeOptions, setColorSchemeOptions] = useState<ColorSchemeOption[]>([
        { value: 'okabe-ito', label: 'Okabe-Ito (推荐)' },
    ]);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [promptAiModels, setPromptAiModels] = useState<PromptAIModelOption[]>([]);
    const [promptAiModelsMessage, setPromptAiModelsMessage] = useState('');
    const [promptAiModelsError, setPromptAiModelsError] = useState('');
    const [isFetchingPromptAiModels, setIsFetchingPromptAiModels] = useState(false);
    const [effectivePromptAiConfig, setEffectivePromptAiConfig] = useState<PromptAIEffectiveConfig | null>(
        user?.prompt_ai_effective_config || null,
    );
    const [formData, setFormData] = useState({
        display_name: user?.display_name || '',
        default_color_scheme: user?.default_color_scheme || 'okabe-ito',
        default_resolution: user?.default_resolution || '2K',
        default_aspect_ratio: user?.default_aspect_ratio || '16:9',
        prompt_ai_provider: user?.prompt_ai_provider || 'openai-compatible',
        prompt_ai_api_key: '',
        prompt_ai_api_base_url: user?.prompt_ai_api_base_url || '',
        prompt_ai_model: user?.prompt_ai_model || '',
    });

    useEffect(() => {
        if (!user) {
            return;
        }

        setFormData({
            display_name: user.display_name || '',
            default_color_scheme: user.default_color_scheme || 'okabe-ito',
            default_resolution: user.default_resolution || '2K',
            default_aspect_ratio: user.default_aspect_ratio || '16:9',
            prompt_ai_provider: user.prompt_ai_provider || 'openai-compatible',
            prompt_ai_api_key: '',
            prompt_ai_api_base_url: user.prompt_ai_api_base_url || '',
            prompt_ai_model: user.prompt_ai_model || '',
        });
        setEffectivePromptAiConfig(user.prompt_ai_effective_config || null);
    }, [user]);

    useEffect(() => {
        let active = true;

        const fetchColorSchemes = async () => {
            try {
                const res = await api.get('/color-schemes/');
                if (!active) {
                    return;
                }

                const options = Array.isArray(res.data)
                    ? res.data
                        .filter((scheme: { id?: string; name?: string } | null) => Boolean(scheme?.id && scheme?.name))
                        .map((scheme: { id: string; name: string }) => ({
                            value: scheme.id,
                            label: scheme.name,
                        }))
                    : [];

                if (options.length === 0) {
                    return;
                }

                setColorSchemeOptions((currentOptions) => {
                    const merged = [...options];
                    const hasCurrentValue = merged.some((option) => option.value === formData.default_color_scheme);
                    if (!hasCurrentValue && formData.default_color_scheme) {
                        merged.push({
                            value: formData.default_color_scheme,
                            label: formData.default_color_scheme,
                        });
                    }

                    return merged.length > 0 ? merged : currentOptions;
                });
            } catch (error) {
                console.error('Failed to fetch color schemes:', error);
            }
        };

        fetchColorSchemes();

        return () => {
            active = false;
        };
    }, [formData.default_color_scheme]);

    useEffect(() => {
        setPromptAiModels([]);
        setPromptAiModelsMessage('');
        setPromptAiModelsError('');
    }, [formData.prompt_ai_provider, formData.prompt_ai_api_base_url, formData.prompt_ai_api_key]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;
        const timer = window.setTimeout(async () => {
            try {
                const res = await api.post('/auth/me/prompt-ai/resolve-preview', {
                    prompt_ai_provider: formData.prompt_ai_provider,
                    prompt_ai_api_key: formData.prompt_ai_api_key || null,
                    prompt_ai_api_base_url: formData.prompt_ai_api_base_url || null,
                    prompt_ai_model: formData.prompt_ai_model || null,
                });
                if (!active) {
                    return;
                }
                setEffectivePromptAiConfig(res.data as PromptAIEffectiveConfig);
            } catch (error) {
                if (!active) {
                    return;
                }
                setEffectivePromptAiConfig((current) => current);
                setPromptAiModelsError((current) => current || getErrorDetail(error) || '');
            }
        }, 200);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [
        formData.prompt_ai_provider,
        formData.prompt_ai_api_key,
        formData.prompt_ai_api_base_url,
        formData.prompt_ai_model,
        user,
    ]);

    if (!user) {
        return null;
    }

    const hasPassword = !user.linuxdo_id || user.email?.indexOf('@linuxdo.local') === -1;

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setProfileSuccess('');
        try {
            const payload: SettingsUpdatePayload = {
                display_name: formData.display_name,
                default_color_scheme: formData.default_color_scheme,
                default_resolution: formData.default_resolution,
                default_aspect_ratio: formData.default_aspect_ratio,
            };
            const res = await api.put('/auth/me', payload);
            updateUser(res.data);
            setProfileSuccess('个人设置已保存。');
        } catch (error) {
            console.error(error);
            alert('保存个人设置失败，请重试');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveAi = async () => {
        setIsSavingAi(true);
        setAiSuccess('');
        try {
            const payload: SettingsUpdatePayload = {
                prompt_ai_provider: formData.prompt_ai_provider,
                prompt_ai_api_key: formData.prompt_ai_api_key || undefined,
                prompt_ai_api_base_url: formData.prompt_ai_api_base_url || null,
                prompt_ai_model: formData.prompt_ai_model || null,
            };
            const res = await api.put('/auth/me', payload);
            updateUser(res.data);
            setAiSuccess('AI 配置已保存。');
            setFormData((current) => ({
                ...current,
                prompt_ai_provider: res.data.prompt_ai_provider || current.prompt_ai_provider,
                prompt_ai_api_key: '',
                prompt_ai_api_base_url: res.data.prompt_ai_api_base_url || '',
                prompt_ai_model: res.data.prompt_ai_model || '',
            }));
            setEffectivePromptAiConfig(res.data.prompt_ai_effective_config || null);
        } catch (error) {
            console.error(error);
            alert(getErrorDetail(error) || '保存 AI 配置失败，请重试');
        } finally {
            setIsSavingAi(false);
        }
    };

    const handleResetAi = async () => {
        setIsSavingAi(true);
        setAiSuccess('');
        try {
            const payload: SettingsUpdatePayload = {
                prompt_ai_provider: formData.prompt_ai_provider,
                prompt_ai_api_key: null,
                prompt_ai_api_base_url: null,
                prompt_ai_model: null,
            };
            const res = await api.put('/auth/me', payload);
            updateUser(res.data);
            setAiSuccess('已恢复系统默认 AI 配置。');
            setFormData((current) => ({
                ...current,
                prompt_ai_provider: res.data.prompt_ai_provider || current.prompt_ai_provider,
                prompt_ai_api_key: '',
                prompt_ai_api_base_url: '',
                prompt_ai_model: '',
            }));
            setEffectivePromptAiConfig(res.data.prompt_ai_effective_config || null);
        } catch (error) {
            console.error(error);
            alert(getErrorDetail(error) || '恢复系统默认 AI 配置失败，请重试');
        } finally {
            setIsSavingAi(false);
        }
    };

    const handleFetchPromptAiModels = async () => {
        setIsFetchingPromptAiModels(true);
        setPromptAiModels([]);
        setPromptAiModelsMessage('');
        setPromptAiModelsError('');
        try {
            const res = await api.post('/auth/me/prompt-ai/models', {
                prompt_ai_provider: formData.prompt_ai_provider,
                prompt_ai_api_key: formData.prompt_ai_api_key || null,
                prompt_ai_api_base_url: formData.prompt_ai_api_base_url || null,
            });
            const models: PromptAIModelOption[] = Array.isArray(res.data?.models) ? res.data.models : [];
            setPromptAiModels(models);
            setPromptAiModelsMessage(
                models.length > 0
                    ? `已拉取 ${models.length} 个模型，可直接选择，也可以继续手动输入。`
                    : '当前配置未返回可用模型，仍可手动输入模型名称。'
            );
        } catch (error) {
            setPromptAiModelsError(getErrorDetail(error) || '拉取模型失败，请检查 Provider、API Key 和请求地址。');
        } finally {
            setIsFetchingPromptAiModels(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('两次输入的新密码不一致');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setPasswordError('新密码至少需要 8 个字符');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put('/auth/me/password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });
            setPasswordSuccess('密码修改成功！');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            const detail =
                typeof error === 'object'
                && error !== null
                && 'response' in error
                && typeof (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail === 'string'
                    ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
                    : undefined;
            setPasswordError(detail || '密码修改失败，请重试');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className={cn('space-y-6', embedded ? '' : 'mx-auto max-w-6xl')}>
            {!embedded ? (
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">应用设置</h1>
                    <p className="mt-1 text-muted-foreground">这里仅管理您的账户资料、登录安全、AI 配置与个人偏好。平台能力配置统一由管理员维护。</p>
                </div>
            ) : null}

            <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-6">
                    <SectionBanner
                        eyebrow="Account"
                        title="账户与安全"
                        description="处理登录身份、基础资料和密码安全，保持个人账户信息清晰可控。"
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserRound className="h-5 w-5 text-primary" />
                                个人资料
                            </CardTitle>
                            <CardDescription>更新您的基础账户信息。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">注册邮箱</Label>
                                <Input id="email" value={user.email} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="display_name">显示名称</Label>
                                <Input
                                    id="display_name"
                                    value={formData.display_name}
                                    onChange={(event) => setFormData((current) => ({ ...current, display_name: event.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {hasPassword && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" />
                                    修改密码
                                </CardTitle>
                                <CardDescription>更新您的登录密码。</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_password">当前密码</Label>
                                    <Input
                                        id="current_password"
                                        type="password"
                                        placeholder="请输入当前密码"
                                        value={passwordData.current_password}
                                        onChange={(event) => setPasswordData((current) => ({ ...current, current_password: event.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new_password">新密码</Label>
                                    <Input
                                        id="new_password"
                                        type="password"
                                        placeholder="至少 8 个字符"
                                        value={passwordData.new_password}
                                        onChange={(event) => setPasswordData((current) => ({ ...current, new_password: event.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm_password">确认新密码</Label>
                                    <Input
                                        id="confirm_password"
                                        type="password"
                                        placeholder="再次输入新密码"
                                        value={passwordData.confirm_password}
                                        onChange={(event) => setPasswordData((current) => ({ ...current, confirm_password: event.target.value }))}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t bg-muted/40 p-4">
                                <div>
                                    {passwordSuccess && <p className="text-sm font-medium text-green-600">{passwordSuccess}</p>}
                                    {passwordError && <p className="text-sm font-medium text-red-600">{passwordError}</p>}
                                </div>
                                <Button onClick={handleChangePassword} disabled={passwordLoading}>
                                    {passwordLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    修改密码
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <SectionBanner
                        eyebrow="Preferences"
                        title="个人偏好"
                        description="管理个人 AI 渠道和默认生成规格；留空的 AI 字段会回退到系统默认配置。"
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-primary" />
                                AI 配置
                            </CardTitle>
                            <CardDescription>用于草案生成的个人 AI 渠道与模型配置。若不填写请求地址和模型，将自动继承系统默认值。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="prompt_ai_provider">AI Provider</Label>
                                    <Select
                                        value={formData.prompt_ai_provider}
                                        onValueChange={(value: 'anthropic' | 'openai-compatible') =>
                                            setFormData((current) => ({ ...current, prompt_ai_provider: value }))
                                        }
                                    >
                                        <SelectTrigger id="prompt_ai_provider">
                                            <SelectValue placeholder="选择 Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="anthropic">Anthropic</SelectItem>
                                            <SelectItem value="openai-compatible">OpenAI Compatible</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <PromptAIModelField
                                        id="prompt_ai_model"
                                        label="AI 模型"
                                        placeholder="留空则继承系统或环境中的生效模型"
                                        value={formData.prompt_ai_model}
                                        onChange={(value) => setFormData((current) => ({ ...current, prompt_ai_model: value }))}
                                        onFetch={handleFetchPromptAiModels}
                                        isFetching={isFetchingPromptAiModels}
                                        models={promptAiModels}
                                        fetchHint="点击“拉取模型”会优先使用当前表单中的配置；若个人 Key 留空，则回退到已保存配置、系统配置或环境变量。"
                                        message={promptAiModelsMessage}
                                        error={promptAiModelsError}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label htmlFor="prompt_ai_api_key">AI API Key</Label>
                                    {user.prompt_ai_api_key_set ? (
                                        <span className="text-xs text-muted-foreground">已保存个人 Key，留空保持不变</span>
                                    ) : null}
                                </div>
                                <Input
                                    id="prompt_ai_api_key"
                                    type="password"
                                    placeholder={user.prompt_ai_api_key_set ? '****** (已设置，留空保持不变)' : '输入个人 AI API Key'}
                                    value={formData.prompt_ai_api_key}
                                    onChange={(event) => setFormData((current) => ({ ...current, prompt_ai_api_key: event.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prompt_ai_api_base_url">AI 请求地址</Label>
                                <Input
                                    id="prompt_ai_api_base_url"
                                    placeholder="留空则使用系统默认地址"
                                    value={formData.prompt_ai_api_base_url}
                                    onChange={(event) => setFormData((current) => ({ ...current, prompt_ai_api_base_url: event.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    当前若存在个人地址或个人 Key，会优先于系统默认配置生效。
                                </p>
                            </div>

                            <PromptAIEffectiveConfigSummary effectiveConfig={effectivePromptAiConfig} />
                        </CardContent>
                        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 p-4">
                            <div>
                                {aiSuccess ? <p className="text-sm font-medium text-green-600">{aiSuccess}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={handleResetAi} disabled={isSavingAi}>
                                    恢复系统默认
                                </Button>
                                <Button type="button" onClick={handleSaveAi} disabled={isSavingAi}>
                                    {isSavingAi && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    保存 AI 配置
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-primary" />
                                默认生成偏好
                            </CardTitle>
                            <CardDescription>设置您常用的配色、分辨率和画面比例，作为新会话的默认参数。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="default_color_scheme">默认配色方案</Label>
                                <Select
                                    value={formData.default_color_scheme}
                                    onValueChange={(value) => setFormData((current) => ({ ...current, default_color_scheme: value }))}
                                >
                                    <SelectTrigger id="default_color_scheme">
                                        <SelectValue placeholder="选择默认配色" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colorSchemeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">如需新增或编辑配色，请前往“配色管理”页面维护。</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="default_resolution">默认分辨率</Label>
                                    <Select
                                        value={formData.default_resolution}
                                        onValueChange={(value) => setFormData((current) => ({ ...current, default_resolution: value }))}
                                    >
                                        <SelectTrigger id="default_resolution">
                                            <SelectValue placeholder="选择分辨率" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RESOLUTION_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="default_aspect_ratio">默认画面比例</Label>
                                    <Select
                                        value={formData.default_aspect_ratio}
                                        onValueChange={(value) => setFormData((current) => ({ ...current, default_aspect_ratio: value }))}
                                    >
                                        <SelectTrigger id="default_aspect_ratio">
                                            <SelectValue placeholder="选择画面比例" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ASPECT_RATIO_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-muted/20 p-4">
                                <div className="flex items-start gap-3">
                                    <Palette className="mt-0.5 h-5 w-5 text-primary" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">默认值只影响新会话</p>
                                        <p className="text-xs leading-6 text-muted-foreground">项目内已手动覆盖的参数不会被这里重写；这里只负责给新的生成流程提供更顺手的起始值。</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t bg-muted/40 p-4">
                            <div>
                                {profileSuccess && <p className="text-sm font-medium text-green-600">{profileSuccess}</p>}
                            </div>
                            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                                {isSavingProfile && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                保存个人设置
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
