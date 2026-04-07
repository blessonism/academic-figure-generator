import { Portal } from '@ark-ui/react/portal';
import { Toast, Toaster, createToaster } from '@ark-ui/react/toast';
import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

const toaster = createToaster({
  overlap: true,
  placement: 'bottom-end',
  gap: 16,
});

const uploadFile = () =>
  new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      Math.random() > 0.5 ? resolve() : reject(new Error('Upload failed'));
    }, 2000);
  });

export default function ToastPromiseDemo() {
  const handleUpload = async () => {
    const toastId = toaster.create({
      title: 'Uploading file...',
      description: 'Please wait while we upload your file.',
      type: 'loading',
      duration: Number.POSITIVE_INFINITY,
    });

    try {
      await uploadFile();
      toaster.update(toastId, {
        title: 'Upload successful!',
        description: 'Your file has been uploaded successfully.',
        type: 'success',
        duration: 5000,
      });
    } catch {
      toaster.update(toastId, {
        title: 'Upload failed',
        description: 'Something went wrong. Please try again.',
        type: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex w-full flex-col items-center rounded-xl bg-white px-4 py-12 dark:bg-gray-800">
      <button
        type="button"
        onClick={handleUpload}
        className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        Upload File
      </button>

      <Portal>
        <Toaster toaster={toaster}>
          {(toast) => {
            const icon =
              toast.type === 'loading' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              ) : toast.type === 'success' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
              );

            return (
              <Toast.Root
                className="relative min-w-[20rem] rounded-lg border bg-white p-4 shadow-xl break-words transition-all duration-300 ease-out will-change-transform h-[var(--height)] opacity-[var(--opacity)] translate-x-[var(--x)] translate-y-[var(--y)] scale-[var(--scale)] z-[var(--z-index)]"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">{icon}</div>
                  <div className="flex-1">
                    <Toast.Title className="text-sm font-semibold text-gray-900">
                      {toast.title}
                    </Toast.Title>
                    <Toast.Description className="mt-1 text-sm text-gray-600">
                      {toast.description}
                    </Toast.Description>
                  </div>
                </div>
                <Toast.CloseTrigger
                  aria-label="关闭提示"
                  className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Toast.CloseTrigger>
              </Toast.Root>
            );
          }}
        </Toaster>
      </Portal>
    </div>
  );
}
