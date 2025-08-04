import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";

/**
 * Displays the texture properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the texture properties.
 */
export const StandardMaterialTexturesProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    const decalMap = useProperty(standardMaterial, "decalMap");

    // TODO: Add buttons and links for adding the textures themselves
    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Use Lightmap As Shadowmap" target={standardMaterial} propertyKey="useLightmapAsShadowmap" />
            <BoundProperty component={SwitchPropertyLine} label="Use Detailmap" target={standardMaterial.detailMap} propertyKey="isEnabled" />
            {decalMap && <BoundProperty component={SwitchPropertyLine} label="Use Decalmap" target={decalMap} propertyKey="isEnabled" />}
        </>
    );
};
