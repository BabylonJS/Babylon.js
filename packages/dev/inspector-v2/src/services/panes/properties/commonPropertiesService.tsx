import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { Scene } from "core/scene";

import { CommonGeneralProperties } from "../../../components/properties/commonGeneralProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

export const GeneralPropertiesSectionIdentity = Symbol("General");

export const CommonPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Common Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const generalSectionRegistration = propertiesService.addSection({
            order: 0,
            identity: GeneralPropertiesSectionIdentity,
        });

        const contentRegistration = propertiesService.addSectionContent({
            key: "Common Properties",
            predicate: (entity: unknown): entity is CommonEntity => {
                // Common properties are not useful for the scene.
                if (entity instanceof Scene) {
                    return false;
                }

                const commonEntity = entity as CommonEntity;
                return commonEntity.id !== undefined || commonEntity.name !== undefined || commonEntity.uniqueId !== undefined || commonEntity.getClassName !== undefined;
            },
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <CommonGeneralProperties commonEntity={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
                generalSectionRegistration.dispose();
            },
        };
    },
};
