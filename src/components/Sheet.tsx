import { useEffect, useRef, type ReactNode } from 'react'

interface SheetProps {
  /** id of the heading inside, read by screen readers as the dialog name. */
  labelledBy: string
  onClose(): void
  /** 'side': panel on the right (the application card). 'center': a form. */
  placement: 'side' | 'center'
  children: ReactNode
}

const PLACEMENT: Record<SheetProps['placement'], string> = {
  side: 'md:ml-auto md:mr-0 md:max-w-[600px] md:border-l md:border-line',
  center: 'md:m-auto md:h-auto md:max-h-[calc(100dvh-4rem)] md:max-w-xl md:rounded-xl',
}

/**
 * A modal window built on the browser's <dialog> element. showModal() gives
 * a lot for free: focus stays inside, Esc closes it, the page behind is
 * inert. On phones it covers the whole screen.
 */
export function Sheet({ labelledBy, onClose, placement, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      // Esc: let React Router close it by changing the address.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // A click on the dimmed backdrop lands on the <dialog> itself.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={`m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-surface p-0 text-ink ${PLACEMENT[placement]}`}
    >
      <div className="flex h-full max-h-[inherit] flex-col">{children}</div>
    </dialog>
  )
}
