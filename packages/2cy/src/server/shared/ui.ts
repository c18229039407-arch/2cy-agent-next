import { FSUtil } from "@2cy/core/fs-util"
import { Effect } from "effect"
import { HttpClient, HttpServerRequest, HttpServerResponse } from "effect/unstable/http"
import { createHash } from "node:crypto"
import nodePath from "node:path" // 2CY

let embeddedUIPromise: Promise<Record<string, string> | null> | undefined

export const UI_UPSTREAM = new URL("https://app.opencode.ai")

export const csp = (hash = "") =>
  `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'${hash ? ` 'sha256-${hash}'` : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data:; connect-src * data:`
export const DEFAULT_CSP = csp()

export function themePreloadHash(body: string) {
  return body.match(/<script\b(?![^>]*\bsrc\s*=)[^>]*\bid=(['"])oc-theme-preload-script\1[^>]*>([\s\S]*?)<\/script>/i)
}

export function cspForHtml(body: string) {
  const match = themePreloadHash(body)
  return csp(match ? createHash("sha256").update(match[2]).digest("base64") : "")
}

export function upstreamURL(path: string) {
  return new URL(path, UI_UPSTREAM).toString()
}

export function embeddedUI(disableEmbeddedWebUi: boolean) {
  if (disableEmbeddedWebUi) return Promise.resolve(null)
  return (embeddedUIPromise ??=
    // @ts-expect-error - generated file at build time
    import("opencode-web-ui.gen.ts").then((module) => module.default as Record<string, string>).catch(() => null))
}

function notFound() {
  return HttpServerResponse.jsonUnsafe({ error: "Not Found" }, { status: 404 })
}

function embeddedUIResponse(file: string, body: Uint8Array) {
  const mime = FSUtil.mimeType(file)
  const headers = new Headers({ "content-type": mime })
  if (mime.startsWith("text/html")) {
    headers.set("content-security-policy", cspForHtml(new TextDecoder().decode(body)))
  }
  return HttpServerResponse.raw(body, { headers })
}

export function serveEmbeddedUIEffect(
  requestPath: string,
  fs: FSUtil.Interface,
  embeddedWebUI: Record<string, string>,
) {
  const file = embeddedWebUI[requestPath.replace(/^\//, "")] ?? embeddedWebUI["index.html"] ?? null
  if (!file) return Effect.succeed(notFound())

  return fs.readFile(file).pipe(
    Effect.map((body) => embeddedUIResponse(file, body)),
    Effect.catchReason("PlatformError", "NotFound", () => Effect.succeed(notFound())),
  )
}

// 2CY: 本地优先（侵入点 7，见 2CY-FORK.md）——界面绝不代理到上游服务器。
// 优先级：嵌入 UI > OPENCODE_WEB_UI_DIR 本地目录（开发/测试用）> 明确报错。
function serveLocalDirEffect(requestPath: string, fs: FSUtil.Interface, dir: string) {
  const rel = nodePath.normalize(requestPath.replace(/^\/+/, "") || "index.html")
  if (rel.startsWith("..")) return Effect.succeed(notFound())
  const primary = nodePath.join(dir, rel)
  const fallback = nodePath.join(dir, "index.html")
  const read = (file: string) => fs.readFile(file).pipe(Effect.map((body) => embeddedUIResponse(file, body)))
  return read(primary).pipe(
    Effect.catchReason("PlatformError", "NotFound", () =>
      read(fallback).pipe(Effect.catchReason("PlatformError", "NotFound", () => Effect.succeed(notFound()))),
    ),
  )
}

export function serveUIEffect(
  request: HttpServerRequest.HttpServerRequest,
  services: { fs: FSUtil.Interface; client: HttpClient.HttpClient; disableEmbeddedWebUi: boolean },
) {
  return Effect.gen(function* () {
    const embeddedWebUI = yield* Effect.promise(() => embeddedUI(services.disableEmbeddedWebUi))
    const path = new URL(request.url, "http://localhost").pathname

    if (embeddedWebUI) return yield* serveEmbeddedUIEffect(path, services.fs, embeddedWebUI)

    const localDir = process.env["OPENCODE_WEB_UI_DIR"]
    if (localDir) return yield* serveLocalDirEffect(path, services.fs, localDir)

    return HttpServerResponse.text(
      "2CY web UI 未嵌入。请使用发布版二进制；开发时可设置 OPENCODE_WEB_UI_DIR 指向前端构建目录（packages/app/dist）。",
      { status: 503 },
    )
  })
}
