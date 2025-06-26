import { Dropdown as FluentDropdown, makeStyles, Option } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { BaseComponentProps } from "../hoc/propertyLine";
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

export type DropdownProps<V extends AcceptedDropdownValue> = BaseComponentProps<V> & {
    options: DropdownOption[];

    includeUndefined?: boolean; // If true, adds an option with label 'Not Defined' and value undefined
};

/**
 * Renders a fluent UI dropdown component for the options passed in, and an additional 'Not Defined' option if includeUndefined is set to true
 * @param props
 * @returns dropdown component
 */
export const Dropdown: FunctionComponent<DropdownProps<AcceptedDropdownValue>> = (props) => {
    const classes = useDropdownStyles();

    const [options] = useState<DropdownOption[]>(props.includeUndefined ? [{ label: "<Not defined>", value: Number.MAX_SAFE_INTEGER }, ...props.options] : props.options);
    const [defaultVal, setDefaultVal] = useState(props.includeUndefined && (props.value === undefined || props.value === null) ? Number.MAX_SAFE_INTEGER : props.value);
    useEffect(() => {
        setDefaultVal(props.includeUndefined && (props.value === undefined || props.value === null) ? Number.MAX_SAFE_INTEGER : props.value);
    }, [props.value]);

    return (
        <FluentDropdown
            size="small"
            className={classes.dropdownOption}
            onOptionSelect={(evt, data) => {
                let value = typeof props.value === "number" ? Number(data.optionValue) : data.optionValue;
                setDefaultVal(value);
                if (props.includeUndefined && value === Number.MAX_SAFE_INTEGER.toString()) {
                    value = undefined;
                }
                props.onChange(value);
            }}
            selectedOptions={[defaultVal!.toString()]}
            value={options.find((o) => o.value === defaultVal)?.label}
        >
            {options.map((option: DropdownOption) => (
                <Option className={classes.optionsLine} key={option.label} value={option.value?.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </FluentDropdown>
    );
};
