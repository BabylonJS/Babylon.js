import type { ThinTexture } from "core/index";

import type { FunctionComponent } from "react";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";

export const ThinTextureGeneralProperties: FunctionComponent<{ texture: ThinTexture }> = (props) => {
    const { texture } = props;

    return (
        <>
            <StringifiedPropertyLine label="Width" value={texture.getSize().width} units="px" />
            <StringifiedPropertyLine label="Height" value={texture.getSize().height} units="px" />
        </>
    );
};
