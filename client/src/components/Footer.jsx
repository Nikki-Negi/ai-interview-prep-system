export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-gray-500 sm:px-6 lg:px-8">
        <p className="font-semibold text-gray-700">AI Interview Prep</p>
        <p>Practice smarter, build confidence, and sharpen every answer.</p>
        <p>© {new Date().getFullYear()} AI Interview Prep</p>
      </div>
    </footer>
  )
}



