import type { FunctionComponent } from "react";
import type { Node } from "core/node";
import type { Nullable } from "core/types";
import type { PropertyLineProps } from "./propertyLine";
import type { ChooseNodeProps } from "../../primitives/chooseNode";

import { PropertyLine } from "./propertyLine";
import { ChooseNode } from "../../primitives/chooseNode";

type ChooseNodePropertyLineProps = PropertyLineProps<Nullable<Node>> & ChooseNodeProps;

/**
 * A property line with a ComboBox for selecting from existing scene nodes.
 * @param props - ChooseNodeProps & PropertyLineProps
 * @returns property-line wrapped ChooseNode component
 */
export const ChooseNodePropertyLine: FunctionComponent<ChooseNodePropertyLineProps> = (props) => {
    ChooseNodePropertyLine.displayName = "ChooseNodePropertyLine";

    return (
        <PropertyLine {...props}>
            <ChooseNode {...props} />
        </PropertyLine>
    );
};
