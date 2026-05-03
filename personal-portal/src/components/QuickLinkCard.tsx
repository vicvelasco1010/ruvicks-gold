import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { QuickService } from '../config/services'
import { getServiceUrl } from '../config/services'

type Props = { service: QuickService }

export function QuickLinkCard({ service }: Props) {
  const { title, description, path, icon: Icon, emoji } = service
  const external = getServiceUrl(service)

  return (
    <Link
      to={path}
      className="group relative flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] outline-none transition hover:border-violet-400/35 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-violet-400/60"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 text-lg ring-1 ring-white/10"
          aria-hidden
        >
          {emoji ? <span className="select-none">{emoji}</span> : <Icon className="size-5 text-violet-200" />}
        </span>
        <ChevronRight className="size-5 shrink-0 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p>
        {external && (
          <p className="mt-2 text-xs text-emerald-400/90">External URL configured</p>
        )}
      </div>
    </Link>
  )
}
