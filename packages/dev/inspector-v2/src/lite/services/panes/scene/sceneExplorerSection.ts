import { getRenderingContextKind, type RenderingContext, type SceneContext } from "@babylonjs/lite";
import { type ComponentType } from "react";

import { Observable } from "core/Misc/observable";

import { type ExplorerDisplayInfo, type ExplorerNodeDescription, GetEntityId } from "../../../../components/explorer/explorerModel";
import { type IWatcherService } from "../../../../services/watcherService";

/**
 * Returns whether a rendering context is a scene context.
 * @param context The rendering context to test.
 * @returns Whether the context is a scene context.
 */
export function IsSceneContext(context: RenderingContext): context is SceneContext {
    return getRenderingContextKind(context) === "scene";
}

/**
 * Creates live Explorer display info for an entity whose name is mutable.
 * @param watcherService The service used to observe name changes.
 * @param entity The named entity.
 * @param getDisplayName Gets the current display name, including any fallback.
 * @returns Disposable display info that updates when the entity name changes.
 */
export function CreateWatchedNameDisplayInfo<T extends { name?: string }>(watcherService: IWatcherService, entity: T, getDisplayName: () => string): ExplorerDisplayInfo {
    const onChange = new Observable<void>();
    const nameWatcher = watcherService.watchProperty(entity, "name", () => onChange.notifyObservers());

    return {
        get name() {
            return getDisplayName();
        },
        onChange,
        dispose: () => {
            nameWatcher.dispose();
            onChange.clear();
        },
    };
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
