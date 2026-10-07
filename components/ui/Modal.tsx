"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "drawer" slides in from the right on large screens; "dialog" is centred. Both become bottom sheets on phones. */
  variant?: "dialog" | "drawer";
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Built on the native <dialog>: focus is trapped, Escape closes it, and the rest of the page is inert.
 * Content mounts only while open so forms always start fresh. On phones it is a bottom sheet.
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
  const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

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
        <div
          className={`flex h-full w-full items-end ${drawer ? "sm:items-stretch sm:justify-end" : "sm:items-center sm:justify-center sm:p-4"}`}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={reduce ? false : mobile ? { y: "100%" } : drawer ? { x: 48, opacity: 0 } : { y: 16, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`glass flex w-full flex-col rounded-t-[6px] sm:max-w-[520px] sm:rounded-[6px] ${
              drawer ? "max-h-[92dvh] sm:h-full sm:max-h-none sm:rounded-none" : "max-h-[92dvh] sm:max-h-[90dvh]"
            }`}
            style={{ background: "color-mix(in srgb, var(--bg-raised) 92%, transparent)" }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
              <div>
                <h2 id="modal-title" className="text-[24px] sm:text-[26px]">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-icon btn-sm shrink-0" aria-label="Close">
                <X size={20} weight="light" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
            {footer ? <footer className="flex flex-wrap justify-end gap-3 border-t border-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </dialog>
  );
}
