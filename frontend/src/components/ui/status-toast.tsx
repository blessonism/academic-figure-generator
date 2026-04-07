import { useEffect, useRef, useState } from 'react';
import { Portal } from '@ark-ui/react/portal';
import { Toast, Toaster, createToaster } from '@ark-ui/react/toast';
import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

import type { StudioStatusMessage } from '@/studio/types';
import { cn } from '@/lib/utils';

interface StatusToastProps {
  message: StudioStatusMessage | null;
  onClose: () => void;
}

const statusToaster = createToaster({
  placement: 'bottom-end',
  gap: 16,
  overlap: true,
});

const MAX_COLLAPSED_VISIBLE_TOASTS = 3;

function getToastTitle(status: StudioStatusMessage['status']) {
  if (status === 'completed') {
    return '操作完成';
  }

  if (status === 'running') {
    return '处理中';
  }

  return '操作失败';
}

function getToastType(status: StudioStatusMessage['status']): 'success' | 'loading' | 'error' {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'running') {
    return 'loading';
  }

  return 'error';
}

function getToastIcon(type?: string) {
  switch (type) {
    case 'loading':
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
        </div>
      );
    case 'success':
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
          <AlertCircle className="h-4 w-4 text-rose-600" />
        </div>
      );
  }
}

export function StatusToast({ message, onClose }: StatusToastProps) {
  const latestToastIdRef = useRef<string | null>(null);
  const lastQueuedSignatureRef = useRef<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    return () => {
      statusToaster.remove();
      latestToastIdRef.current = null;
      lastQueuedSignatureRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!message) {
      const activeToastId = latestToastIdRef.current;
      latestToastIdRef.current = null;
      lastQueuedSignatureRef.current = null;

      if (activeToastId) {
        statusToaster.remove(activeToastId);
      }

      return;
    }

    const signature = `${message.status}:${message.detail}`;
    if (lastQueuedSignatureRef.current === signature) {
      return;
    }

    lastQueuedSignatureRef.current = signature;

    const activeToastId = latestToastIdRef.current;
    if (activeToastId) {
      const activeToast = statusToaster
        .getVisibleToasts()
        .find((item) => item.id === activeToastId);

      if (activeToast?.type === 'loading') {
        latestToastIdRef.current = null;
        statusToaster.remove(activeToastId);
      }
    }

    queueMicrotask(() => {
      let toastId = '';
      toastId = statusToaster.create({
        title: getToastTitle(message.status),
        description: message.detail,
        type: getToastType(message.status),
        duration: message.status === 'running' ? Number.POSITIVE_INFINITY : 4500,
        closable: true,
        onStatusChange: ({ status }) => {
          if (status !== 'unmounted' || latestToastIdRef.current !== toastId) {
            return;
          }

          latestToastIdRef.current = null;
          onClose();
        },
      });

      latestToastIdRef.current = toastId;
    });
  }, [message, onClose]);

  return (
    <Portal>
      <Toaster
        toaster={statusToaster}
        data-testid="status-toast-region"
        className="pointer-events-none"
        onMouseEnter={() => {
          setIsExpanded(true);
          statusToaster.pause();
          statusToaster.expand();
        }}
        onMouseLeave={() => {
          setIsExpanded(false);
          statusToaster.resume();
          statusToaster.collapse();
        }}
      >
        {(toast) => {
          const visibleToasts = statusToaster.getVisibleToasts();
          const toastCount = visibleToasts.length;
          const depth = visibleToasts.findIndex((item) => item.id === toast.id);
          const isCollapsedHidden =
            !isExpanded
            && toastCount > MAX_COLLAPSED_VISIBLE_TOASTS
            && depth >= MAX_COLLAPSED_VISIBLE_TOASTS;

          return (
            <Toast.Root
              role="alert"
              data-collapsed-hidden={isCollapsedHidden}
              data-stack-depth={depth}
              className={cn(
                'pointer-events-auto relative min-w-[20rem] rounded-lg border bg-white p-4 shadow-xl break-words transition-all duration-300 ease-out will-change-transform',
                'w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] sm:min-w-[28rem]',
                'h-[var(--height)] opacity-[var(--opacity)] translate-x-[var(--x)] translate-y-[var(--y)] scale-[var(--scale)] z-[var(--z-index)]',
                toast.type === 'error'
                  ? 'border-rose-100'
                  : toast.type === 'success'
                    ? 'border-emerald-100'
                    : 'border-sky-100',
              )}
              style={isCollapsedHidden ? { opacity: 0, pointerEvents: 'none' } : undefined}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0">{getToastIcon(toast.type)}</div>
                <div className="flex-1 pr-6">
                  <Toast.Title className="text-sm font-semibold text-slate-900">
                    {toast.title}
                  </Toast.Title>
                  <Toast.Description className="mt-1 text-sm leading-5 text-slate-600">
                    {toast.description}
                  </Toast.Description>
                </div>
              </div>
              <Toast.CloseTrigger
                aria-label="关闭提示"
                className="absolute right-3 top-3 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                onClick={() => {
                  if (latestToastIdRef.current === toast.id) {
                    onClose();
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Toast.CloseTrigger>
            </Toast.Root>
          );
        }}
      </Toaster>
    </Portal>
  );
}
