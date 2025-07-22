import type { Texture } from "core/index";

import type { FunctionComponent } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

export const TexturePreviewProperties: FunctionComponent<{ texture: Texture }> = (props) => {
    const { texture } = props;

    const rawUrl = useProperty(texture, "url");
    const displayUrl = !rawUrl || rawUrl.substring(0, 4) === "data" || rawUrl.substring(0, 4) === "blob" ? "" : rawUrl;

    return (
        <>
            <TextInputPropertyLine
                label="URL"
                value={displayUrl}
                onChange={(value) => {
                    texture.updateURL(value);
                }}
            />
        </>
    );
};
