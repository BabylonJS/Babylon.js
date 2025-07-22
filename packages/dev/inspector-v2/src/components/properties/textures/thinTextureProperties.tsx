import type { ThinTexture } from "core/index";

import type { FunctionComponent } from "react";

import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

export const ThinTextureGeneralProperties: FunctionComponent<{ texture: ThinTexture }> = (props) => {
    const { texture } = props;

    return (
        <>
            <TextPropertyLine label="Width" value={texture.getSize().width.toString()} />
            <TextPropertyLine label="Height" value={texture.getSize().height.toString()} />
        </>
    );
};
