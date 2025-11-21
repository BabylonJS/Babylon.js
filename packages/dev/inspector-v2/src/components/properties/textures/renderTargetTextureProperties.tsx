import type { RenderTargetTexture } from "core/index";

import type { FunctionComponent } from "react";

import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { FindTextureFormat } from "./textureFormatUtils";

export const RenderTargetTextureGeneralProperties: FunctionComponent<{ texture: RenderTargetTexture }> = (props) => {
    const { texture } = props;

    const depthStencilTexture = useProperty(texture.renderTarget, "_depthStencilTexture");
    const depthStencilTextureDisplayFormat = depthStencilTexture ? FindTextureFormat(depthStencilTexture.format) : null;

    return (
        <>
            {depthStencilTextureDisplayFormat ? (
                <TextPropertyLine label="Depth/Stencil Format" value={depthStencilTextureDisplayFormat.label} />
            ) : (
                <BooleanBadgePropertyLine label="Depth/Stencil Texture" value={false} />
            )}
        </>
    );
};
