import type { IParticleSystem } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { DropRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const ParticleSystemExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Particle System Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Particle Systems",
            order: 700,
            predicate: (entity): entity is IParticleSystem => scene.particleSystems.includes(entity as IParticleSystem),
            getRootEntities: () => scene.particleSystems,
            getEntityDisplayInfo: (particleSystem) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(particleSystem, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

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
            entityIcon: () => <DropRegular />,
            getEntityAddedObservables: () => [scene.onNewParticleSystemAddedObservable],
            getEntityRemovedObservables: () => [scene.onParticleSystemRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
