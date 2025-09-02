import type { FunctionComponent } from "react";

import type { FollowCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const FollowCameraTransformProperties: FunctionComponent<{ camera: FollowCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Radius" target={camera} propertyKey="radius" />
            <BoundProperty component={NumberInputPropertyLine} label="Rotation Offset" target={camera} propertyKey="rotationOffset" />
            <BoundProperty component={NumberInputPropertyLine} label="Height Offset" target={camera} propertyKey="heightOffset" />
            <BoundProperty component={NumberInputPropertyLine} label="Camera Acceleration" target={camera} propertyKey="cameraAcceleration" />
        </>
    );
};

export const FollowCameraLimitsProperties: FunctionComponent<{ camera: FollowCamera }> = (props) => {
    const { camera } = props;

    const lowerRadiusLimit = useProperty(camera, "lowerRadiusLimit") ?? 0;
    const upperRadiusLimit = useProperty(camera, "upperRadiusLimit") ?? 0;
    const lowerRotationOffsetLimit = useProperty(camera, "lowerRotationOffsetLimit") ?? 0;
    const upperRotationOffsetLimit = useProperty(camera, "upperRotationOffsetLimit") ?? 0;
    const lowerHeightOffsetLimit = useProperty(camera, "lowerHeightOffsetLimit") ?? 0;
    const upperHeightOffsetLimit = useProperty(camera, "upperHeightOffsetLimit") ?? 0;
    const maxCameraSpeed = useProperty(camera, "maxCameraSpeed") ?? 0;

    return (
        <>
            <NumberInputPropertyLine label="Lower Radius Limit" value={lowerRadiusLimit} onChange={(val) => (camera.lowerRadiusLimit = val)} />
            <NumberInputPropertyLine label="Upper Radius Limit" value={upperRadiusLimit} onChange={(val) => (camera.upperRadiusLimit = val)} />
            <NumberInputPropertyLine label="Lower Rotation Offset Limit" value={lowerRotationOffsetLimit} onChange={(val) => (camera.lowerRotationOffsetLimit = val)} />
            <NumberInputPropertyLine label="Upper Rotation Offset Limit" value={upperRotationOffsetLimit} onChange={(val) => (camera.upperRotationOffsetLimit = val)} />
            <NumberInputPropertyLine label="Lower Height Offset Limit" value={lowerHeightOffsetLimit} onChange={(val) => (camera.lowerHeightOffsetLimit = val)} />
            <NumberInputPropertyLine label="Upper Height Offset Limit" value={upperHeightOffsetLimit} onChange={(val) => (camera.upperHeightOffsetLimit = val)} />
            <NumberInputPropertyLine label="Max Camera Speed" value={maxCameraSpeed} onChange={(val) => (camera.maxCameraSpeed = val)} />
        </>
    );
};
