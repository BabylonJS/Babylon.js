import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { BoundProperty } from "./boundProperty";

export const SpriteAnimationProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

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
        </>
    );
};
