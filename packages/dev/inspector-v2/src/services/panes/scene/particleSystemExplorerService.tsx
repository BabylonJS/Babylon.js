import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { DropRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";
import { ParticleSystem } from "core/Particles";

export const ParticleSystemExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Particle System Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Particle Systems",
            order: 4,
            predicate: (entity) => entity instanceof ParticleSystem,
            getRootEntities: (scene) => scene.particleSystems.map((ps) => ps as ParticleSystem),
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
            getEntityAddedObservables: (scene) => [],
            getEntityRemovedObservables: (scene) => [],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
