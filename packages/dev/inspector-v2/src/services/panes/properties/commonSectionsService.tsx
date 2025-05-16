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

export const CommonPropertiesSectionsServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Common Properties Sections",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const generalSectionRegistration = propertiesService.addSection({
            order: 0,
            identity: GeneralPropertiesSectionIdentity,
            predicate: () => true,
        });

        const generalPropertiesRegistration = propertiesService.addPropertiesProvider({
            order: 0,
            predicate: (entity: unknown, section: symbol): entity is CommonEntity => {
                if (section === GeneralPropertiesSectionIdentity) {
                    const commonEntity = entity as CommonEntity;
                    return commonEntity.id !== undefined || commonEntity.name !== undefined || commonEntity.uniqueId !== undefined || commonEntity.getClassName !== undefined;
                }
                return false;
            },
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
        });

        return {
            dispose: () => {
                generalPropertiesRegistration.dispose();
                generalSectionRegistration.dispose();
            },
        };
    },
};
