export default function PlaceholderPage({ title }) {
  return (
    <div className="bg-gray-950 px-4 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-md border border-gray-800 bg-gray-900 px-6 py-10 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            {title}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Coming soon.
          </p>
        </section>
      </div>
    </div>
  )
}
