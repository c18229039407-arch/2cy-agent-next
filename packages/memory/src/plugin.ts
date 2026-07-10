// 2CY: 长期记忆插件 —— 走 opencode 官方插件口注册 remember 工具（零源码侵入）。
// 契约核实自 packages/plugin/src/tool.ts 与 example.ts：
//   Plugin = async (ctx) => ({ tool: { name: tool({ description, args, execute }) } })
// 存储先用本地 JSON（与旧版 data/memory.json 同构，便于老数据直迁）；
// Phase 3 迁 SQLite 时只需替换 store 实现，工具契约不变。

import { tool, type Plugin } from "@2cy/plugin"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

interface Fact {
  text: string
  from: string // 来源：sessionID 或 "manual"
  at: number
}
interface MemoryData {
  enabled: boolean
  profile: string
  facts: Fact[]
}

const FILE = path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"), "2cy", "memory.json")

async function load(): Promise<MemoryData> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"))
  } catch {
    return { enabled: true, profile: "", facts: [] }
  }
}
async function save(data: MemoryData): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  const tmp = FILE + ".tmp"
  await fs.writeFile(tmp, JSON.stringify(data, null, 2)) // 原子写入，沿用旧版习惯
  await fs.rename(tmp, FILE)
}

/** system prompt 组装链插入的 <memory> 区块。card 语义沿用旧版 buildSystemPrompt。 */
export async function compileMemoryBlock(maxFacts = 40): Promise<string | undefined> {
  const m = await load()
  if (!m.enabled || (!m.profile && m.facts.length === 0)) return undefined
  const lines = ["<memory>"]
  if (m.profile) lines.push("用户画像（由过往对话沉淀，可能不完整）：" + m.profile)
  if (m.facts.length) {
    lines.push("已记住的事实：")
    for (const f of m.facts.slice(-maxFacts)) lines.push("- " + f.text)
  }
  lines.push("（自然地运用这些记忆，不要生硬复述；如果记忆与用户当前所说矛盾，以用户当前所说为准。）", "</memory>")
  return lines.join("\n")
}

export const MemoryPlugin: Plugin = async (ctx) => {
  // 子会话判定缓存（父子关系不变，判定一次即可）
  const childCache = new Map<string, boolean>()
  async function isChildSession(sessionID: string): Promise<boolean> {
    const hit = childCache.get(sessionID)
    if (hit !== undefined) return hit
    try {
      const session = await ctx.client.session.get({ path: { id: sessionID } })
      const parentID = (session as { data?: { parentID?: string } }).data?.parentID
      const child = typeof parentID === "string" && parentID.length > 0
      childCache.set(sessionID, child)
      return child
    } catch {
      return false
    }
  }

  return {
    // 2CY: 长期记忆经官方钩子注入 system prompt；分身（子代理）不注入
    "experimental.chat.system.transform": async (input, output) => {
      if (input.sessionID && (await isChildSession(input.sessionID))) return
      const block = await compileMemoryBlock()
      if (block) output.system.push(block)
    },
    tool: {
      memory_list: tool({
        description:
          "列出当前记住的用户画像与全部事实（带编号）。当用户想查看、核对或整理你的记忆时使用。",
        args: {},
        async execute() {
          const m = await load()
          if (!m.enabled) return "记忆功能当前已关闭。"
          if (!m.profile && m.facts.length === 0) return "还没有任何记忆。"
          const lines: string[] = []
          if (m.profile) lines.push("【画像】" + m.profile)
          m.facts.forEach((f, i) => lines.push(`${i + 1}. ${f.text}`))
          return lines.join("\n")
        },
      }),
      memory_forget: tool({
        description:
          "忘掉一条已记住的事实。先用 memory_list 查看编号，再按编号删除。只在用户明确要求忘记某事时使用。",
        args: {
          index: tool.schema.number().int().min(1).describe("要忘掉的事实编号（memory_list 中的序号，从 1 开始）"),
        },
        async execute(args) {
          const m = await load()
          const i = args.index - 1
          if (i < 0 || i >= m.facts.length) return `编号 ${args.index} 不存在，当前共 ${m.facts.length} 条。`
          const [removed] = m.facts.splice(i, 1)
          await save(m)
          return `已忘掉：${removed.text}`
        },
      }),
      memory_profile_update: tool({
        description:
          "整体更新用户画像（一段对用户的概括性描述）。与逐条事实不同，画像是整段替换。只在用户要求或明确同意时使用。",
        args: {
          profile: tool.schema.string().describe("新的画像全文；传空字符串表示清空画像"),
        },
        async execute(args) {
          const m = await load()
          m.profile = args.profile.trim()
          await save(m)
          return m.profile ? "画像已更新。" : "画像已清空。"
        },
      }),
      remember: tool({
        description:
          "记住关于用户的一条长期事实（喜好、习惯、重要日期、称呼等）。只记真正值得跨会话记住的事，一次一条，简短陈述句。",
        args: {
          fact: tool.schema.string().describe("要记住的事实，一句话"),
        },
        async execute(args, ctx) {
          const m = await load()
          if (!m.enabled) return "记忆功能当前已被用户关闭，未记录。"
          const text = args.fact.trim()
          if (!text) return "内容为空，未记录。"
          if (m.facts.some((f) => f.text === text)) return "这条已经记过了。"
          m.facts.push({ text, from: ctx.sessionID, at: Date.now() })
          await save(m)
          return `已记住：${text}`
        },
      }),
    },
  }
}
