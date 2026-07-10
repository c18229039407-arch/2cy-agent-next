// 2CY: 角色卡插件 —— 经官方钩子 experimental.chat.system.transform 注入 <persona> 区块，
// 零源码侵入（连白名单侵入点 3 都无需动用）。
//
// 存储即卡片文件本身：~/.local/share/2cy/character.2cy.json（XDG_DATA_HOME 可覆盖）。
// 「导入角色卡」= 把 .2cy.json 放到这个路径；「导出」= 把它拷走。本地优先，格式与旧产品完全兼容。
//
// 设计约束（见架构文档 4.1）：子代理（分身/探子）是幕后干活的，不戴人设——
// 通过查询会话 parentID 识别子会话并跳过注入。

import type { Plugin, PluginInput } from "@2cy/plugin"
import { tool } from "@2cy/plugin"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { parseCardFile, type CardFile } from "./card-file.js"
import { compilePersona } from "./persona.js"

const FILE = path.join(
  process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"),
  "2cy",
  "character.2cy.json",
)

// 卡片缓存：按 mtime 失效，避免每次 LLM 调用都读盘
let cache: { mtimeMs: number; card: CardFile | null } | undefined

async function loadCard(): Promise<CardFile | null> {
  let stat
  try {
    stat = await fs.stat(FILE)
  } catch {
    cache = undefined
    return null // 没有卡片 = 不注入，保持上游原生行为
  }
  if (cache && cache.mtimeMs === stat.mtimeMs) return cache.card
  let card: CardFile | null = null
  try {
    card = parseCardFile(await fs.readFile(FILE, "utf8"))
  } catch (e) {
    // 卡片损坏：不让一张坏卡拖垮对话，仅在服务端日志留痕
    console.error(`[2cy/character] 角色卡解析失败（${FILE}）：`, e instanceof Error ? e.message : e)
  }
  cache = { mtimeMs: stat.mtimeMs, card }
  return card
}

// 子会话判定缓存：父子关系不会变，判定一次即可
const childCache = new Map<string, boolean>()

async function isChildSession(client: PluginInput["client"], sessionID: string): Promise<boolean> {
  const hit = childCache.get(sessionID)
  if (hit !== undefined) return hit
  try {
    const session = await client.session.get({ path: { id: sessionID } })
    const parentID = (session as { data?: { parentID?: string } }).data?.parentID
    const child = typeof parentID === "string" && parentID.length > 0
    childCache.set(sessionID, child)
    return child
  } catch {
    // 查不到就按主会话处理：宁可多戴一次人设，不让功能静默失效
    return false
  }
}

export const CharacterPlugin: Plugin = async (ctx) => {
  return {
    "experimental.chat.system.transform": async (input, output) => {
      const card = await loadCard()
      if (!card) return
      if (input.sessionID && (await isChildSession(ctx.client, input.sessionID))) return
      const block = compilePersona(card)
      if (block) output.system.push(block)
    },
    tool: {
      character_update: tool({
        description:
          "更新（或创建）当前角色卡的一个或多个字段：name（角色名）、source（出处作品）、personality（性格）、quirk（口癖）、speechStyle（说话方式）、bond（羁绊设定）。只在用户明确要求修改人设时使用；未提供的字段保持原样。修改在下一个新会话生效。",
        args: {
          name: tool.schema.string().optional().describe("角色名"),
          source: tool.schema.string().optional().describe("出处作品"),
          personality: tool.schema.string().optional().describe("性格"),
          quirk: tool.schema.string().optional().describe("口癖"),
          speechStyle: tool.schema.string().optional().describe("说话方式"),
          bond: tool.schema.string().optional().describe("羁绊设定"),
        },
        async execute(args) {
          const patch = Object.fromEntries(
            Object.entries(args).filter(([, v]) => typeof v === "string" && v.trim() !== ""),
          ) as Partial<CardFile>
          if (Object.keys(patch).length === 0) return "没有提供任何要修改的字段，未做更改。"
          const current = (await loadCard()) ?? { format: "2cy-card" as const, version: 2, name: "" }
          const next: CardFile = { ...current, ...patch, format: "2cy-card", version: 2 }
          if (!next.name) return "角色卡必须有 name（角色名），请先提供。"
          await fs.mkdir(path.dirname(FILE), { recursive: true })
          const tmp = FILE + ".tmp"
          await fs.writeFile(tmp, JSON.stringify(next, null, 2))
          await fs.rename(tmp, FILE) // 原子写入
          cache = undefined // 失效缓存
          const changed = Object.keys(patch).join("、")
          return `角色卡已更新（${changed}）。新人设在下一个新会话生效。`
        },
      }),
    },
  }
}
