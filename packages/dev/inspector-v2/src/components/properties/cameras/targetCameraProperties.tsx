import type { FunctionComponent } from "react";

import type { TargetCamera } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const TargetCameraTransformProperties: FunctionComponent<{ camera: TargetCamera }> = (props) => {
    const { camera } = props;

    const target = useProperty(camera, "target");

    return (
        <>
            <Vector3PropertyLine label="Target" description="The point the camera looks at." value={target} onChange={(value) => (camera.target = value)} />
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
