// eslint-disable-next-line import/no-internal-modules
import type { Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { IntegerPropertyLine } from "shared-ui-components/fluent/hoc/integerPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";

export const SpriteAnimationProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    return (
        <>
            <IntegerPropertyLine
                key="Start"
                label="Start"
                description="First frame of the animation."
                min={0}
                defaultValue={sprite.fromIndex}
                onChange={(evt, data) => (data.value ? (sprite.fromIndex = data.value) : (sprite.fromIndex = 0))}
            />
            <IntegerPropertyLine
                key="End"
                label="End"
                description="Last frame of the animation."
                min={0}
                defaultValue={sprite.toIndex}
                onChange={(evt, data) => (data.value ? (sprite.toIndex = data.value) : (sprite.toIndex = 0))}
            />
            <SwitchPropertyLine
                key="Loop"
                label="Loop"
                description="Whether to loop the animation."
                value={sprite.loopAnimation}
                onChange={(checked) => (sprite.loopAnimation = checked)}
            />
            <IntegerPropertyLine
                key="Delay"
                label="Delay"
                description="Delay start of the animation in milliseconds."
                min={0}
                defaultValue={sprite.delay}
                onChange={(evt, data) => (data.value ? (sprite.delay = data.value) : (sprite.delay = 0))}
            />
        </>
    );
};
