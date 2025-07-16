import type { FunctionComponent } from "react";

import type { ArcRotateCamera } from "core/index";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

export const ArcRotateCameraCollisionProperties: FunctionComponent<{ camera: ArcRotateCamera }> = (props) => {
    const { camera } = props;

    const collisionRadius = useProperty(camera, "collisionRadius");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" target={camera} propertyKey="checkCollisions" />
            <Vector3PropertyLine label="Collision Radius" value={collisionRadius} onChange={(val) => (camera.collisionRadius = val)} />
        </>
    );
};
