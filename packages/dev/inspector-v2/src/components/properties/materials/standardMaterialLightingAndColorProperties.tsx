import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

/**
 * Displays the lighting and color properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the lighting and color properties.
 */
export const StandardMaterialLightingAndColorProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    return (
        <>
            <BoundProperty component={Color3PropertyLine} label="Diffuse Color" target={standardMaterial} propertyKey="diffuseColor" />
            <BoundProperty component={Color3PropertyLine} label="Specular Color" target={standardMaterial} propertyKey="specularColor" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Specular Power" target={standardMaterial} propertyKey="specularPower" min={0} max={128} step={0.1} />
            <BoundProperty component={Color3PropertyLine} label="Emissive Color" target={standardMaterial} propertyKey="emissiveColor" />
            <BoundProperty component={Color3PropertyLine} label="Ambient Color" target={standardMaterial} propertyKey="ambientColor" />
            <BoundProperty component={SwitchPropertyLine} label="Use Specular Over Alpha" target={standardMaterial} propertyKey="useSpecularOverAlpha" />
        </>
    );
};
