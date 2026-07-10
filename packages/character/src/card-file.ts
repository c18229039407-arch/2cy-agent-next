// 2CY: .2cy.json 角色卡文件格式 —— 与旧产品（2cy-agent v0.9）的导入导出完全兼容。
// 兼容契约核实自旧版 public/index.html 的 importCard()：
//   { format: '2cy-card', name(必填), source, personality, quirk, speechStyle, bond, avatar(dataURL) }

import { z } from "zod"
import type { CharacterCard } from "./persona.js"

const AVATAR_RE = /^data:image\/(png|jpeg|webp);base64,/

export const CardFileSchema = z.object({
  format: z.literal("2cy-card"),
  version: z.number().optional(), // 旧版未写 version；新版导出写 2
  name: z.string().min(1, "角色名不能为空"),
  source: z.string().optional(),
  personality: z.string().optional(),
  quirk: z.string().optional(),
  speechStyle: z.string().optional(),
  bond: z.string().optional(),
  avatar: z
    .string()
    .regex(AVATAR_RE, "形象图必须是 png/jpeg/webp 的 dataURL")
    .optional(),
})

export type CardFile = z.infer<typeof CardFileSchema>

/** 导入：解析并校验 .2cy.json 内容，失败抛出带中文信息的错误。 */
export function parseCardFile(text: string): CardFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("不是有效的 JSON 文件")
  }
  const result = CardFileSchema.safeParse(raw)
  if (!result.success) {
    throw new Error("不是有效的 2CY 角色卡文件：" + result.error.issues[0]?.message)
  }
  return result.data
}

/** 导出：从角色卡与形象图生成 .2cy.json 内容。 */
export function serializeCardFile(card: CharacterCard, avatarDataUrl?: string): string {
  const out: CardFile = {
    format: "2cy-card",
    version: 2,
    name: card.name,
    source: card.source,
    personality: card.personality,
    quirk: card.quirk,
    speechStyle: card.speechStyle,
    bond: card.bond,
    avatar: avatarDataUrl && AVATAR_RE.test(avatarDataUrl) ? avatarDataUrl : undefined,
  }
  return JSON.stringify(out, null, 2)
}

export function suggestedFilename(card: CharacterCard): string {
  return `${card.name}.2cy.json`
}
