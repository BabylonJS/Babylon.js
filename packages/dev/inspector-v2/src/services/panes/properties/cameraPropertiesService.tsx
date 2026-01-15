import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../../services/settingsContext";
import type { IPropertiesService } from "./propertiesService";

// import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Camera } from "core/Cameras/camera";
import { FollowCamera } from "core/Cameras/followCamera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { GeospatialCamera } from "core/Cameras/geospatialCamera";
import { TargetCamera } from "core/Cameras/targetCamera";
import {
    ArcRotateCameraTransformProperties,
    ArcRotateCameraBehaviorsProperties,
    ArcRotateCameraCollisionProperties,
    ArcRotateCameraControlProperties,
    ArcRotateCameraLimitsProperties,
} from "../../../components/properties/cameras/arcRotateCameraProperties";
import {
    GeospatialCameraTransformProperties,
    GeospatialCameraCollisionProperties,
    GeospatialCameraLimitsProperties,
} from "../../../components/properties/cameras/geospatialCameraProperties";
import { CameraGeneralProperties } from "../../../components/properties/cameras/cameraProperties";
import { FollowCameraLimitsProperties, FollowCameraTransformProperties } from "../../../components/properties/cameras/followCameraProperties";
import { FreeCameraCollisionProperties, FreeCameraControlProperties, FreeCameraTransformProperties } from "../../../components/properties/cameras/freeCameraProperties";
import { TargetCameraControlProperties, TargetCameraTransformProperties } from "../../../components/properties/cameras/targetCameraProperties";
import { SettingsContextIdentity } from "../../../services/settingsContext";
import { PropertiesServiceIdentity } from "./propertiesService";

export const ControlPropertiesSectionIdentity = Symbol("Control");
export const CollisionPropertiesSectionIdentity = Symbol("Collision");
export const LimitsPropertiesSectionIdentity = Symbol("Limits");
export const BehaviorsPropertiesSectionIdentity = Symbol("Behaviors");

export const CameraPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, ISettingsContext]> = {
    friendlyName: "Camera Properties",
    consumes: [PropertiesServiceIdentity, SettingsContextIdentity],
    factory: (propertiesService, settingsContext) => {
        const cameraContentRegistration = propertiesService.addSectionContent({
            key: "Camera Properties",
            predicate: (entity: unknown) => entity instanceof Camera,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <CameraGeneralProperties camera={context} settings={settingsContext} />,
                },
            ],
        });

        const targetCameraContentRegistration = propertiesService.addSectionContent({
            key: "Target Camera Properties",
            predicate: (entity: unknown) => entity instanceof TargetCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <TargetCameraTransformProperties camera={context} />,
                },
                {
                    section: "Control",
                    component: ({ context }) => <TargetCameraControlProperties camera={context} />,
                },
            ],
        });

        const arcRotateCameraContentRegistration = propertiesService.addSectionContent({
            key: "Arc Rotate Camera Properties",
            predicate: (entity: unknown) => entity instanceof ArcRotateCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <ArcRotateCameraTransformProperties camera={context} settings={settingsContext} />,
                },
                {
                    section: "Control",
                    component: ({ context }) => <ArcRotateCameraControlProperties camera={context} />,
                },
                {
                    section: "Collision",
                    component: ({ context }) => <ArcRotateCameraCollisionProperties camera={context} />,
                },
                {
                    section: "Limits",
                    component: ({ context }) => <ArcRotateCameraLimitsProperties camera={context} />,
                },
                {
                    section: "Behaviors",
                    component: ({ context }) => <ArcRotateCameraBehaviorsProperties camera={context} />,
                },
            ],
        });

        const freeCameraContentRegistration = propertiesService.addSectionContent({
            key: "Free Camera Properties",
            predicate: (entity: unknown) => entity instanceof FreeCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <FreeCameraTransformProperties camera={context} settings={settingsContext} />,
                },
                {
                    section: "Control",
                    component: ({ context }) => <FreeCameraControlProperties camera={context} />,
                },
                {
                    section: "Collision",
                    component: ({ context }) => <FreeCameraCollisionProperties camera={context} />,
                },
            ],
        });

        const followCameraContentRegistration = propertiesService.addSectionContent({
            key: "Follow Camera Properties",
            predicate: (entity: unknown) => entity instanceof FollowCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <FollowCameraTransformProperties camera={context} />,
                },
                {
                    section: "Limits",
                    component: ({ context }) => <FollowCameraLimitsProperties camera={context} />,
                },
            ],
        });

        const geospatialCameraContentRegistration = propertiesService.addSectionContent({
            key: "Geospatial Camera Properties",
            predicate: (entity: unknown) => entity instanceof GeospatialCamera,
            content: [
                {
                    section: "Transform",
                    component: ({ context }) => <GeospatialCameraTransformProperties camera={context} settings={settingsContext} />,
                },
                {
                    section: "Collision",
                    component: ({ context }) => <GeospatialCameraCollisionProperties camera={context} />,
                },
                {
                    section: "Limits",
                    component: ({ context }) => <GeospatialCameraLimitsProperties camera={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                cameraContentRegistration.dispose();
                targetCameraContentRegistration.dispose();
                arcRotateCameraContentRegistration.dispose();
                freeCameraContentRegistration.dispose();
                followCameraContentRegistration.dispose();
                geospatialCameraContentRegistration.dispose();
            },
        };
    },
};
