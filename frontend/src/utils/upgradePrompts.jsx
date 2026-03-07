import { toast } from 'react-hot-toast';

export const showUpgradeToProPrompt = ({
    message,
    onUpgrade,
    ctaLabel = 'Upgrade to Pro',
}) => {
    toast.custom(
        (t) => (
            <div className="w-[360px] max-w-[95vw] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
                <p className="text-sm text-amber-800">{message}</p>
                {typeof onUpgrade === 'function' && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.dismiss(t.id);
                            onUpgrade();
                        }}
                        className="mt-3 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                        {ctaLabel}
                    </button>
                )}
            </div>
        ),
        { duration: 5000 }
    );
};
