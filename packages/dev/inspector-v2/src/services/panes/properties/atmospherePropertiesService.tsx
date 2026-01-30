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

// Returns the Atmosphere class if addons are loaded, undefined otherwise
const getAtmosphereClass = (): (new (...args: unknown[]) => Atmosphere) | undefined => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require("addons/atmosphere/atmosphere").Atmosphere;
    } catch {
        return undefined;
    }
};

export const AtmospherePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISceneContext]> = {
    friendlyName: "Atmosphere Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SceneContextIdentity],
    factory: (propertiesService, selectionService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const AtmosphereClass = getAtmosphereClass();
        if (!AtmosphereClass) {
            return undefined;
        }

        const atmosphereContentRegistration = propertiesService.addSectionContent({
            key: "Atmosphere Properties",
            predicate: (entity: unknown) => entity instanceof AtmosphereClass,
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
