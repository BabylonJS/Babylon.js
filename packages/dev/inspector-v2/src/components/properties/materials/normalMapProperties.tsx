import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

type MaterialWithPublicNormalMaps = {
    invertNormalMapX: boolean;
    invertNormalMapY: boolean;
};

type MaterialWithInternalNormalMaps = {
    _invertNormalMapX: boolean;
    _invertNormalMapY: boolean;
};

export type MaterialWithNormalMaps = MaterialWithPublicNormalMaps | MaterialWithInternalNormalMaps;

function IsMaterialWithPublicNormalMaps(mat: MaterialWithNormalMaps): mat is MaterialWithPublicNormalMaps {
    return (mat as MaterialWithPublicNormalMaps).invertNormalMapX !== undefined;
}

/**
 * Displays the normal map properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the normal map properties.
 */
export const NormalMapProperties: FunctionComponent<{ material: MaterialWithNormalMaps }> = (props) => {
    const { material } = props;

    return (
        <>
            {IsMaterialWithPublicNormalMaps(material) ? (
                <>
                    <BoundProperty component={SwitchPropertyLine} label="Invert X Axis" target={material} propertyKey="invertNormalMapX" />
                    <BoundProperty component={SwitchPropertyLine} label="Invert Y Axis" target={material} propertyKey="invertNormalMapY" />
                </>
            ) : (
                <>
                    <BoundProperty component={SwitchPropertyLine} label="Invert X Axis" target={material} propertyKey="_invertNormalMapX" />
                    <BoundProperty component={SwitchPropertyLine} label="Invert Y Axis" target={material} propertyKey="_invertNormalMapY" />
                </>
            )}
        </>
    );
};
