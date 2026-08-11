import { ChevronLeft } from './icons'

export default function TopBar({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-6 pb-2">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0"
        >
          <ChevronLeft />
        </button>
      )}
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  )
}
