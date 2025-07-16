import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../../services/settingsContext";
import type { IPropertiesService } from "./propertiesService";

// import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Camera } from "core/Cameras/camera";
import { ArcRotateCameraCollisionProperties } from "../../../components/properties/cameras/arcRotateCameraCollisionProperties";
import { ArcRotateCameraControlProperties } from "../../../components/properties/cameras/arcRotateCameraControlProperties";
import { ArcRotateCameraTransformProperties } from "../../../components/properties/cameras/arcRotateCameraTransformProperties";
import { CameraGeneralProperties } from "../../../components/properties/cameras/cameraGeneralProperties";
import { SettingsContextIdentity } from "../../../services/settingsContext";
import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { TransformPropertiesSectionIdentity } from "./transformPropertiesService";

export const ControlPropertiesSectionIdentity = Symbol("Control");
export const CollisionPropertiesSectionIdentity = Symbol("Collision");

export const CameraPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Camera Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContext) => {
        const controlSectionRegistration = propertiesService.addSection({
            order: 4,
            identity: ControlPropertiesSectionIdentity,
        });

        const collisionSectionRegistration = propertiesService.addSection({
            order: 5,
            identity: CollisionPropertiesSectionIdentity,
        });

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
                // "CONTROL" section.
                {
                    section: ControlPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ArcRotateCameraControlProperties camera={context} />,
                },
                // "COLLISION" section.
                {
                    section: CollisionPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ArcRotateCameraCollisionProperties camera={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                cameraContentRegistration.dispose();
                arcRotateCameraContentRegistration.dispose();
                controlSectionRegistration.dispose();
                collisionSectionRegistration.dispose();
            },
        };
    },
};
