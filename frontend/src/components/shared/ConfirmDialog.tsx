import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void | boolean> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirmClick = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Keep dialog open if operation throws
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy="confirm-dialog-title">
      <DialogHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-coral/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-coral" aria-hidden />
          </div>
          <div>
            <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="coral"
          disabled={loading}
          onClick={handleConfirmClick}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing…
            </span>
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
