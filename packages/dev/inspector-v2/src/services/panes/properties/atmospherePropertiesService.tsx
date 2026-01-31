import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";
import type { ISceneContext } from "../../../services/sceneContext";
import type { Atmosphere } from "addons/atmosphere/atmosphere";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SceneContextIdentity } from "../../../services/sceneContext";
import {
    AerialPerspectiveProperties,
    DiffuseIrradianceProperties,
    GeneralAtmosphereProperties,
    MultipleScatteringProperties,
    RenderingOptionsProperties,
    ScatteringAndAbsorptionProperties,
} from "../../../components/properties/atmosphereProperties";

export const AtmospherePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISceneContext]> = {
    friendlyName: "Atmosphere Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SceneContextIdentity],
    factory: (propertiesService, selectionService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const atmosphereContentRegistration = propertiesService.addSectionContent({
            key: "Atmosphere Properties",
            predicate: (entity: unknown): entity is Atmosphere => (entity as Partial<Atmosphere>).getClassName?.() === "Atmosphere",
            content: [
                {
                    section: "General",
                    component: ({ context }) => <GeneralAtmosphereProperties entity={context} />,
                },
                {
                    section: "Scattering and Absorption",
                    component: ({ context }) => <ScatteringAndAbsorptionProperties entity={context} />,
                },
                {
                    section: "Multiple Scattering",
                    component: ({ context }) => <MultipleScatteringProperties entity={context} />,
                },
                {
                    section: "Aerial Perspective",
                    component: ({ context }) => <AerialPerspectiveProperties entity={context} />,
                },
                {
                    section: "Diffuse Sky Irradiance",
                    component: ({ context }) => <DiffuseIrradianceProperties entity={context} />,
                },
                {
                    section: "Rendering Options",
                    component: ({ context }) => <RenderingOptionsProperties entity={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                atmosphereContentRegistration.dispose();
            },
        };
    },
};
