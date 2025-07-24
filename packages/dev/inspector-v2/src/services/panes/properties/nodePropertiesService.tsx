import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Node } from "core/node";

import { NodeGeneralProperties } from "../../../components/properties/nodeGeneralProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";

export const NodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Transform Node Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Node Properties",
            predicate: (entity: unknown) => entity instanceof Node,
            content: [
                {
                    section: "General",
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
