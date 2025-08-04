import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";

/**
 * Displays the levels properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the levels properties.
 */
export const StandardMaterialLevelsProperties: FunctionComponent<{ standardMaterial: StandardMaterial }> = (props) => {
    const { standardMaterial } = props;

    const diffuseTexture = useProperty(standardMaterial, "diffuseTexture");

    return (
        <>
            {diffuseTexture && <BoundProperty component={SyncedSliderPropertyLine} label="Diffuse Level" target={diffuseTexture} propertyKey="level" min={0} max={2} step={0.01} />}
        </>
    );
};
