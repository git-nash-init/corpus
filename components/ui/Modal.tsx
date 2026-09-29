"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "drawer" slides in from the right; "dialog" is centred. */
  variant?: "dialog" | "drawer";
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Built on the native <dialog>: focus is trapped, Escape closes it, and the rest of the page is inert.
 * Content mounts only while open so forms always start fresh.
 */
export function Modal({ open, onClose, title, description, variant = "dialog", children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const drawer = variant === "drawer";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-[var(--scrim)] backdrop:backdrop-blur-[6px]"
    >
      {open ? (
        <div className={`flex h-full w-full ${drawer ? "justify-end" : "items-center justify-center p-4"}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            initial={reduce ? false : drawer ? { x: 48, opacity: 0 } : { y: 16, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`glass flex flex-col ${drawer ? "h-full w-full max-w-[520px] rounded-none" : "max-h-[90dvh] w-full max-w-[520px] rounded-[6px]"}`}
            style={{ background: "color-mix(in srgb, var(--bg-raised) 88%, transparent)" }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line p-6">
              <div>
                <h2 id="modal-title" className="text-[26px]">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-icon btn-sm" aria-label="Close">
                <X size={20} weight="light" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
            {footer ? <footer className="flex flex-wrap justify-end gap-3 border-t border-line p-6">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </dialog>
  );
}
