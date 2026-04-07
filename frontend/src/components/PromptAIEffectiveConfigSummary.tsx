import { AlertCircle, CheckCircle2, HelpCircle, KeyRound, ServerCog } from 'lucide-react';

type PromptAIConfigSource =
  | 'user'
  | 'system'
  | 'env'
  | 'provider_default'
  | 'service_default'
  | 'missing';

export interface PromptAIEffectiveConfig {
  provider: 'anthropic' | 'openai-compatible';
  api_base_url: string;
  model: string;
  max_tokens: number;
  api_key_available: boolean;
  validation_status: 'valid' | 'unknown' | 'invalid';
  validation_message: string | null;
  sources: {
    provider: PromptAIConfigSource;
    api_key: PromptAIConfigSource;
    api_base_url: PromptAIConfigSource;
    model: PromptAIConfigSource;
    max_tokens: PromptAIConfigSource;
  };
}

const SOURCE_LABELS: Record<PromptAIConfigSource, string> = {
  user: '用户配置',
  system: '系统配置',
  env: '环境变量',
  provider_default: 'Provider 默认',
  service_default: '服务默认',
  missing: '未配置',
};

function SourceBadge({ source }: { source: PromptAIConfigSource }) {
  return (
    <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {SOURCE_LABELS[source]}
    </span>
  );
}

function StatusBanner({
  status,
  message,
}: {
  status: PromptAIEffectiveConfig['validation_status'];
  message: string | null;
}) {
  const content =
    status === 'valid'
      ? {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          label: '已验证',
          className: 'border-green-200 bg-green-50/80 text-green-700',
        }
      : status === 'invalid'
        ? {
            icon: <AlertCircle className="h-4 w-4 text-red-600" />,
            label: '配置无效',
            className: 'border-red-200 bg-red-50/80 text-red-700',
          }
        : {
            icon: <HelpCircle className="h-4 w-4 text-amber-600" />,
            label: '尚未验证',
            className: 'border-amber-200 bg-amber-50/80 text-amber-700',
          };

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${content.className}`}>
      <div className="flex items-center gap-2 font-medium">
        {content.icon}
        <span>{content.label}</span>
      </div>
      {message ? <p className="mt-1 text-xs leading-5">{message}</p> : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source: PromptAIConfigSource;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <SourceBadge source={source} />
      </div>
      <div className="break-all text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function PromptAIEffectiveConfigSummary({
  effectiveConfig,
}: {
  effectiveConfig: PromptAIEffectiveConfig | null;
}) {
  if (!effectiveConfig) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <ServerCog className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">当前生效配置</h3>
      </div>

      <StatusBanner
        status={effectiveConfig.validation_status}
        message={effectiveConfig.validation_message}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <SummaryRow
          label="Provider"
          value={effectiveConfig.provider}
          source={effectiveConfig.sources.provider}
        />
        <SummaryRow
          label="模型"
          value={effectiveConfig.model || '未配置'}
          source={effectiveConfig.sources.model}
        />
        <SummaryRow
          label="请求地址"
          value={effectiveConfig.api_base_url || '未配置'}
          source={effectiveConfig.sources.api_base_url}
        />
        <SummaryRow
          label="Max Tokens"
          value={String(effectiveConfig.max_tokens)}
          source={effectiveConfig.sources.max_tokens}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5" />
        <span>API Key：{effectiveConfig.api_key_available ? '当前可用' : '当前不可用'}</span>
        <SourceBadge source={effectiveConfig.sources.api_key} />
      </div>
    </div>
  );
}
