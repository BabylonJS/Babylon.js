import type { Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/linkPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { BoundProperty } from "../boundProperty";

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
