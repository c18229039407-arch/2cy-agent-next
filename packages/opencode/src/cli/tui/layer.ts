import { run as runTui, type TuiInput } from "@2cy/tui"
import { Global } from "@2cy/core/global"
import { AppNodeBuilder } from "@2cy/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
