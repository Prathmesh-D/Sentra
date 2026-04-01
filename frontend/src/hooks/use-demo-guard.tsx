import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function useDemoGuard() {
  const { isDemo } = useAuth();

  const triggerDemoBlock = () => {
    if (!isDemo) return false;

    const toastId = `demo-guard-${Date.now()}`;

    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? 'animate-in fade-in zoom-in-95 duration-200' : 'animate-out fade-out zoom-out-95 duration-150'} bg-white w-[360px] rounded-xl border border-amber-200 shadow-xl p-4`}
          role="dialog"
          aria-label="Demo mode restriction"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg">🔒</div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">Not available in Demo Mode</h3>
              <p className="text-sm text-gray-600 mt-1">Sign up to unlock all account settings.</p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Keep Exploring
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      { id: toastId, duration: 6000, position: 'top-center' }
    );

    return true;
  };

  return { triggerDemoBlock };
}
