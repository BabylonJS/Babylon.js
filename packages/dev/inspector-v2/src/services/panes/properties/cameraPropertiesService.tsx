import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";
import type { ISettingsContext } from "../../../services/settingsContext";

// import { Scene } from "core/scene";
import { Camera } from "core/Cameras/camera";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { PropertiesServiceIdentity } from "./propertiesService";
import { SettingsContextIdentity } from "../../../services/settingsContext";
import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { TransformPropertiesSectionIdentity } from "./transformPropertiesService";
import { CameraGeneralProperties } from "../../../components/properties/cameras/cameraGeneralProperties";
import { ArcRotateCameraTransformProperties } from "../../../components/properties/cameras/cameraTransformProperties";

export const CameraPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Camera Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContext) => {
        const cameraContentRegistration = propertiesService.addSectionContent({
            key: "Camera Properties",
            predicate: (entity: unknown) => entity instanceof Camera,
            content: [
                // "GENERAL" section.
                {
                    section: GeneralPropertiesSectionIdentity,
                    order: 1,
                    component: ({ context }) => <CameraGeneralProperties camera={context} settings={settingsContext} />,
                },
            ],
        });

        const arcRotateCameraContentRegistration = propertiesService.addSectionContent({
            key: "Arc Rotate Camera Properties",
            predicate: (entity: unknown) => entity instanceof ArcRotateCamera,
            content: [
                // "TRANSFORM" section.
                {
                    section: TransformPropertiesSectionIdentity,
                    order: 2,
                    component: ({ context }) => <ArcRotateCameraTransformProperties camera={context} settings={settingsContext} />,
                },
            ],
        });

        return {
            dispose: () => {
                cameraContentRegistration.dispose();
                arcRotateCameraContentRegistration.dispose();
            },
        };
    },
};
