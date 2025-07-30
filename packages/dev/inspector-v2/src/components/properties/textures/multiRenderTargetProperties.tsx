import type { MultiRenderTarget } from "core/index";

import type { FunctionComponent } from "react";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

export const MultiRenderTargetGeneralProperties: FunctionComponent<{ texture: MultiRenderTarget }> = (props) => {
    const { texture } = props;

    const count = useProperty(texture, "count");

    return (
        <>
            <StringifiedPropertyLine label="Count" description="The number of render target textures." value={count} />
        </>
    );
};
