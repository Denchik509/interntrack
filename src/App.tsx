function App() {
  return (
    <div className="flex min-h-svh flex-col bg-gray-100 text-gray-900 antialiased">
      <header className="flex items-center gap-2.5 border-b border-gray-200 bg-white px-4 py-3 sm:px-8">
        <svg
          aria-hidden="true"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
        >
          <rect width="28" height="28" rx="8" className="fill-accent" />
          <path d="M8 9h4v10H8zM16 9h4v6h-4z" fill="#fff" />
        </svg>
        <span className="text-[17px] font-bold">InternTrack</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-2xl font-bold">Трекер заявок на стажировки</h1>
        <p className="text-sm text-gray-600">
          Скоро здесь появится доска с заявками.
        </p>
      </main>
    </div>
  )
}

export default App
