import { Dropdown as FluentDropdown, makeStyles, Option } from "@fluentui/react-components";
import { useEffect, useMemo, useState } from "react";
import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";
import type { Nullable } from "core/types";

const useDropdownStyles = makeStyles({
    dropdownOption: {
        textAlign: "right",
        minWidth: "40px",
    },
    optionsLine: {},
});

type DropdownOptionValue = string | number;
export type AcceptedDropdownValue = Nullable<DropdownOptionValue> | undefined;
export type DropdownOption = {
    /**
     * Defines the visible part of the option
     */
    label: string;
    /**
     * Defines the value part of the option
     */
    value: DropdownOptionValue;
};

export type DropdownProps<V extends AcceptedDropdownValue> = PrimitiveProps<V> & {
    options: readonly DropdownOption[];

    includeNullAs?: "null" | "undefined"; // If supplied, adds an option with label 'Not Defined' and later sets value either null or undefined
};

/**
 * Renders a fluent UI dropdown component for the options passed in, and an additional 'Not Defined' option if null is set to true
 * This component can handle both null and undefined values
 * @param props
 * @returns dropdown component
 */
export const Dropdown: FunctionComponent<DropdownProps<AcceptedDropdownValue>> = (props) => {
    const classes = useDropdownStyles();
    // This component can handle both null and undefined values, so '==' null is intentionally used throughout to check for both cases.
    const options = useMemo(
        () => (props.includeNullAs ? [{ label: "<Not defined>", value: Number.MAX_SAFE_INTEGER }, ...props.options] : props.options),
        [props.includeNullAs, props.options]
    );
    const [defaultVal, setDefaultVal] = useState(props.value == null ? Number.MAX_SAFE_INTEGER : props.value);
    useEffect(() => {
        setDefaultVal(props.value == null ? Number.MAX_SAFE_INTEGER : props.value);
    }, [props.value]);

    return (
        <FluentDropdown
            size="small"
            className={classes.dropdownOption}
            onOptionSelect={(evt, data) => {
                const value = typeof props.value === "number" ? Number(data.optionValue) : data.optionValue;
                if (value !== undefined) {
                    setDefaultVal(value);
                    const nullVal = props.includeNullAs === "null" ? null : undefined;
                    value === Number.MAX_SAFE_INTEGER ? props.onChange(nullVal) : props.onChange(value);
                }
            }}
            selectedOptions={[defaultVal.toString()]}
            value={options.find((o) => o.value === defaultVal)?.label}
        >
            {options.map((option: DropdownOption) => (
                <Option className={classes.optionsLine} key={option.label} value={option.value.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </FluentDropdown>
    );
};
