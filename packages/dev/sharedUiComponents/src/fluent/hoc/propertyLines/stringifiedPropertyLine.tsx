import type { ImmutablePrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { TextPropertyLine } from "./textPropertyLine";

type StringifiedPropertyLineProps = PropertyLineProps<number> &
    ImmutablePrimitiveProps<number> & {
        precision?: number;
        units?: string;
        converter?: (value: number) => string;
    };

/**
 * Expects a numerical value and converts it to a fixed string
 * Can pass optional precision, units, and converter function (default uses value.toString())
 * @param props
 * @returns
 */
export const StringifiedPropertyLine: FunctionComponent<StringifiedPropertyLineProps> = (props) => {
    const value = props.precision !== undefined ? props.value.toFixed(props.precision) : props.value;
    return <TextPropertyLine {...props} nullable={false} value={`${value.toString()} ${props.units}`} />;
};
