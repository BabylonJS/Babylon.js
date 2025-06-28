import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";

import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useProperty, useVector3Property } from "../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ISettingsContext } from "../../services/settingsContext";

const RadiansToDegrees = 180 / Math.PI;

export const SpriteTransformProperties: FunctionComponent<{ sprite: Sprite; settings: ISettingsContext }> = (props) => {
    const { sprite, settings } = props;

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);
    const angleMultiplier = useDegrees ? RadiansToDegrees : 1;
    const max = Math.PI * 2 * angleMultiplier;
    const step = useDegrees ? 1 : 0.01;

    const width = useProperty(sprite, "width");
    const height = useProperty(sprite, "height");
    const angle = useProperty(sprite, "angle") * angleMultiplier;
    const position = useVector3Property(sprite, "position");

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (sprite.position = val)} />
            <SyncedSliderLine
                key="Angle"
                label="Angle"
                description="Rotation angle of the sprite"
                value={angle}
                min={0}
                max={max}
                step={step}
                onChange={(angle) => (sprite.angle = angle / angleMultiplier)}
            />
            <SyncedSliderLine key="Width" label="Width" description="Width of the sprite (in world space units)" value={width} onChange={(width) => (sprite.width = width)} />
            <SyncedSliderLine
                key="Height"
                label="Height"
                description="Height of the sprite (in world space units)"
                value={height}
                onChange={(height) => (sprite.height = height)}
            />
        </>
    );
};
