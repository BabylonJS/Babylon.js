import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";

import { useCallback } from "react";

import { PlayFilled, StopFilled } from "@fluentui/react-icons";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

export const SpriteAnimationProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    const animationStarted = useObservableState(
        useCallback(() => sprite.animationStarted, [sprite]),
        useInterceptObservable("function", sprite, "playAnimation"),
        useInterceptObservable("function", sprite, "stopAnimation"),
        useInterceptObservable("function", sprite, "_animate")
    );

    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                key="Start"
                label="Start"
                description="First frame of the animation."
                min={0}
                target={sprite}
                propertyKey="fromIndex"
            />
            <BoundProperty component={NumberInputPropertyLine} key="End" label="End" description="Last frame of the animation." min={0} target={sprite} propertyKey="toIndex" />
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
