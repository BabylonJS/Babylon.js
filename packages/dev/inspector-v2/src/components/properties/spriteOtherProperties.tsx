// eslint-disable-next-line import/no-internal-modules
import type { Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";

export const SpriteOtherProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    return (
        <>
            <Color4PropertyLine key="Color" label="Color" description="Color to tint the sprite." value={sprite.color} onChange={(col) => (sprite.color = col)} />
        </>
    );
};
