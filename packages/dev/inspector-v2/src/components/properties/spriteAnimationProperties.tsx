import type { FunctionComponent } from "react";

import type { Sprite } from "core/index";

import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";

export const SpriteAnimationProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    return (
        <>
            <FloatInputPropertyLine
                key="Start"
                label="Start"
                description="First frame of the animation."
                min={0}
                value={sprite.fromIndex}
                onChange={(start) => (sprite.fromIndex = start)}
            />
            <FloatInputPropertyLine key="End" label="End" description="Last frame of the animation." min={0} value={sprite.toIndex} onChange={(end) => (sprite.toIndex = end)} />
            <SwitchPropertyLine
                key="Loop"
                label="Loop"
                description="Whether to loop the animation."
                value={sprite.loopAnimation}
                onChange={(checked) => (sprite.loopAnimation = checked)}
            />
            <FloatInputPropertyLine
                key="Delay"
                label="Delay"
                description="Delay start of the animation in milliseconds."
                min={0}
                value={sprite.delay}
                onChange={(delay) => (sprite.delay = delay)}
            />
        </>
    );
};
