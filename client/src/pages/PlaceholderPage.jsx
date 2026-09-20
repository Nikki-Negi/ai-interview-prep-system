export default function PlaceholderPage({ title }) {
  return (
    <div className="bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto w-full max-w-7xl">
        <section className="rounded-md border border-gray-200 bg-white px-6 py-10 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            {title}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500">
            Coming soon.
          </p>
        </section>
      </div>
    </div>
  )
}


