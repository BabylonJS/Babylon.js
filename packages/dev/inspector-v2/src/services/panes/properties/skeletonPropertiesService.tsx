import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISelectionService } from "../../selectionService";

import { Skeleton } from "core/Bones/skeleton";

import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SelectionServiceIdentity } from "../../selectionService";
import { SkeletonGeneralProperties } from "../../../components/properties/skeletonProperties";
import { SkeletonViewerProperties } from "../../../components/properties/skeletonProperties";

const ViewerPropertiesSectionIdentity = Symbol("Viewer");

export const SkeletonPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Skeleton Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const generalContentRegistration = propertiesService.addSectionContent({
            key: "Skeleton General Properties",
            predicate: (entity) => entity instanceof Skeleton,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: ({ context }) => <SkeletonGeneralProperties skeleton={context} />,
                },
            ],
        });

        const viewerSectionRegistration = propertiesService.addSection({
            order: 1,
            identity: ViewerPropertiesSectionIdentity,
        });

        const viewerContentRegistration = propertiesService.addSectionContent({
            key: "Skeleton Viewer Properties",
            predicate: (entity) => entity instanceof Skeleton,
            content: [
                // "VIEWER" section.
                {
                    section: ViewerPropertiesSectionIdentity,
                    order: 2,
                    component: ({ context }) => <SkeletonViewerProperties skeleton={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                viewerContentRegistration.dispose();
                viewerSectionRegistration.dispose();

                generalContentRegistration.dispose();
            },
        };
    },
};
