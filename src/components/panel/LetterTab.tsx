import { useState } from 'react'
import { latestResult } from '../../lib/ai'
import { plural } from '../../lib/dates'
import type { AiResult, Application } from '../../lib/types'
import type { TabId } from '../../pages/ApplicationPanel'
import { useTracker } from '../../state/TrackerProvider'
import type { AiActions } from '../../state/useAiActions'
import { CopyIcon } from '../icons'
import { useToast } from '../Toaster'
import { Button, TextArea } from '../ui'
import { AiBlockerNote, AiErrorNote, AiRunning } from './AiStatus'

interface Props {
  application: Application
  ai: AiActions
  onOpenTab(tab: TabId): void
}

export function LetterTab({ application, ai, onOpenTab }: Props) {
  const { aiResults } = useTracker()
  const letter = latestResult(aiResults, application.id, 'cover_letter')
  const disabled = ai.blocker !== null || ai.running !== null

  return (
    <div className="flex flex-col gap-5">
      <AiBlockerNote blocker={ai.blocker} onOpenVacancy={() => onOpenTab('vacancy')} />
      {ai.running === 'cover_letter' && <AiRunning text="AI пишет черновик письма. Обычно это 10–25 секунд." />}
      {ai.error?.kind === 'cover_letter' && <AiErrorNote message={ai.error.message} />}

      {letter ? (
        // key: a new draft resets the editor to its text.
        <LetterEditor key={letter.id} letter={letter} />
      ) : (
        ai.running !== 'cover_letter' && (
          <p className="text-sm text-ink-muted">
            AI напишет черновик cover letter под эту вакансию по фактам из твоего CV. Его можно
            отредактировать здесь же и скопировать в форму заявки.
          </p>
        )
      )}

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <Button
          variant={letter ? 'secondary' : 'primary'}
          disabled={disabled}
          busy={ai.running === 'cover_letter'}
          onClick={() => {
            if (letter && !window.confirm('Написать письмо заново? Текущий черновик заменит новый.')) return
            void ai.run('cover_letter')
          }}
        >
          {letter ? 'Написать заново' : 'Написать cover letter'}
        </Button>
      </div>
    </div>
  )
}

type LetterResult = Extract<AiResult, { kind: 'cover_letter' }>

function LetterEditor({ letter }: { letter: LetterResult }) {
  const { updateCoverLetter } = useTracker()
  const { notify } = useToast()
  const [text, setText] = useState(letter.content.text)
  const [saving, setSaving] = useState(false)
  const changed = text !== letter.content.text
  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  async function save() {
    setSaving(true)
    try {
      await updateCoverLetter(letter.id, text)
      notify('Письмо сохранено')
    } catch (e) {
      notify(`Не удалось сохранить: ${e instanceof Error ? e.message : e}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      notify('Письмо скопировано')
    } catch {
      notify('Не получилось скопировать: выдели текст и скопируй вручную.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <TextArea
        label="Черновик cover letter"
        hint={`${words} ${plural(words, ['слово', 'слова', 'слов'])}. Проверь факты и добавь свои детали перед отправкой.`}
        rows={18}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" disabled={!changed} busy={saving} onClick={save}>
          Сохранить правки
        </Button>
        <Button onClick={copy}>
          <CopyIcon />
          Скопировать
        </Button>
      </div>
    </div>
  )
}
