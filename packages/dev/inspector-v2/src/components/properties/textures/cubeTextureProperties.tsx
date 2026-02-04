import type { FunctionComponent } from "react";

import type { CubeTexture } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const CubeTextureTransformProperties: FunctionComponent<{ texture: CubeTexture; settings: ISettingsContext }> = (props) => {
    const { texture, settings } = props;

    const [toDisplayAngle, fromDisplayAngle] = useAngleConverters(settings);

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
