import type { Sprite } from "core/index";

import type { FunctionComponent } from "react";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";
import type { ISelectionService } from "../../../services/selectionService";

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
