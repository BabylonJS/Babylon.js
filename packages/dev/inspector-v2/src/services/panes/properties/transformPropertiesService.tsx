import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { Bone } from "core/Bones/bone";
import { TransformNode } from "core/Meshes/transformNode";
import { TransformProperties } from "../../../components/properties/transformProperties";
import { SettingsContextIdentity, type ISettingsContext } from "../../settingsContext";
import { PropertiesServiceIdentity } from "./propertiesService";

export const TransformPropertiesSectionIdentity = Symbol("Transform");

export const TransformPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Transform Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContent) => {
        const transformSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode || entity instanceof Bone,
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
                contentRegistration.dispose();
                transformSectionRegistration.dispose();
            },
        };
    },
};
