import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { TransformNode } from "core/Meshes/transformNode";

import { PropertiesServiceIdentity } from "./propertiesService";
import { TransformNodeTransformProperties } from "../../../components/properties/transformNodeTransformProperties";
import { SettingsContextIdentity, type ISettingsContext } from "../../../services/settingsContext";

export const TransformsPropertiesSectionIdentity = Symbol("Transforms");

export const TransformNodePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Transform Node Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContent) => {
        const transformsSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: TransformsPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Node Properties",
            predicate: (entity: unknown) => entity instanceof TransformNode,
            content: [
                // "TRANSFORMS" section.
                {
                    section: TransformsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <TransformNodeTransformProperties node={context} settings={settingsContent} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                transformsSectionRegistration.dispose();
            },
        };
    },
};
