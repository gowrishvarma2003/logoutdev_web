import Dialog from "./Dialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

/**
 * Minimal, reusable centered dialog shell matching the app's existing
 * portal-based confirmation modal style (see Sidebar/MobileNav logout modals).
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClassName = "max-w-sm",
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClassName={maxWidthClassName}
    >
      {children}
    </Dialog>
  );
}
