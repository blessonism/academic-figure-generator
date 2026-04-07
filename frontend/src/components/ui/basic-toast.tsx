import { Portal } from '@ark-ui/react/portal';
import { Toast, Toaster, createToaster } from '@ark-ui/react/toast';
import { X } from 'lucide-react';

const toaster = createToaster({
  placement: 'bottom-end',
  gap: 16,
  overlap: true,
});

export default function ToastBasic() {
  return (
    <div className="flex w-full flex-col items-center rounded-xl bg-white px-4 py-12 dark:bg-gray-800">
      <button
        type="button"
        onClick={() =>
          toaster.create({
            title: 'Welcome!',
            description: 'Your account has been created successfully.',
            type: 'success',
          })
        }
        className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        Show Toast
      </button>

      <Portal>
        <Toaster toaster={toaster}>
          {(toast) => (
            <Toast.Root
              className="relative min-w-[20rem] rounded-lg border border-gray-100 bg-white p-4 shadow-md break-words transition-all duration-300 ease-out will-change-transform h-[var(--height)] opacity-[var(--opacity)] translate-x-[var(--x)] translate-y-[var(--y)] scale-[var(--scale)] z-[var(--z-index)]"
            >
              <Toast.Title className="text-sm font-semibold text-gray-900">
                {toast.title}
              </Toast.Title>
              <Toast.Description className="mt-1 text-sm text-gray-600">
                {toast.description}
              </Toast.Description>
              <Toast.CloseTrigger
                aria-label="关闭提示"
                className="absolute right-3 top-3 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Toast.CloseTrigger>
            </Toast.Root>
          )}
        </Toaster>
      </Portal>
    </div>
  );
}
