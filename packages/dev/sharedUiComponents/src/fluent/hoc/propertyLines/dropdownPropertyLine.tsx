import { makeStyles } from "@fluentui/react-components";
import { Dropdown, type AcceptedDropdownValue, type DropdownProps } from "../../primitives/dropdown";
import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { forwardRef, type FunctionComponent } from "react";
import { UniformWidthStyling } from "../../primitives/utils";

const useStyles = makeStyles({
    dropdown: {
        ...UniformWidthStyling,
    },
});

type DropdownPropertyLineProps<V extends AcceptedDropdownValue> = DropdownProps<V> & PropertyLineProps<V>;

/**
 * Wraps a dropdown in a property line
 * @param props - PropertyLineProps and DropdownProps
 * @returns property-line wrapped dropdown
 */

export const DropdownPropertyLine = forwardRef<HTMLDivElement, DropdownPropertyLineProps<AcceptedDropdownValue>>((props, ref) => {
    DropdownPropertyLine.displayName = "DropdownPropertyLine";
    const classes = useStyles();
    return (
        <PropertyLine {...props} ref={ref}>
            <Dropdown {...props} className={classes.dropdown} />
        </PropertyLine>
    );
});

/**
 * Dropdown component for number values.
 */
export const NumberDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<number>>;
/**
 * Dropdown component for string values
 */
export const StringDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<string>>;
