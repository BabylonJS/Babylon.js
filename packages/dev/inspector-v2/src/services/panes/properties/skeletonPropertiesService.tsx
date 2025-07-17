import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { Skeleton } from "core/Bones/skeleton";
import { SkeletonGeneralProperties, SkeletonViewerProperties } from "../../../components/properties/skeleton/skeletonProperties";
import { PropertiesServiceIdentity } from "./propertiesService";

export const SkeletonPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Skeleton Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const generalContentRegistration = propertiesService.addSectionContent({
            key: "Skeleton General Properties",
            predicate: (entity) => entity instanceof Skeleton,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SkeletonGeneralProperties skeleton={context} />,
                },
            ],
        });

        const viewerContentRegistration = propertiesService.addSectionContent({
            key: "Skeleton Viewer Properties",
            predicate: (entity) => entity instanceof Skeleton,
            content: [
                {
                    section: "Viewer",
                    component: ({ context }) => <SkeletonViewerProperties skeleton={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                viewerContentRegistration.dispose();
                generalContentRegistration.dispose();
            },
        };
    },
};
