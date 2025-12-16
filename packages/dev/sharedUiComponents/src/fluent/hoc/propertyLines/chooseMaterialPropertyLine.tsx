import type { FunctionComponent } from "react";
import type { Material } from "core/Materials/material";
import type { Nullable } from "core/types";
import type { PropertyLineProps } from "./propertyLine";
import type { ChooseMaterialProps } from "../../primitives/chooseMaterial";

import { PropertyLine } from "./propertyLine";
import { ChooseMaterial } from "../../primitives/chooseMaterial";

type ChooseMaterialPropertyLineProps = PropertyLineProps<Nullable<Material>> & ChooseMaterialProps;

/**
 * A property line with a ComboBox for selecting from existing scene materials.
 * @param props - ChooseMaterialProps & PropertyLineProps
 * @returns property-line wrapped ChooseMaterial component
 */
export const ChooseMaterialPropertyLine: FunctionComponent<ChooseMaterialPropertyLineProps> = (props) => {
    ChooseMaterialPropertyLine.displayName = "ChooseMaterialPropertyLine";

    return (
        <PropertyLine {...props}>
            <ChooseMaterial {...props} />
        </PropertyLine>
    );
};
