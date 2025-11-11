import type { IDisposable } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { Scene } from "core/scene";

import { CommonGeneralProperties, DisposableGeneralProperties } from "../../../components/properties/commonGeneralProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

type CommonEntity = {
    id?: number;
    name?: string;
    uniqueId?: number;
    getClassName?: () => string;
};

export const CommonPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Common Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const commonContentRegistration = propertiesService.addSectionContent({
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
                {
                    section: "General",
                    component: ({ context }) => <CommonGeneralProperties commonEntity={context} />,
                },
            ],
        });

        const disposableContentRegistration = propertiesService.addSectionContent({
            key: "Disposable Properties",
            predicate: (entity: unknown): entity is IDisposable => {
                const disposable = entity as Partial<IDisposable>;
                return typeof disposable.dispose === "function";
            },
            content: [
                {
                    section: "General",
                    order: 100000,
                    component: ({ context }) => <DisposableGeneralProperties disposableEntity={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                commonContentRegistration.dispose();
                disposableContentRegistration.dispose();
            },
        };
    },
};
