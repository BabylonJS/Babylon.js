import { Dropdown as FluentDropdown, makeStyles, mergeClasses, Option, useId } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";
import { CustomTokens, UniformWidthStyling } from "./utils";
import { InfoLabel } from "./infoLabel";

const useDropdownStyles = makeStyles({
    dropdown: { ...UniformWidthStyling, minWidth: CustomTokens.inputWidth },
    container: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // align items vertically
        gap: "4px",
    },
    button: { textAlign: "end" },
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
    Dropdown.displayName = "Dropdown";
    const classes = useDropdownStyles();
    const { options, value } = props;
    const [defaultVal, setDefaultVal] = useState(props.value);

    useEffect(() => {
        setDefaultVal(value);
    }, [props.value]);
    const id = useId("dropdown");

    const mergedClassName = mergeClasses(classes.dropdown, props.className);

    return (
        <div className={classes.container}>
            {props.infoLabel && <InfoLabel {...props.infoLabel} htmlFor={id} />}
            <FluentDropdown
                id={id}
                disabled={props.disabled}
                size="medium"
                className={mergedClassName}
                button={{ className: classes.button }}
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
                    <Option className={classes.dropdown} key={option.label} value={option.value.toString()} disabled={false}>
                        {option.label}
                    </Option>
                ))}
            </FluentDropdown>
        </div>
    );
};

export const NumberDropdown = Dropdown as FunctionComponent<DropdownProps<number>>;
export const StringDropdown = Dropdown as FunctionComponent<DropdownProps<string>>;
