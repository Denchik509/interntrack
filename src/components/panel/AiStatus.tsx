import { Link } from 'react-router'
import type { AiBlocker } from '../../state/useAiActions'
import { Spinner } from '../ui'

/** Explains why the AI buttons are disabled and what to do about it. */
export function AiBlockerNote({ blocker, onOpenVacancy }: { blocker: AiBlocker; onOpenVacancy(): void }) {
  if (!blocker) return null
  return (
    <div className="rounded-[10px] border border-line bg-surface-muted px-4 py-3 text-sm">
      {blocker === 'demo' && (
        <p>
          В демо-режиме AI не запускается: запрос к Claude стоит денег, поэтому он доступен только в
          аккаунте. Готовые примеры анализа есть у Northwind Labs и Vertex Cloud.
        </p>
      )}
      {blocker === 'vacancy' && (
        <p>
          Добавь текст вакансии, хотя бы пару абзацев: AI сравнивает с CV именно его.{' '}
          <button type="button" onClick={onOpenVacancy} className="font-medium text-accent-ink underline underline-offset-2">
            Открыть вкладку «Вакансия»
          </button>
        </p>
      )}
      {blocker === 'cv' && (
        <p>
          Заполни CV: AI сравнивает вакансию с ним.{' '}
          <Link to="/cv" className="font-medium text-accent-ink">
            Перейти к CV
          </Link>
        </p>
      )}
    </div>
  )
}

export function AiRunning({ text }: { text: string }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-[10px] bg-accent-soft px-4 py-3 text-sm text-accent-ink">
      <Spinner className="size-5 flex-none" />
      <span>{text}</span>
    </div>
  )
}

export function AiErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-[10px] bg-tone-red-bg px-4 py-3 text-sm text-tone-red-fg">
      {message}
    </p>
  )
}
