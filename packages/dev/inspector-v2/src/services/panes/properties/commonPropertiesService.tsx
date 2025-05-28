import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

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
                const commonEntity = entity as CommonEntity;
                return commonEntity.id !== undefined || commonEntity.name !== undefined || commonEntity.uniqueId !== undefined || commonEntity.getClassName !== undefined;
            },
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 0,
                    component: ({ entity }) => {
                        return (
                            <>
                                {entity.id !== undefined && <div key="EntityId">ID: {entity.id}</div>}
                                {entity.name !== undefined && <div key="EntityName">Name: {entity.name}</div>}
                                {entity.uniqueId !== undefined && <div key="EntityUniqueId">Unique ID: {entity.uniqueId}</div>}
                                {entity.getClassName !== undefined && <div key="EntityClassName">Class: {entity.getClassName()}</div>}
                            </>
                        );
                    },
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
