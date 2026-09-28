import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { ArcRotateCameraTransformProperties, CameraGeneralProperties, FreeCameraTransformProperties } from "../../../components/properties/cameraProperties";
import { IsArcRotateCamera, IsCamera, IsFreeCamera } from "../../../sceneEntityUtils";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";

export const CameraPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Babylon Lite Camera Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const cameraRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Camera Properties",
            predicate: IsCamera,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <CameraGeneralProperties camera={context} />,
                },
            ],
        });
        const freeCameraRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Free Camera Properties",
            predicate: IsFreeCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <FreeCameraTransformProperties camera={context} />,
                },
            ],
        });
        const arcRotateCameraRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Arc Rotate Camera Properties",
            predicate: IsArcRotateCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <ArcRotateCameraTransformProperties camera={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                arcRotateCameraRegistration.dispose();
                freeCameraRegistration.dispose();
                cameraRegistration.dispose();
            },
        };
    },
};
