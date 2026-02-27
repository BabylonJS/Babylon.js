import type { FunctionComponent } from "react";

import type { CubeTexture } from "core/index";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const CubeTextureTransformProperties: FunctionComponent<{ texture: CubeTexture }> = (props) => {
    const { texture } = props;

    const [toDisplayAngle, fromDisplayAngle] = useAngleConverters();

    return (
        <BoundProperty
            component={SyncedSliderPropertyLine}
            label="Rotation Y"
            target={texture}
            propertyKey="rotationY"
            min={0}
            max={toDisplayAngle(Math.PI * 2)}
            step={0.0001}
            convertTo={(value) => toDisplayAngle(value, true)}
            convertFrom={fromDisplayAngle}
        />
    );
};
