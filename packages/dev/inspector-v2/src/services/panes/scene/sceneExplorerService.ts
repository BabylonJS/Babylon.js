import { type IDisposable } from "core/index";

import { type ExplorerCommandProvider, type ExplorerNodeDescription, GetEntityId } from "../../../components/explorer/explorerModel";
import { type SceneExplorerCommandProvider, type SceneExplorerSection } from "../../../components/scene/sceneExplorer";
import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../../sceneContext";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { CreateExplorerPaneRegistration } from "../explorer/explorerPane";
import { ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";

/**
 * The unique identity symbol for the scene explorer service.
 */
export const SceneExplorerServiceIdentity = Symbol("SceneExplorer");

/**
 * Allows new sections or commands to be added to the scene explorer pane.
 */
export interface ISceneExplorerService extends IService<typeof SceneExplorerServiceIdentity> {
    /**
     * Adds a new section (e.g. "Nodes", "Materials", etc.) (this includes all descendants within the scene graph).
     * @param section A description of the section to add.
     */
    addSection<T extends object>(section: SceneExplorerSection<T>): IDisposable;

    /**
     * Adds a new command (e.g. "Delete", "Rename", etc.) that can be executed on entities in the scene explorer.
     * @param command A description of the command to add.
     */
    addEntityCommand<T extends object>(command: SceneExplorerCommandProvider<T>): IDisposable;

    /**
     * Adds a new command that can be executed on sections in the scene explorer.
     * @param command A description of the command to add.
     */
    addSectionCommand<T extends string>(command: SceneExplorerCommandProvider<T, "contextMenu">): IDisposable;
}

function IsEntityHidden(entity: object) {
    return (
        "reservedDataStore" in entity &&
        typeof entity.reservedDataStore === "object" &&
        entity.reservedDataStore &&
        "hidden" in entity.reservedDataStore &&
        entity.reservedDataStore.hidden === true
    );
}

function CreateEntityNode(section: SceneExplorerSection<object>, entity: object): ExplorerNodeDescription {
    const getEntityChildren = section.getEntityChildren;

    return {
        id: GetEntityId(entity).toString(),
        kind: "item",
        entity,
        icon: section.entityIcon,
        getDisplayInfo: () => section.getEntityDisplayInfo(entity),
        getChildren: getEntityChildren
            ? () =>
                  getEntityChildren(entity)
                      .filter((child) => !IsEntityHidden(child))
                      .map((child) => CreateEntityNode(section, child))
            : undefined,
    };
}

// Sections are purely structural (they have no entity), so the Explorer automatically hides them when they contain no entities.
function CreateSectionNode(section: SceneExplorerSection<object>): ExplorerNodeDescription {
    return {
        id: section.displayName,
        kind: "group",
        getDisplayInfo: () => ({ name: section.displayName }),
        getChildren: () =>
            section
                .getRootEntities()
                .filter((entity) => !IsEntityHidden(entity))
                .map((entity) => CreateEntityNode(section, entity)),
        dragDropConfig: section.dragDropConfig,
        getAddedObservables: () => section.getEntityAddedObservables(),
        getRemovedObservables: () => section.getEntityRemovedObservables(),
        getMovedObservables: () => section.getEntityMovedObservables?.() ?? [],
    };
}

/**
 * Adapts the Babylon.js scene section/entity model onto the generic Explorer, and owns the "Scene Explorer"
 * pane that enables browsing the scene graph and executing commands on entities.
 */
export const SceneExplorerServiceDefinition: ServiceDefinition<[ISceneExplorerService], [ISceneContext, IShellService, ISelectionService]> = {
    friendlyName: "Scene Explorer",
    produces: [SceneExplorerServiceIdentity],
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity],
    factory: (sceneContext, shellService, selectionService) => {
        const sectionsCollection = new ObservableCollection<SceneExplorerSection<object>>();
        const entityCommandsCollection = new ObservableCollection<ExplorerCommandProvider<object>>();
        const sectionCommandsCollection = new ObservableCollection<ExplorerCommandProvider<string, "contextMenu">>();

        const paneRegistration = CreateExplorerPaneRegistration(shellService, selectionService, {
            key: "Scene Explorer",
            title: "Scene Explorer",
            getRoot: () => sceneContext.currentScene,
            rootLabel: "Scene",
            onRootChanged: sceneContext.currentSceneObservable,
            getNodes: () => [...sectionsCollection.items].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)).map(CreateSectionNode),
            onNodesChanged: sectionsCollection.observable,
            itemCommandProviders: entityCommandsCollection,
            groupCommandProviders: sectionCommandsCollection,
        });

        return {
            addSection: (section) => sectionsCollection.add(section as unknown as SceneExplorerSection<object>),
            addEntityCommand: (command) => entityCommandsCollection.add(command as unknown as ExplorerCommandProvider<object>),
            addSectionCommand: (command) => sectionCommandsCollection.add(command as unknown as ExplorerCommandProvider<string, "contextMenu">),
            dispose: () => paneRegistration.dispose(),
        };
    },
};
