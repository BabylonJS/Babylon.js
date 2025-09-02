import type { IDisposable } from "core/index";

import type { EntityBase, SceneExplorerCommandProvider, SceneExplorerSection } from "../../../components/scene/sceneExplorer";
import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISelectionService } from "../../selectionService";
import type { IShellService } from "../../shellService";

import { CubeTreeRegular } from "@fluentui/react-icons";

import { SceneExplorer } from "../../../components/scene/sceneExplorer";
import { useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { SceneContextIdentity } from "../../sceneContext";
import { SelectionServiceIdentity } from "../../selectionService";
import { ShellServiceIdentity } from "../../shellService";

export const SceneExplorerServiceIdentity = Symbol("SceneExplorer");

/**
 * Allows new sections or commands to be added to the scene explorer pane.
 */
export interface ISceneExplorerService extends IService<typeof SceneExplorerServiceIdentity> {
    /**
     * Adds a new section (e.g. "Nodes", "Materials", etc.) (this includes all descendants within the scene graph).
     * @param section A description of the section to add.
     */
    addSection<T extends EntityBase>(section: SceneExplorerSection<T>): IDisposable;

    /**
     * Adds a new command (e.g. "Delete", "Rename", etc.) that can be executed on entities in the scene explorer.
     * @param command A description of the command to add.
     */
    addCommand<T extends EntityBase>(command: SceneExplorerCommandProvider<T>): IDisposable;
}

/**
 * Provides a scene explorer pane that enables browsing the scene graph and executing commands on entities.
 */
export const SceneExplorerServiceDefinition: ServiceDefinition<[ISceneExplorerService], [ISceneContext, IShellService, ISelectionService]> = {
    friendlyName: "Scene Explorer",
    produces: [SceneExplorerServiceIdentity],
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity],
    factory: (sceneContext, shellService, selectionService) => {
        const sectionsCollection = new ObservableCollection<SceneExplorerSection<EntityBase>>();
        const commandsCollection = new ObservableCollection<SceneExplorerCommandProvider<EntityBase>>();

        const registration = shellService.addSidePane({
            key: "Scene Explorer",
            title: "Scene Explorer",
            icon: CubeTreeRegular,
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            content: () => {
                const sections = useOrderedObservableCollection(sectionsCollection);
                const commands = useOrderedObservableCollection(commandsCollection);
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const entity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);

                return (
                    <>
                        {scene && (
                            <SceneExplorer
                                sections={sections}
                                commandProviders={commands}
                                scene={scene}
                                selectedEntity={entity}
                                setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)}
                            />
                        )}
                    </>
                );
            },
        });

        return {
            addSection: (section) => sectionsCollection.add(section as SceneExplorerSection<EntityBase>),
            addCommand: (command) => commandsCollection.add(command as SceneExplorerCommandProvider<EntityBase>),
            dispose: () => registration.dispose(),
        };
    },
};
