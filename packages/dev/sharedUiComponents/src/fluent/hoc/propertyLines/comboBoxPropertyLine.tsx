import type { FunctionComponent } from "react";
import type { PropertyLineProps } from "./propertyLine";
import type { ComboBoxProps } from "../../primitives/comboBox";

import { PropertyLine } from "./propertyLine";
import { ComboBox } from "../../primitives/comboBox";

type ComboBoxPropertyLineProps = ComboBoxProps & PropertyLineProps<string>;

/**
 * A property line with a filterable ComboBox
 * @param props - ComboBoxProps & PropertyLineProps
 * @returns property-line wrapped ComboBox component
 */
export const ComboBoxPropertyLine: FunctionComponent<ComboBoxPropertyLineProps> = (props) => {
    ComboBoxPropertyLine.displayName = "ComboBoxPropertyLine";

    return (
        <PropertyLine {...props}>
            <ComboBox {...props} />
        </PropertyLine>
    );
};
