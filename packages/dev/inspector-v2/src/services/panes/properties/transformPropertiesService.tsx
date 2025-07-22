import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { Bone } from "core/Bones/bone";
import { TransformNode } from "core/Meshes/transformNode";
import { TransformProperties } from "../../../components/properties/transformProperties";
import { SettingsContextIdentity, type ISettingsContext } from "../../settingsContext";
import { PropertiesServiceIdentity } from "./propertiesService";

export const TransformPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Transform Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContent) => {
        const contentRegistration = propertiesService.addSectionContent({
            key: "Transform Properties",
            // TransformNode and Bone don't share a common base class, but both have the same transform related properties.
            predicate: (entity: unknown) => entity instanceof TransformNode || entity instanceof Bone,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <TransformProperties transform={context} settings={settingsContent} />,
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
