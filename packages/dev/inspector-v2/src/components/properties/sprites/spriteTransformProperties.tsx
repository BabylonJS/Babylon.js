import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";

export const SpriteTransformProperties: FunctionComponent<{ sprite: Sprite; settings: ISettingsContext }> = (props) => {
    const { sprite, settings } = props;

    const position = useVector3Property(sprite, "position");

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters(settings);

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (sprite.position = val)} />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                key="Angle"
                label="Angle"
                description={`Rotation angle of the sprite in ${useDegrees ? "degrees" : "radians"}`}
                min={0}
                max={toDisplayAngle(Math.PI * 2)}
                step={toDisplayAngle(0.01)}
                target={sprite}
                propertyKey="angle"
                convertTo={toDisplayAngle}
                convertFrom={fromDisplayAngle}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                key="Width"
                label="Width"
                description="Width of the sprite (in world space units)"
                target={sprite}
                propertyKey="width"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                key={"Height"}
                label="Height"
                description="Height of the sprite (in world space units)"
                target={sprite}
                propertyKey="height"
            />
        </>
    );
};
