import type { MultiRenderTarget } from "core/index";

import type { FunctionComponent } from "react";

import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { BoundProperty } from "../boundProperty";

export const MultiRenderTargetGeneralProperties: FunctionComponent<{ texture: MultiRenderTarget }> = (props) => {
    const { texture } = props;

    return (
        <>
            <BoundProperty component={StringifiedPropertyLine} label="Count" description="The number of render target textures." target={texture} propertyKey="count" />
        </>
    );
};
