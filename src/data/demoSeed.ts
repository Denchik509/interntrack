import { addDays } from '../lib/dates'
import type { AiResult, Application, ApplicationEvent, CvVersion, EventType, Status } from '../lib/types'
import type { TrackerData } from './repository'

// Sample data for demo mode. The companies and the CV are made up.
// Dates are counted from today, so the deadlines always look current.

const SAMPLE_CV = `Alex Taylor — BSc Artificial Intelligence, 2nd year, University of Manchester

EXPERIENCE
Full-Stack Developer (part-time), Brightlane Studio — Sep 2025 to present
- Build client dashboards in React and TypeScript with a Node.js API
- Moved a reporting page from REST polling to WebSockets; load time fell from 6 s to 1.5 s
- Work in a team of 5 with Git, code review and two-week sprints

PROJECTS
- StudyBuddy: a revision assistant that calls an LLM API to turn lecture notes into quizzes (React, Node.js)
- InternTrack: an internship tracker with Supabase, Row Level Security and an AI job-posting analysis

SKILLS
TypeScript, JavaScript, React, Node.js, SQL (PostgreSQL), Python (pandas, scikit-learn basics), Git

EDUCATION
BSc Artificial Intelligence, University of Manchester, 2024–2027. Modules: Machine Learning, Algorithms, Databases`

const NORTHWIND_POSTING = `AI Engineer Intern (Summer 2027) — Northwind Labs, London

Northwind Labs builds AI assistants for logistics teams. As an intern you will join the applied AI team for 12 weeks.

What you will do
- Build internal tools in TypeScript and React that let operators review model outputs
- Prototype features that call large language models and measure their quality
- Train and evaluate small models in Python with PyTorch

What we look for
- Studying Computer Science, AI or a related degree
- Experience with TypeScript or Python
- Familiarity with Git and working in a team
- Any experience with PyTorch or another ML framework is a plus
- A project where you trained or fine-tuned a model is a strong plus`

const VERTEX_POSTING = `Software Engineer Intern — Vertex Cloud, London (hybrid)

Join the developer platform team and ship features used by thousands of engineers.
- Write production code in TypeScript and Go
- Work on APIs, dashboards and internal tooling
- Pair with a mentor and present your project at the end of the internship
Requirements: a CS-related degree in progress, solid programming fundamentals, experience with web development.`

interface SeedApplication {
  company: string
  role: string
  location: string | null
  job_url?: string
  /** Days from today; negative = in the past. */
  deadlineIn?: number
  appliedDaysAgo?: number
  job_description?: string
  notes?: string
  /** Status history: [status, days ago], oldest first. The last one is the current status. */
  history: [Status, number][]
  /** Notes in the history: [text, days ago]. */
  historyNotes?: [string, number][]
}

const SEED: SeedApplication[] = [
  {
    company: 'Northwind Labs',
    role: 'AI Engineer Intern',
    location: 'Лондон',
    job_url: 'https://example.com/jobs/northwind-ai-intern',
    deadlineIn: 2,
    job_description: NORTHWIND_POSTING,
    history: [['wishlist', 4]],
  },
  {
    company: 'Helix Data',
    role: 'Data Science Intern',
    location: 'Удалённо',
    deadlineIn: 6,
    history: [['wishlist', 3]],
  },
  {
    company: 'Orbit Systems',
    role: 'Software Engineer Intern',
    location: 'Лондон',
    deadlineIn: 21,
    history: [['wishlist', 1]],
  },
  {
    company: 'Bluebird AI',
    role: 'ML Research Intern',
    location: 'Кембридж',
    appliedDaysAgo: 7,
    history: [
      ['wishlist', 12],
      ['applied', 7],
    ],
  },
  {
    company: 'Kestrel Bank',
    role: 'Technology Intern',
    location: 'Лондон',
    appliedDaysAgo: 9,
    history: [
      ['wishlist', 15],
      ['applied', 9],
    ],
  },
  {
    company: 'Acme Robotics',
    role: 'Software Engineer Intern',
    location: 'Бристоль',
    appliedDaysAgo: 14,
    history: [
      ['wishlist', 20],
      ['applied', 14],
    ],
  },
  {
    company: 'Lumen Health',
    role: 'Data Engineer Intern',
    location: 'Лондон',
    appliedDaysAgo: 18,
    deadlineIn: 3,
    history: [
      ['wishlist', 24],
      ['applied', 18],
      ['test', 2],
    ],
    historyNotes: [['Пришла ссылка на онлайн-тест: SQL и Python, 90 минут', 2]],
  },
  {
    company: 'Pinecrest Games',
    role: 'Frontend Intern',
    location: 'Гилфорд',
    appliedDaysAgo: 21,
    history: [
      ['wishlist', 28],
      ['applied', 21],
      ['test', 10],
    ],
    historyNotes: [['Тест сдан, жду ответ', 6]],
  },
  {
    company: 'Vertex Cloud',
    role: 'Software Engineer Intern',
    location: 'Лондон',
    appliedDaysAgo: 25,
    deadlineIn: 8,
    job_description: VERTEX_POSTING,
    notes: 'Интервью с тимлидом платформенной команды, 45 минут, онлайн.',
    history: [
      ['wishlist', 32],
      ['applied', 25],
      ['test', 16],
      ['interview', 5],
    ],
  },
  {
    company: 'Tideline',
    role: 'AI Product Intern',
    location: 'Эдинбург',
    appliedDaysAgo: 20,
    deadlineIn: 16,
    history: [
      ['wishlist', 26],
      ['applied', 20],
      ['interview', 3],
    ],
  },
  {
    company: 'Cobalt Studio',
    role: 'Frontend Intern',
    location: 'Лондон',
    appliedDaysAgo: 40,
    deadlineIn: 14,
    history: [
      ['wishlist', 45],
      ['applied', 40],
      ['test', 30],
      ['interview', 20],
      ['offer', 2],
    ],
  },
  {
    company: 'Granite Capital',
    role: 'Quant Intern',
    location: 'Лондон',
    appliedDaysAgo: 30,
    history: [
      ['wishlist', 35],
      ['applied', 30],
      ['test', 19],
      ['rejected', 9],
    ],
  },
]

/** A timestamp `daysAgo` days before `today`, at a fixed time of day. */
function timestamp(today: string, daysAgo: number, hour = 12): string {
  const [y, m, d] = addDays(today, -daysAgo).split('-').map(Number)
  return new Date(y, m - 1, d, hour, 0).toISOString()
}

export function createDemoData(today: string, newId: () => string): TrackerData {
  const applications: Application[] = []
  const events: ApplicationEvent[] = []
  const aiResults: AiResult[] = []
  const byCompany = new Map<string, Application>()

  for (const seed of SEED) {
    const id = newId()
    const created = timestamp(today, seed.history[0][1], 10)
    const lastChange = seed.history[seed.history.length - 1]
    const application: Application = {
      id,
      company: seed.company,
      role: seed.role,
      job_url: seed.job_url ?? null,
      location: seed.location,
      status: lastChange[0],
      deadline: seed.deadlineIn === undefined ? null : addDays(today, seed.deadlineIn),
      applied_at: seed.appliedDaysAgo === undefined ? null : addDays(today, -seed.appliedDaysAgo),
      job_description: seed.job_description ?? null,
      notes: seed.notes ?? null,
      created_at: created,
      updated_at: timestamp(today, lastChange[1], 11),
    }
    applications.push(application)
    byCompany.set(seed.company, application)

    const history: [EventType, number, string | null][] = [
      ...seed.history.map(([status, daysAgo]): [EventType, number, null] => [status, daysAgo, null]),
      ...(seed.historyNotes ?? []).map(([note, daysAgo]): [EventType, number, string] => [
        'note',
        daysAgo,
        note,
      ]),
    ]
    for (const [type, daysAgo, note] of history) {
      events.push({
        id: newId(),
        application_id: id,
        type,
        happened_at: timestamp(today, daysAgo, type === 'note' ? 15 : 11),
        note,
      })
    }
  }

  const northwind = byCompany.get('Northwind Labs')!
  const vertex = byCompany.get('Vertex Cloud')!

  aiResults.push(
    {
      id: newId(),
      application_id: northwind.id,
      kind: 'analysis',
      cv_title: 'Основное',
      created_at: timestamp(today, 2, 18),
      content: {
        matches: [
          'React и TypeScript: коммерческий опыт в Brightlane Studio',
          'Git и работа в команде из 5 человек с код-ревью',
          'Профильная учёба: BSc Artificial Intelligence',
          'Проект StudyBuddy с вызовом LLM API',
        ],
        gaps: [
          'Опыт с PyTorch или другой ML-библиотекой',
          'Проект с обученной моделью в портфолио',
        ],
        highlights: [
          'Работу Full-Stack разработчиком параллельно с учёбой',
          'Собственные проекты с вызовом LLM API',
          'Ускорение страницы отчётов с 6 до 1,5 секунды',
        ],
      },
    },
    {
      id: newId(),
      application_id: vertex.id,
      kind: 'analysis',
      cv_title: 'Основное',
      created_at: timestamp(today, 20, 18),
      content: {
        matches: [
          'Веб-разработка на TypeScript и React',
          'Профильная учёба в процессе',
          'Опыт работы с API на Node.js',
        ],
        gaps: ['Опыт с Go'],
        highlights: [
          'Переход отчётов с REST на WebSockets и измеримый результат',
          'Командный процесс: спринты и код-ревью',
        ],
      },
    },
    {
      id: newId(),
      application_id: vertex.id,
      kind: 'cover_letter',
      cv_title: 'Основное',
      created_at: timestamp(today, 20, 19),
      content: {
        text: `Dear Hiring Team,

I am a second-year BSc Artificial Intelligence student at the University of Manchester, and I would love to join Vertex Cloud as a Software Engineer Intern on the developer platform team.

For the past year I have worked part-time as a full-stack developer at Brightlane Studio, building client dashboards in React and TypeScript on top of a Node.js API. One project I am proud of: I moved a reporting page from REST polling to WebSockets, which cut its load time from six seconds to one and a half. Working in a five-person team with code review and two-week sprints taught me to ship small, well-tested changes.

Outside work I build tools that call large language models, such as StudyBuddy, which turns lecture notes into quizzes. Building tools for other people is exactly what draws me to a developer platform team.

I have not used Go yet, and I would be glad to learn it with a mentor during the internship. Thank you for considering my application.

Kind regards,
Alex Taylor`,
      },
    },
  )

  const cv: CvVersion = {
    id: newId(),
    title: 'Основное',
    content: SAMPLE_CV,
    updated_at: timestamp(today, 30, 9),
  }

  events.sort((a, b) => a.happened_at.localeCompare(b.happened_at))
  return { applications, events, aiResults, cv }
}
