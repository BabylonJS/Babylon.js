import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";

import { Material } from "core/Materials";
import { MaterialTransparencyProperties } from "../../../components/properties/materialTransparencyProperties";

export const TransparencyPropertiesSectionIdentity = Symbol("Transparency");
export const StencilPropertiesSectionItentity = Symbol("Stencil");

export const MaterialPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Material Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService) => {
        // Transparency
        const transparencySectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransparencyPropertiesSectionIdentity,
        });

        const materialContentRegistration = propertiesService.addSectionContent({
            key: "Material Properties",
            predicate: (entity: unknown): entity is Material => entity instanceof Material,
            content: [
                // "Transparency" section.
                {
                    section: TransparencyPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <MaterialTransparencyProperties material={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                materialContentRegistration.dispose();
                transparencySectionRegistration.dispose();
            },
        };
    },
};
