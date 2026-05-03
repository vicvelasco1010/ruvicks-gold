import { ExternalLink, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QUICK_SERVICES, getServiceUrl } from '../config/services'

type Props = { serviceId: string }

export function ServicePage({ serviceId }: Props) {
  const service = QUICK_SERVICES.find((s) => s.id === serviceId)
  if (!service) {
    return (
      <p className="text-zinc-400">
        Unknown service. <Link to="/" className="text-violet-400 hover:underline">Back home</Link>
      </p>
    )
  }

  const url = getServiceUrl(service)
  const Icon = service.icon

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link to="/" className="text-sm text-violet-400 hover:underline">
          ← Dashboard
        </Link>
        <div className="mt-6 flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-2xl ring-1 ring-white/10">
            {service.emoji}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{service.title}</h1>
            <p className="mt-2 text-zinc-400">{service.description}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        {url ? (
          <>
            <p className="text-sm text-zinc-300">
              Your environment points this tile to your live instance. Open it in a new tab
              (most media apps block embedding).
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:brightness-110"
            >
              <ExternalLink className="size-4" />
              Open {service.title}
            </a>
            <p className="mt-3 break-all text-xs text-zinc-500">{url}</p>
          </>
        ) : (
          <>
            <div className="flex gap-3 text-amber-200/90">
              <Link2 className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">No URL configured yet</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Add <code className="rounded bg-black/40 px-1.5 py-0.5 text-violet-300">{service.envKey}</code> to
                  your <code className="rounded bg-black/40 px-1.5 py-0.5">.env</code> file, then restart{' '}
                  <code className="rounded bg-black/40 px-1.5 py-0.5">npm run dev</code>.
                </p>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-zinc-300">
              {`${service.envKey}=https://your-server.example`}
            </pre>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 text-zinc-500">
        <Icon className="size-5" aria-hidden />
        <span className="text-sm">Shortcut also available from the home grid.</span>
      </div>
    </div>
  )
}
