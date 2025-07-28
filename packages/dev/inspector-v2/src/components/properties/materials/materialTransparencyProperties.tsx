import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";

const TransparencyModeOptions: DropdownOption[] = [
    { label: "Opaque", value: PBRMaterial.PBRMATERIAL_OPAQUE },
    { label: "Alpha test", value: PBRMaterial.PBRMATERIAL_ALPHATEST },
    { label: "Alpha blend", value: PBRMaterial.PBRMATERIAL_ALPHABLEND },
    { label: "Alpha blend and test", value: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND },
];

export const MaterialTransparencyProperties: FunctionComponent<{ material: Material }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty
                component={NumberDropdownPropertyLine}
                nullable
                defaultValue={PBRMaterial.PBRMATERIAL_OPAQUE}
                key="Transparency mode"
                label="Transparency mode"
                target={material}
                propertyKey="transparencyMode"
                options={TransparencyModeOptions}
            />
        </>
    );
};
