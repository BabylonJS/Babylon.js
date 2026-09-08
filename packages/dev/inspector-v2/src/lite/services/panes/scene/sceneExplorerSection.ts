import { getRenderingContextKind, type RenderingContext, type SceneContext } from "@babylonjs/lite";
import { type ComponentType } from "react";

import { type ExplorerDisplayInfo, type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";

/**
 * Returns whether a rendering context is a scene context.
 * @param context The rendering context to test.
 * @returns Whether the context is a scene context.
 */
export function IsSceneContext(context: RenderingContext): context is SceneContext {
    return getRenderingContextKind(context) === "scene";
}

/**
 * Creates an Explorer section containing the supplied scene entities.
 * @param id The stable section identifier.
 * @param displayName The section's display name.
 * @param entities The entities displayed by the section.
 * @param getEntityDisplayInfo Gets the display information for an entity.
 * @param entityIcon The optional icon component for the entities.
 * @returns The Explorer node description for the section.
 */
export function CreateSceneExplorerSectionNode<T extends object>(
    id: string,
    displayName: string,
    entities: readonly T[],
    getEntityDisplayInfo: (entity: T, index: number) => ExplorerDisplayInfo,
    entityIcon?: ComponentType<{ entity: object }>
): ExplorerNodeDescription {
    return {
        id,
        kind: "group",
        getDisplayInfo: () => ({ name: displayName }),
        getChildren: () =>
            entities.map((entity, index) => ({
                id: GetEntityId(entity).toString(),
                kind: "item",
                entity,
                icon: entityIcon,
                getDisplayInfo: () => getEntityDisplayInfo(entity, index),
            })),
    };
}
