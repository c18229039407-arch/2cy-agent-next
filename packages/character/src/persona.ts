// 2CY: 人设外壳编译器。
// 语义基准 = 旧版 server.mjs 的 buildSystemPrompt（v0.9），改造为注入
// opencode system prompt 组装链（session/system.ts）的 <persona> 区块。
// 纯函数，无副作用，无 Effect 依赖，可独立单测。

export interface CharacterCard {
  name: string
  source?: string // 出自哪部作品
  personality?: string
  quirk?: string // 口癖
  speechStyle?: string
  bond?: string // 羁绊设定
}

export interface UserContext {
  userName?: string
  userBio?: string
}

/** 编译人设区块。card 为空时返回 undefined（不注入，保持上游原生行为）。 */
export function compilePersona(card: CharacterCard | null, user: UserContext = {}): string | undefined {
  if (!card?.name) return undefined
  const lines = [
    "<persona>",
    `你正在扮演「${card.name}」${card.source ? `，出自《${card.source}》` : ""}。用户明确知道这是角色扮演，请始终保持角色身份。`,
    card.personality ? `性格：${card.personality}` : "",
    card.quirk ? `口癖：${card.quirk}` : "",
    card.speechStyle ? `说话方式：${card.speechStyle}` : "",
    card.bond ? `羁绊设定：${card.bond}` : "",
    "",
    "扮演规则：",
    "- 以角色的口吻、性格和口癖对话，中文回复（用户要求其他语言时除外）。",
    "- 你既是伙伴也是助手：闲聊时有角色感，干活时认真高效，两者都不出戏。",
    "- 不要旁白式描写自己的动作，不要每句都堆口癖，克制而自然。",
    "- 被直接问到时可以坦然承认自己是 AI 在扮演该角色，不需要否认。",
    "- 回答问题和完成任务时保证内容质量，角色感体现在语气而非牺牲准确性。",
    "- 工具调用、代码、文件内容等工作产物保持专业格式，人设只体现在对用户说的话里。",
    user.userName ? `\n称呼用户为「${user.userName}」。` : "",
    user.userBio ? `关于用户：${user.userBio}` : "",
    "</persona>",
  ]
  return lines.filter((l) => l !== "").join("\n")
}

/**
 * 人设注入范围：只有 primary agent（执笔/build、分镜/plan）戴人设外壳；
 * 子代理（general/explore/compaction/title 等）是幕后分身，不注入——
 * 省 token，且避免污染检索与摘要类输出。
 */
export function shouldWearPersona(agentName: string, agentMode: "primary" | "subagent" | "all"): boolean {
  if (agentMode === "subagent") return false
  return !["compaction", "title"].includes(agentName)
}
