function toText(value: any): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const parts = value
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object') {
          if (typeof v.msg === 'string') return v.msg;
          if (typeof v.message === 'string') return v.message;
        }
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      })
      .filter(Boolean);
    return parts.length ? parts.join('; ') : null;
  }

  if (value && typeof value === 'object') {
    if (typeof value.msg === 'string') return value.msg;
    if (typeof value.message === 'string') return value.message;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return null;
}

const FRIENDLY_ERROR_RULES: Array<{
  match: (normalized: string) => boolean;
  message: string;
}> = [
  {
    match: (normalized) =>
      normalized.includes('jsondecodeerror')
      || normalized.includes('expecting value: line 1 column 1'),
    message: '上游服务返回了空响应或非标准数据，请稍后重试。',
  },
  {
    match: (normalized) =>
      normalized.includes('unexpected_eof_while_reading')
      || normalized.includes('ssl eof')
      || normalized.includes('eof occurred in violation of protocol'),
    message: '与上游服务的安全连接已中断，请稍后重试。',
  },
  {
    match: (normalized) =>
      normalized.includes('504 gateway timeout')
      || normalized.includes('gateway timeout')
      || normalized.includes('read timeout')
      || normalized.includes('connect timeout')
      || normalized.includes('timed out')
      || normalized.includes('timeout'),
    message: '上游服务响应超时，请稍后重试。',
  },
  {
    match: (normalized) =>
      normalized.includes('502 bad gateway')
      || normalized.includes('503 service unavailable')
      || normalized.includes('bad gateway')
      || normalized.includes('service unavailable'),
    message: '上游服务暂时不可用，请稍后重试。',
  },
  {
    match: (normalized) =>
      normalized.includes('connection refused')
      || normalized.includes('failed to establish a new connection')
      || normalized.includes('temporary failure in name resolution')
      || normalized.includes('name or service not known')
      || normalized.includes('nodename nor servname')
      || normalized.includes('connecterror')
      || normalized.includes('connection error'),
    message: '无法连接到上游服务，请检查网络或服务配置。',
  },
];

export function humanizeErrorText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return value == null ? null : String(value);
  }

  const text = value.trim();
  if (!text) {
    return null;
  }

  if (text.includes('系统正在自动重试')) {
    return text;
  }

  const normalized = text.toLowerCase();
  const matchedRule = FRIENDLY_ERROR_RULES.find((rule) => rule.match(normalized));
  return matchedRule?.message || text;
}

export function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  const rawMessage =
    toText(data?.detail)
    || toText(data?.message)
    || toText(error?.message)
    || fallback;

  return humanizeErrorText(rawMessage) || fallback;
}
