import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { Bone } from "core/Bones/bone";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { BoneGeneralProperties } from "../../../components/properties/boneProperties";
import { TransformProperties } from "../../../components/properties/transformProperties";

const TransformPropertiesSectionIdentity = Symbol("Transform");

export const BonePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Bone Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const generalContentRegistration = propertiesService.addSectionContent({
            key: "Bone General Properties",
            predicate: (entity) => entity instanceof Bone,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: ({ context }) => <BoneGeneralProperties bone={context} setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)} />,
                },
            ],
        });

        const transformSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformPropertiesSectionIdentity,
        });

        const transformContentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            predicate: (entity) => entity instanceof Bone,
            content: [
                // "TRANSFORM" section.
                {
                    section: TransformPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <TransformProperties transform={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                generalContentRegistration.dispose();

                transformContentRegistration.dispose();
                transformSectionRegistration.dispose();
            },
        };
    },
};
