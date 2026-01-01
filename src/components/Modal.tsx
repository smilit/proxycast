import { useEffect, type ReactNode, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Modal 内容区的额外 className */
  className?: string;
  /** 是否显示关闭按钮，默认 true */
  showCloseButton?: boolean;
  /** 点击遮罩是否关闭，默认 true */
  closeOnOverlayClick?: boolean;
  /** 内容区最大宽度，默认 max-w-lg */
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
  maxWidth = "max-w-lg",
}: ModalProps) {
  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        className={`relative w-full ${maxWidth} rounded-lg bg-background shadow-xl ${className}`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Modal 标题区 */
export function ModalHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b px-6 py-4 ${className}`}>
      <h2 className="text-lg font-semibold">{children}</h2>
    </div>
  );
}

/** Modal 内容区 */
export function ModalBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

/** Modal 底部操作区 */
export function ModalFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex justify-end gap-2 border-t px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}
