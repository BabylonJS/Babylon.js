// eslint-disable-next-line import/no-internal-modules
import type { Sprite, Vector3 } from "core/index";

import type { FunctionComponent } from "react";

import { Color4PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { SyncedSliderLine } from "shared-ui-components/fluent/hoc/syncedSliderLine";

export const SpriteOtherProperties: FunctionComponent<{ sprite: Sprite }> = (props) => {
    const { sprite } = props;

    return (
        <>
            <Color4PropertyLine key="Color" label="Color" value={sprite.color} onChange={(col) => (sprite.color = col)} />
            <SyncedSliderLine key="Angle" label="Angle" value={sprite.angle} min={0} max={Math.PI * 2} step={0.01} onChange={(ang) => (sprite.angle = ang)} />
        </>
    );
};
