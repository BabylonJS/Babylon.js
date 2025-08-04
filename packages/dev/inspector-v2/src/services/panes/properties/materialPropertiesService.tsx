import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { Material } from "core/Materials";
import { MaterialGeneralProperties, MaterialStencilProperties, MaterialTransparencyProperties } from "../../../components/properties/materials/materialProperties";

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Material Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService) => {
        const materialContentRegistration = propertiesService.addSectionContent({
            key: "Material Properties",
            predicate: (entity: unknown) => entity instanceof Material,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <MaterialGeneralProperties material={context} />,
                },
                {
                    section: "Transparency",
                    component: ({ context }) => <MaterialTransparencyProperties material={context} />,
                },
                {
                    section: "Stencil",
                    component: ({ context }) => <MaterialStencilProperties material={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                materialContentRegistration.dispose();
            },
        };
    },
};
