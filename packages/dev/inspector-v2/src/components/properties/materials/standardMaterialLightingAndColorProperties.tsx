import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";

export const StandardMaterialLightingAndColorProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Diffuse color" target={standardMaterial} propertyKey="diffuseColor" />
        </>
    );
};
