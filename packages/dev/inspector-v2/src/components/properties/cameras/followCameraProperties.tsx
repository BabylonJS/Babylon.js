import type { FunctionComponent } from "react";

import type { FollowCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
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

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Lower Radius Limit" target={camera} propertyKey="lowerRadiusLimit" nullable defaultValue={0} />
            <BoundProperty component={NumberInputPropertyLine} label="Upper Radius Limit" target={camera} propertyKey="upperRadiusLimit" nullable defaultValue={0} />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Lower Rotation Offset Limit"
                target={camera}
                propertyKey="lowerRotationOffsetLimit"
                nullable
                defaultValue={0}
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Upper Rotation Offset Limit"
                target={camera}
                propertyKey="upperRotationOffsetLimit"
                nullable
                defaultValue={0}
            />
            <BoundProperty component={NumberInputPropertyLine} label="Lower Height Offset Limit" target={camera} propertyKey="lowerHeightOffsetLimit" nullable defaultValue={0} />
            <BoundProperty component={NumberInputPropertyLine} label="Upper Height Offset Limit" target={camera} propertyKey="upperHeightOffsetLimit" nullable defaultValue={0} />
            <BoundProperty component={NumberInputPropertyLine} label="Max Camera Speed" target={camera} propertyKey="maxCameraSpeed" />
        </>
    );
};
