import type { AspectDefinition } from "../modularity/serviceCatalog";

export const InspectorAspectIdentity = Symbol("Inspector");

export const InspectorAspect = {
    identity: InspectorAspectIdentity,
    friendlyName: "Inspector",
    tags: ["diagnostics", "scene"],
} as const satisfies AspectDefinition<typeof InspectorAspectIdentity>;
