import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";

import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useVector3Property } from "../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ISettingsContext } from "../../services/settingsContext";
import { BoundProperty } from "./boundProperty";

const RadiansToDegrees = 180 / Math.PI;

export const SpriteTransformProperties: FunctionComponent<{ sprite: Sprite; settings: ISettingsContext }> = (props) => {
    const { sprite, settings } = props;

    const position = useVector3Property(sprite, "position");

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);
    const angleMultiplier = useDegrees ? RadiansToDegrees : 1;

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (sprite.position = val)} />
            <BoundProperty
                component={SyncedSliderLine}
                key="Angle2"
                label="Angle"
                description="Rotation angle of the sprite"
                min={0}
                max={Math.PI * 2 * angleMultiplier}
                step={useDegrees ? 1 : 0.01}
                target={sprite}
                propertyKey="angle"
                convertTo={(angle) => angle * angleMultiplier}
                convertFrom={(angle) => angle / angleMultiplier}
            />
            <BoundProperty component={SyncedSliderLine} key="Width" label="Width" description="Width of the sprite (in world space units)" target={sprite} propertyKey="width" />
            <BoundProperty
                component={SyncedSliderLine}
                key={"Height"}
                label="Height"
                description="Height of the sprite (in world space units)"
                target={sprite}
                propertyKey="height"
            />
        </>
    );
};
