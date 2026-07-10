import { AgentV2 } from "@2cy/core/agent"
import { AISDK } from "@2cy/core/aisdk"
import { Catalog } from "@2cy/core/catalog"
import { CommandV2 } from "@2cy/core/command"
import { Credential } from "@2cy/core/credential"
import { AppNodeBuilder } from "@2cy/core/effect/app-node-builder"
import { LayerNodePlatform } from "@2cy/core/effect/app-node-platform"
import { LayerNode } from "@2cy/core/effect/layer-node"
import { EventV2 } from "@2cy/core/event"
import { FileSystem } from "@2cy/core/filesystem"
import { FSUtil } from "@2cy/core/fs-util"
import { Integration } from "@2cy/core/integration"
import { Location } from "@2cy/core/location"
import { Npm } from "@2cy/core/npm"
import { PluginV2 } from "@2cy/core/plugin"
import { Reference } from "@2cy/core/reference"
import { SkillV2 } from "@2cy/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
