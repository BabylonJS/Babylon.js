import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { tokens } from "@fluentui/react-components";
import { DropRegular, EditRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { ParticleSystem } from "core/Particles/particleSystem";
import { EditParticleSystem } from "../../../misc/nodeParticleEditor";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultCommandsOrder, DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const ParticleSystemExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Particle System Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Particle Systems",
            order: DefaultSectionsOrder.ParticleSystems,
            getRootEntities: () => scene.particleSystems,
            getEntityDisplayInfo: (particleSystem) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = watcherService.watchProperty(particleSystem, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return particleSystem.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <DropRegular color={tokens.colorPaletteCranberryForeground2} />,
            getEntityAddedObservables: () => [scene.onNewParticleSystemAddedObservable],
            getEntityRemovedObservables: () => [scene.onParticleSystemRemovedObservable],
        });

        const editParticleSystemCommandRegistration = sceneExplorerService.addEntityCommand({
            predicate: (entity): entity is ParticleSystem => entity instanceof ParticleSystem && entity.isNodeGenerated,
            order: DefaultCommandsOrder.EditParticleSystem,
            getCommand: (particleSystem) => {
                return {
                    type: "action",
                    displayName: "Edit in Node Particle System Editor",
                    icon: () => <EditRegular />,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    execute: async () => await EditParticleSystem(particleSystem),
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                editParticleSystemCommandRegistration.dispose();
            },
        };
    },
};
