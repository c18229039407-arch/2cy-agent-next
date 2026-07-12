// 2CY: 侧栏常驻人设卡 —— 她的头像与人设一直在场。
// 无角色卡时整块隐藏（不打扰未设置人设的用户）。
import { createResource, Show } from "solid-js"

type Card = {
  name: string
  source?: string
  personality?: string
  quirk?: string
  avatar?: string
}

async function fetchCard(): Promise<Card | null> {
  try {
    const res = await fetch("/2cy/character")
    if (!res.ok) return null
    return (await res.json()) as Card | null
  } catch {
    return null
  }
}

export function CharacterCardPanel() {
  const [card] = createResource(fetchCard)
  return (
    <Show when={card()}>
      {(c) => (
        <div data-slot="2cy-character-card">
          <Show
            when={c().avatar}
            fallback={
              <div data-slot="2cy-character-avatar" data-empty="true">
                {c().name.slice(0, 1)}
              </div>
            }
          >
            {(src) => <img data-slot="2cy-character-avatar" src={src()} alt={c().name} />}
          </Show>
          <div data-slot="2cy-character-meta">
            <div data-slot="2cy-character-name">{c().name}</div>
            <Show when={c().source}>
              {(s) => <div data-slot="2cy-character-source">《{s()}》</div>}
            </Show>
            <Show when={c().quirk ?? c().personality}>
              {(line) => <div data-slot="2cy-character-line">{line()}</div>}
            </Show>
          </div>
        </div>
      )}
    </Show>
  )
}
