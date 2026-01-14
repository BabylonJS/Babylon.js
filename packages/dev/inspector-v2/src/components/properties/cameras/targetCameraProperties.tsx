import type { FunctionComponent } from "react";

import type { TargetCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { BoundProperty } from "../boundProperty";

export const TargetCameraTransformProperties: FunctionComponent<{ camera: TargetCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Target" description="The point the camera looks at." target={camera} propertyKey="target" />
        </>
    );
};

export const TargetCameraControlProperties: FunctionComponent<{ camera: TargetCamera }> = (props) => {
    const { camera } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Speed" target={camera} propertyKey="speed" />
        </>
    );
};
