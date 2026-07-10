export * as PublicEventManifest from "./public-event-manifest"

import { Event } from "@2cy/schema/event"
import { EventManifest } from "@2cy/schema/event-manifest"

export const Definitions = EventManifest.ServerDefinitions
export const Latest = Event.latest(Definitions)
