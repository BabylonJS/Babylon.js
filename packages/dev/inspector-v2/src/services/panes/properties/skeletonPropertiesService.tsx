import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISelectionService } from "../../selectionService";
import type { IPropertiesService } from "./propertiesService";

import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { BoneGeneralProperties } from "../../../components/properties/skeleton/boneProperties";
import { SkeletonGeneralProperties, SkeletonViewerProperties } from "../../../components/properties/skeleton/skeletonProperties";
import { SelectionServiceIdentity } from "../../selectionService";
import { PropertiesServiceIdentity } from "./propertiesService";

export const SkeletonPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISelectionService]> = {
    friendlyName: "Skeleton Properties",
    consumes: [PropertiesServiceIdentity, SelectionServiceIdentity],
    factory: (propertiesService, selectionService) => {
        const skeletonGeneralContentRegistration = propertiesService.addSectionContent({
            key: "Skeleton General Properties",
            predicate: (entity) => entity instanceof Skeleton,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SkeletonGeneralProperties skeleton={context} />,
                },
            ],
        });

        const skeletonViewerContentRegistration = propertiesService.addSectionContent({
            key: "Skeleton Viewer Properties",
            predicate: (entity) => entity instanceof Skeleton,
            content: [
                {
                    section: "Viewer",
                    component: ({ context }) => <SkeletonViewerProperties skeleton={context} />,
                },
            ],
        });

        const boneGeneralContentRegistration = propertiesService.addSectionContent({
            key: "Bone General Properties",
            predicate: (entity) => entity instanceof Bone,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <BoneGeneralProperties bone={context} selectionService={selectionService} />,
                },
            ],
        });

        return {
            dispose: () => {
                boneGeneralContentRegistration.dispose();
                skeletonViewerContentRegistration.dispose();
                skeletonGeneralContentRegistration.dispose();
            },
        };
    },
};
