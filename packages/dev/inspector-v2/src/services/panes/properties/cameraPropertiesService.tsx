import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISettingsContext } from "../../../services/settingsContext";
import type { IPropertiesService } from "./propertiesService";

// import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Camera } from "core/Cameras/camera";
import { FollowCamera } from "core/Cameras/followCamera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { TargetCamera } from "core/Cameras/targetCamera";
import {
    ArcRotateCameraTransformProperties,
    ArcRotateCameraBehaviorsProperties,
    ArcRotateCameraCollisionProperties,
    ArcRotateCameraControlProperties,
    ArcRotateCameraLimitsProperties,
} from "../../../components/properties/cameras/arcRotateCameraProperties";
import { CameraGeneralProperties } from "../../../components/properties/cameras/cameraProperties";
import { FollowCameraLimitsProperties, FollowCameraTransformProperties } from "../../../components/properties/cameras/followCameraProperties";
import { FreeCameraCollisionProperties, FreeCameraControlProperties, FreeCameraTransformProperties } from "../../../components/properties/cameras/freeCameraProperties";
import { TargetCameraControlProperties, TargetCameraTransformProperties } from "../../../components/properties/cameras/targetCameraProperties";
import { SettingsContextIdentity } from "../../../services/settingsContext";
import { GeneralPropertiesSectionIdentity } from "./commonPropertiesService";
import { PropertiesServiceIdentity } from "./propertiesService";
import { TransformPropertiesSectionIdentity } from "./transformPropertiesService";

export const ControlPropertiesSectionIdentity = Symbol("Control");
export const CollisionPropertiesSectionIdentity = Symbol("Collision");
export const LimitsPropertiesSectionIdentity = Symbol("Limits");
export const BehaviorsPropertiesSectionIdentity = Symbol("Behaviors");

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

        const limitsSectionRegistration = propertiesService.addSection({
            order: 6,
            identity: LimitsPropertiesSectionIdentity,
        });

        const behaviorsSectionRegistration = propertiesService.addSection({
            order: 7,
            identity: BehaviorsPropertiesSectionIdentity,
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

        const targetCameraContentRegistration = propertiesService.addSectionContent({
            key: "Target Camera Properties",
            predicate: (entity: unknown) => entity instanceof TargetCamera,
            content: [
                // "TRANSFORM" section.
                {
                    section: TransformPropertiesSectionIdentity,
                    order: 2,
                    component: ({ context }) => <TargetCameraTransformProperties camera={context} />,
                },
                // "CONTROL" section.
                {
                    section: ControlPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <TargetCameraControlProperties camera={context} />,
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
                // "LIMITS" section.
                {
                    section: LimitsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ArcRotateCameraLimitsProperties camera={context} />,
                },
                // "BEHAVIORS" section.
                {
                    section: BehaviorsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <ArcRotateCameraBehaviorsProperties camera={context} />,
                },
            ],
        });

        const freeCameraContentRegistration = propertiesService.addSectionContent({
            key: "Free Camera Properties",
            predicate: (entity: unknown) => entity instanceof FreeCamera,
            content: [
                // "TRANSFORM" section.
                {
                    section: TransformPropertiesSectionIdentity,
                    order: 2,
                    component: ({ context }) => <FreeCameraTransformProperties camera={context} settings={settingsContext} />,
                },
                // "CONTROL" section.
                {
                    section: ControlPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <FreeCameraControlProperties camera={context} />,
                },
                // "COLLISION" section.
                {
                    section: CollisionPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <FreeCameraCollisionProperties camera={context} />,
                },
            ],
        });

        const followCameraContentRegistration = propertiesService.addSectionContent({
            key: "Follow Camera Properties",
            predicate: (entity: unknown) => entity instanceof FollowCamera,
            content: [
                // "TRANSFORM" section.
                {
                    section: TransformPropertiesSectionIdentity,
                    order: 2,
                    component: ({ context }) => <FollowCameraTransformProperties camera={context} />,
                },
                // "LIMITS" section.
                {
                    section: LimitsPropertiesSectionIdentity,
                    order: 0,
                    component: ({ context }) => <FollowCameraLimitsProperties camera={context} />,
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

                controlSectionRegistration.dispose();
                collisionSectionRegistration.dispose();
                limitsSectionRegistration.dispose();
                behaviorsSectionRegistration.dispose();
            },
        };
    },
};
