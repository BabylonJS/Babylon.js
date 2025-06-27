import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Bone } from "core/Bones/bone";
import { BoneGeneralProperties } from "../../../components/properties/boneProperties";
import { TransformProperties } from "../../../components/properties/transformProperties";
import { SettingsContextIdentity, type ISettingsContext } from "../../../services/settingsContext";
import { SelectionServiceIdentity } from "../../selectionService";
import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";

const TransformPropertiesSectionIdentity = Symbol("Transform");

export const BonePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService, ISettingsContext]> = {
    friendlyName: "Bone Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, selectionService, settingsContent) => {
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
                    component: ({ context }) => <TransformProperties transform={context} settings={settingsContent} />,
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
