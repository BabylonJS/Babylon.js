import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";

import { PlayFilled, StopFilled } from "@fluentui/react-icons";
import { useCallback } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useColor4Property, useProperty } from "../../../hooks/compoundPropertyHooks";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { useAngleConverters } from "../../../hooks/settingsHooks";
import { BoundProperty } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";
import { TexturePreview } from "../textures/texturePreview";

function useMaxCellCount(sprite: Sprite) {
    const manager = sprite.manager;
    const texture = useProperty(manager, "texture");
    const textureSize = texture.getSize();

    let maxCellCount = 0;
    if (!textureSize.width || !textureSize.height) {
        maxCellCount = Math.max(sprite.fromIndex, sprite.toIndex);
    } else {
        maxCellCount = (textureSize.width / manager.cellWidth) * (textureSize.height / manager.cellHeight);
    }

    return maxCellCount;
}

export const SpriteGeneralProperties: FunctionComponent<{ sprite: Sprite; selectionService: ISelectionService }> = (props) => {
    const { sprite, selectionService } = props;

    return (
        <>
            <LinkToEntityPropertyLine
                key="Parent"
                label="Parent"
                description={`Sprite Manager that owns this sprite.`}
                entity={sprite.manager}
                selectionService={selectionService}
            />
            <BoundProperty
                component={SwitchPropertyLine}
                key="IsVisible"
                label="Is Visible"
                description="Whether the sprite is visible or not."
                target={sprite}
                propertyKey="isVisible"
            />
        </>
    );
};

export const SpriteTransformProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    const [toDisplayAngle, fromDisplayAngle, useDegrees] = useAngleConverters();

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Position" target={sprite} propertyKey="position" />
            <BoundProperty
                component={NumberInputPropertyLine}
                key="Angle"
                label="Angle"
                description={`Rotation angle of the sprite in ${useDegrees ? "degrees" : "radians"}`}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "°" : "rad"}
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

export const SpriteAnimationProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    const animationStarted = useObservableState(
        useCallback(() => sprite.animationStarted, [sprite]),
        useInterceptObservable("function", sprite, "playAnimation"),
        useInterceptObservable("function", sprite, "stopAnimation"),
        useInterceptObservable("function", sprite, "_animate")
    );

    const maxCellCount = useMaxCellCount(sprite);

    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                key="Start"
                label="Start"
                description="First frame of the animation."
                min={0}
                max={maxCellCount}
                target={sprite}
                propertyKey="fromIndex"
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                key="End"
                label="End"
                description="Last frame of the animation."
                min={0}
                max={maxCellCount}
                target={sprite}
                propertyKey="toIndex"
            />
            <BoundProperty component={SwitchPropertyLine} key="Loop" label="Loop" description="Whether to loop the animation." target={sprite} propertyKey="loopAnimation" />
            <BoundProperty
                component={NumberInputPropertyLine}
                key="Delay"
                label="Delay"
                description="Delay between frames in milliseconds."
                min={0}
                target={sprite}
                propertyKey="delay"
            />
            <ButtonLine
                uniqueId="Start/Stop"
                label={animationStarted ? "Stop Animation" : "Start Animation"}
                icon={animationStarted ? StopFilled : PlayFilled}
                onClick={() => {
                    if (animationStarted) {
                        sprite.stopAnimation();
                    } else {
                        sprite.playAnimation(sprite.fromIndex, sprite.toIndex, sprite.loopAnimation, sprite.delay);
                    }
                }}
            />
        </>
    );
};

export const SpriteOtherProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    const color = useColor4Property(sprite, "color");

    return (
        <>
            <Color4PropertyLine key="Color" label="Color" description="Color to tint the sprite." value={color} onChange={(col) => (sprite.color = col)} />
            <BoundProperty component={SwitchPropertyLine} key="IsPickable" label="Pickable" target={sprite} propertyKey="isPickable" />
            <BoundProperty component={SwitchPropertyLine} key="UseAlphaForPicking" label="Use Alpha for Picking" target={sprite} propertyKey="useAlphaForPicking" />
        </>
    );
};

export const SpriteCellProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    const maxCellCount = useMaxCellCount(sprite);

    const manager = sprite.manager;
    const texture = manager.texture;
    const size = texture.getSize();

    const cellWidth = useProperty(manager, "cellWidth");
    const cellHeight = useProperty(manager, "cellHeight");
    const cellIndex = useProperty(sprite, "cellIndex");

    const offsetX = (cellIndex * cellWidth) % size.width;
    const offsetY = Math.floor((cellIndex * cellWidth) / size.width) * cellHeight;

    return (
        <>
            <TexturePreview disableToolbar texture={texture} maxHeight="160px" offsetX={offsetX} offsetY={offsetY} width={cellWidth} height={cellHeight} />
            <BoundProperty component={SyncedSliderPropertyLine} key="CellIndex" label="Cell Index" target={sprite} propertyKey="cellIndex" min={0} step={1} max={maxCellCount} />
            <BoundProperty component={SwitchPropertyLine} key="InvertU" label="Invert U" target={sprite} propertyKey="invertU" />
            <BoundProperty component={SwitchPropertyLine} key="InvertV" label="Invert V" target={sprite} propertyKey="invertV" />
        </>
    );
};
