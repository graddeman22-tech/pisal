import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SuccessModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  orderId?: number | string;
  onClose: () => void;
  onContinue?: () => void;
  autoCloseDuration?: number;
}

export function SuccessModal({
  isOpen,
  title = "Order Placed Successfully!",
  message = "Your order has been confirmed. You will receive updates on your phone shortly.",
  orderId,
  onClose,
  onContinue,
  autoCloseDuration = 5000,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoCloseDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
            <CheckCircle2 className="w-16 h-16 text-green-500 relative" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {message}
          </p>
          {orderId && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Order ID</p>
              <p className="font-mono font-bold text-sm text-primary">#{orderId}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {onContinue && (
            <Button
              onClick={onContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-medium"
            >
              Continue Shopping
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full rounded-xl h-11 font-medium"
          >
            Close
          </Button>
        </div>

        {/* Timer indicator */}
        {autoCloseDuration && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            This modal will close automatically
          </p>
        )}
      </div>
    </div>
  );
}
