import type { Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { useColor4Property } from "../../../hooks/compoundPropertyHooks";

export const SpriteOtherProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    const color = useColor4Property(sprite, "color");

    return (
        <>
            <Color4PropertyLine key="Color" label="Color" description="Color to tint the sprite." value={color} onChange={(col) => (sprite.color = col)} />
        </>
    );
};
