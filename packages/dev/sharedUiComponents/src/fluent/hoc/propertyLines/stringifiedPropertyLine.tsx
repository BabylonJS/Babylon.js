import type { ImmutablePrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";
import { PropertyLine } from "./propertyLine";
import type { FunctionComponent } from "react";
import { Body1 } from "@fluentui/react-components";

type StringifiedPropertyLineProps = PropertyLineProps<number> &
    ImmutablePrimitiveProps<number> & {
        precision?: number;
        units?: string;
    };

/**
 * Expects a numerical value and converts it toFixed(if precision is supplied) or toLocaleString
 * Can pass optional units to be appending to the end of the string
 * @param props
 * @returns
 */
export const StringifiedPropertyLine: FunctionComponent<StringifiedPropertyLineProps> = (props) => {
    StringifiedPropertyLine.displayName = "StringifiedPropertyLine";
    const value = props.precision !== undefined ? props.value?.toFixed(props.precision) : props.value?.toLocaleString();
    const withUnits = props.units ? `${value} ${props.units}` : value;
    return (
        <PropertyLine {...props}>
            <Body1 title={props.title}>{withUnits ?? ""}</Body1>
        </PropertyLine>
    );
};
