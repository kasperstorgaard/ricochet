import type { DialogHTMLAttributes } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { clsx } from "clsx/lite";

type Props = DialogHTMLAttributes<HTMLDialogElement>;

export function Dialog({ open, className, children, ...rest }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.close();
    if (open) ref.current?.showModal();
  }, [open]);

  return (
    <dialog
      ref={ref}
      open={open}
      data-modal
      className={clsx(
        "m-auto rounded-cond-3 max-w-lg shadow-4 z-5",
        className,
      )}
      {...rest}
    >
      <div className="flex flex-col gap-fl-3 p-fl-3">
        {children}
      </div>
    </dialog>
  );
}
