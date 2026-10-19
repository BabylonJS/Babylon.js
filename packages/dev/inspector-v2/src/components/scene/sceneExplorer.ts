import { type ComponentType } from "react";

import { type IReadonlyObservable } from "core/index";

import {
    type ExplorerCommand,
    type ExplorerCommandMode,
    type ExplorerCommandProvider,
    type ExplorerCommandType,
    type ExplorerDisplayInfo,
    type ExplorerDragDropConfig,
} from "../explorer/explorerModel";

/**
 * Information about how to display an entity in the Scene Explorer tree.
 */
export type EntityDisplayInfo = ExplorerDisplayInfo;

/**
 * Configuration for drag-and-drop behavior within a section.
 */
export type SceneExplorerDragDropConfig<T> = ExplorerDragDropConfig<T>;

/**
 * Describes a section containing entities in the Scene Explorer.
 */
export type SceneExplorerSection<T extends object> = Readonly<{
    /**
     * The display name of the section (e.g. "Nodes", "Materials", etc.).
     */
    displayName: string;

    /**
     * An optional order for the section, relative to other sections.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A function that returns the root entities for this section.
     */
    getRootEntities: () => readonly T[];

    /**
     * An optional function that returns the children of a given entity.
     */
    getEntityChildren?: (entity: T) => readonly T[];

    /**
     * Gets the display information for a given entity.
     * This is ideally "live" display info (e.g. updates to the display info are taken into account and communicated via the observable).
     * This means in many cases the display info will need to be disposed when it is no longer needed so observable registrations can be removed.
     */
    getEntityDisplayInfo: (entity: T) => EntityDisplayInfo;

    /**
     * An optional icon component to render for the entity.
     */
    entityIcon?: ComponentType<{ entity: T }>;

    /**
     * A function that returns an array of observables for when entities are added to the scene.
     */
    getEntityAddedObservables: () => readonly IReadonlyObservable<T>[];

    /**
     * A function that returns an array of observables for when entities are removed from the scene.
     */
    getEntityRemovedObservables: () => readonly IReadonlyObservable<T>[];

    /**
     * A function that returns an array of observables for when entities are moved (e.g. re-parented) within the scene.
     */
    getEntityMovedObservables?: () => readonly IReadonlyObservable<T>[];

    /**
     * Optional configuration for drag-and-drop behavior within this section.
     * If not provided, drag-and-drop is disabled for this section.
     */
    dragDropConfig?: SceneExplorerDragDropConfig<T>;
}>;

type CommandMode = ExplorerCommandMode;

type CommandType = ExplorerCommandType;

/**
 * Describes a command that can be executed on entities or sections in the Scene Explorer.
 */
export type SceneExplorerCommand<ModeT extends CommandMode = CommandMode, TypeT extends CommandType = CommandType> = ExplorerCommand<ModeT, TypeT>;

/**
 * Provides a command for a specific entity or section context in the Scene Explorer.
 */
export type SceneExplorerCommandProvider<ContextT, ModeT extends CommandMode = CommandMode, TypeT extends CommandType = CommandType> = ExplorerCommandProvider<
    ContextT,
    ModeT,
    TypeT
>;
