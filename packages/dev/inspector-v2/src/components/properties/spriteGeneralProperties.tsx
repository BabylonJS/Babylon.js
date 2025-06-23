// eslint-disable-next-line import/no-internal-modules
import type { Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/linkPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";

export const SpriteGeneralProperties: FunctionComponent<{ sprite: Sprite; setSelectedEntity: (entity: unknown) => void }> = (props) => {
    const { sprite, setSelectedEntity } = props;

    return (
        <>
            <LinkPropertyLine
                key="Parent"
                label="Parent"
                description={`Sprite Manager that owns this sprite.`}
                value={sprite.manager.name}
                onLink={() => setSelectedEntity(sprite.manager)}
            />
            <SwitchPropertyLine
                key="SpriteIsVisible"
                label="Is visible"
                description="Whether the sprite is visible or not."
                value={sprite.isVisible}
                onChange={(checked) => (sprite.isVisible = checked)}
            />
        </>
    );
};
