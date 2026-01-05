import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";
import { SelectionServiceIdentity } from "../../selectionService";
import {
    SceneCollisionsProperties,
    SceneMaterialImageProcessingProperties,
    ScenePhysicsProperties,
    SceneRenderingProperties,
    SceneShadowsProperties,
} from "../../../components/scene/sceneProperties";
import { Scene } from "core/scene";

export const ScenePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Scene Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const sceneContentRegistration = propertiesService.addSectionContent({
            key: "Scene Properties",
            predicate: (entity: unknown) => entity instanceof Scene,
            content: [
                {
                    section: "Rendering",
                    component: ({ context }) => <SceneRenderingProperties scene={context} selectionService={selectionService} />,
                },
                {
                    section: "Material Image Processing",
                    component: ({ context }) => <SceneMaterialImageProcessingProperties scene={context} />,
                },
                {
                    section: "Physics",
                    component: ({ context }) => <ScenePhysicsProperties scene={context} />,
                },
                {
                    section: "Collisions",
                    component: ({ context }) => <SceneCollisionsProperties scene={context} />,
                },
                {
                    section: "Shadows",
                    component: ({ context }) => <SceneShadowsProperties scene={context} />,
                },
            ],
        });
        return {
            dispose: () => {
                sceneContentRegistration.dispose();
            },
        };
    },
};
