// eslint-disable-next-line import/no-internal-modules
import { Vector2, type Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { Vector2PropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";

import { useObservableState } from "../../hooks/observableHooks";
import { UseVector3Property } from "../../hooks/useVectorProperty";
import type { ISettingsContext } from "../../services/settingsContext";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";

export const SpriteTransformProperties: FunctionComponent<{ sprite: Sprite; settings: ISettingsContext }> = (props) => {
    const { sprite, settings } = props;

    const newVector = useObservableState(
        () => new Vector2(sprite.width, sprite.height),
        useInterceptObservable("property", sprite, "width"),
        useInterceptObservable("property", sprite, "height")
    );

    const position = UseVector3Property(sprite, "position");
    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);
    const max = settings.useDegrees ? 360 : 2 * Math.PI;
    const step = settings.useDegrees ? 1 : 0.01;

    return (
        <>
            <Vector3PropertyLine key="PositionTransform" label="Position" value={position} onChange={(val) => (sprite.position = val)} />
            <SyncedSliderLine
                key="Angle"
                label="Angle"
                description="Rotation angle of the sprite"
                value={sprite.angle}
                min={0}
                max={max}
                step={step}
                onChange={(ang) => (sprite.angle = ang)}
                useDegrees={useDegrees}
            />
            <Vector2PropertyLine
                key="Size"
                label="Size"
                xName="Width"
                yName="Height"
                value={newVector}
                onChange={(val) => {
                    sprite.width = val.x;
                    sprite.height = val.y;
                }}
            />
        </>
    );
};
