import type { FunctionComponent } from "react";

import { BoundProperty } from "../boundProperty";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

export type MaterialWithNormalMaps = {
    invertNormalMapX: boolean;
    invertNormalMapY: boolean;
};

/**
 * Displays the normal map properties of a standard material.
 * @param props - The required properties
 * @returns A JSX element representing the normal map properties.
 */
export const NormalMapProperties: FunctionComponent<{ material: MaterialWithNormalMaps }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Invert X Axis" target={material} propertyKey="invertNormalMapX" />
            <BoundProperty component={SwitchPropertyLine} label="Invert Y Axis" target={material} propertyKey="invertNormalMapY" />
        </>
    );
};
