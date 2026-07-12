// 2CY: 角色卡读取（供服务端 /2cy/character 路由使用；与插件共用同一份文件与格式）
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { parseCardFile, type CardFile } from "./card-file.js"

export const CARD_FILE = path.join(
  process.env["XDG_DATA_HOME"] ?? path.join(os.homedir(), ".local", "share"),
  "2cy",
  "character.2cy.json",
)

/** 读取角色卡；不存在或损坏时返回 null（前端据此隐藏人设面板）。 */
export async function readCard(): Promise<CardFile | null> {
  try {
    return parseCardFile(await fs.readFile(CARD_FILE, "utf8"))
  } catch {
    return null
  }
}
