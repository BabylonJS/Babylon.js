import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { Node } from "core/node";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { NodeGeneralProperties } from "../../../components/properties/nodeGeneralProperties";

export const NodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Transform Node Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Node Properties",
            predicate: (entity: unknown) => entity instanceof Node,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: ({ context }) => <NodeGeneralProperties node={context} setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};
