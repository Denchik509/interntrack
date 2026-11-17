interface BarRow {
  label: string
  value: number
  /** Text after the value, e.g. "75%". */
  note?: string
  /** Sentence shown on hover/focus, e.g. "3 из 4 отправленных заявок дошли до теста". */
  detail: string
}

interface Props {
  caption: string
  rows: BarRow[]
  /** Value of a full-width bar; defaults to the largest value. */
  max?: number
}

/**
 * A horizontal bar chart drawn with plain HTML. It is a real <table>, so a
 * screen reader reads it as rows of "stage — number"; the bars are only
 * the visual layer on top. One color, a value at the tip of every bar
 * (there are at most five), no legend needed: the caption names the data.
 */
export function BarChart({ caption, rows, max }: Props) {
  const top = Math.max(max ?? 0, ...rows.map((r) => r.value), 1)

  return (
    <table className="w-full border-separate border-spacing-y-1.5 text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Этап</th>
          <th scope="col">Количество</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} tabIndex={0} className="group outline-none">
            <th
              scope="row"
              className="w-28 pr-3 text-left align-middle font-medium text-ink-muted group-hover:text-ink group-focus-visible:text-ink sm:w-36"
            >
              {row.label}
            </th>
            <td className="relative align-middle">
              <div className="flex items-center gap-2 border-l border-line-strong py-1 pr-2 group-hover:bg-surface-muted group-focus-visible:bg-surface-muted">
                <div
                  className="h-5 rounded-r bg-chart transition-[width]"
                  style={{ width: `calc((100% - 6rem) * ${row.value / top})` }}
                />
                <span className="font-semibold whitespace-nowrap text-ink tabular-nums">
                  {row.value}
                  {row.note && <span className="ml-1.5 font-normal text-ink-muted">{row.note}</span>}
                </span>
              </div>
              <span
                role="tooltip"
                className="pointer-events-none invisible absolute bottom-full left-2 z-10 w-max max-w-[calc(100%-0.5rem)] rounded-md bg-ink px-2.5 py-1 text-xs text-canvas shadow-md group-hover:visible group-focus-visible:visible"
              >
                {row.detail}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
