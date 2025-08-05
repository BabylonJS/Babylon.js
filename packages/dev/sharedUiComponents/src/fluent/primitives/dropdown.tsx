import { Dropdown as FluentDropdown, makeStyles, Option } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";

const useDropdownStyles = makeStyles({
    dropdownOption: {
        textAlign: "right",
        minWidth: "40px",
    },
    optionsLine: {},
});

export type AcceptedDropdownValue = string | number;
export type DropdownOption<T extends AcceptedDropdownValue> = {
    /**
     * Defines the visible part of the option
     */
    label: string;
    /**
     * Defines the value part of the option
     */
    value: T;
};

export type DropdownProps<V extends AcceptedDropdownValue> = PrimitiveProps<V> & {
    options: readonly DropdownOption<V>[];
};

/**
 * Renders a fluent UI dropdown component for the options passed in, and an additional 'Not Defined' option if null is set to true
 * This component can handle both null and undefined values
 * @param props
 * @returns dropdown component
 */
export const Dropdown: FunctionComponent<DropdownProps<AcceptedDropdownValue>> = (props) => {
    const classes = useDropdownStyles();
    const { options, value } = props;
    const [defaultVal, setDefaultVal] = useState(props.value);

    useEffect(() => {
        setDefaultVal(value);
    }, [props.value]);

    return (
        <FluentDropdown
            disabled={props.disabled}
            size="small"
            className={classes.dropdownOption}
            onOptionSelect={(evt, data) => {
                const value = typeof props.value === "number" ? Number(data.optionValue) : data.optionValue;
                if (value !== undefined) {
                    setDefaultVal(value);
                    props.onChange(value);
                }
            }}
            selectedOptions={[defaultVal.toString()]}
            value={options.find((o) => o.value === defaultVal)?.label}
        >
            {options.map((option: DropdownOption<AcceptedDropdownValue>) => (
                <Option className={classes.optionsLine} key={option.label} value={option.value.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </FluentDropdown>
    );
};

export const NumberDropdown = Dropdown as FunctionComponent<DropdownProps<number>>;
export const StringDropdown = Dropdown as FunctionComponent<DropdownProps<string>>;
