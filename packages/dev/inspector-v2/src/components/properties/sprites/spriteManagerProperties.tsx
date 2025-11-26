import type { FunctionComponent } from "react";

import type { SpriteManager } from "core/Sprites/spriteManager";
import type { ISelectionService } from "../../../services/selectionService";

import { RenderingManager } from "core/Rendering/renderingManager";
import { AlphaModeOptions } from "shared-ui-components/constToOptionsMaps";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SpinButtonPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/spinButtonPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";

export const SpriteManagerGeneralProperties: FunctionComponent<{ spriteManager: SpriteManager; selectionService: ISelectionService }> = (props) => {
    const { spriteManager, selectionService } = props;

    const texture = useProperty(spriteManager, "texture");

    return (
        <>
            <TextPropertyLine label="Capacity" value={spriteManager.capacity.toString()} />
            <LinkToEntityPropertyLine label="Texture" entity={texture} selectionService={selectionService} />
        </>
    );
};

export const SpriteManagerOtherProperties: FunctionComponent<{ spriteManager: SpriteManager }> = (props) => {
    const { spriteManager } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} key="IsPickable" label="Pickable" target={spriteManager} propertyKey="isPickable" />
            <BoundProperty component={SwitchPropertyLine} key="FogEnabled" label="Fog Enabled" target={spriteManager} propertyKey="fogEnabled" />
            <BoundProperty
                component={SwitchPropertyLine}
                key="DepthWrite"
                label="Depth Write"
                target={spriteManager}
                propertyKey="disableDepthWrite"
                convertTo={(value) => !value}
                convertFrom={(value) => !value}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                key="RenderingGroupId"
                label="Rendering Group ID"
                target={spriteManager}
                propertyKey="renderingGroupId"
                min={RenderingManager.MIN_RENDERINGGROUPS}
                max={RenderingManager.MAX_RENDERINGGROUPS}
                step={1}
            />
            <BoundProperty component={NumberDropdownPropertyLine} key="BlendMode" label="Blend Mode" target={spriteManager} propertyKey="blendMode" options={AlphaModeOptions} />
        </>
    );
};

export const SpriteManagerCellProperties: FunctionComponent<{ spriteManager: SpriteManager }> = (props) => {
    const { spriteManager } = props;

    return (
        <>
            <BoundProperty component={SpinButtonPropertyLine} key="CellWidth" label="Cell Width" target={spriteManager} propertyKey="cellWidth" min={1} step={1} />
            <BoundProperty component={SpinButtonPropertyLine} key="CellHeight" label="Cell Height" target={spriteManager} propertyKey="cellHeight" min={1} step={1} />
        </>
    );
};
