import { Dropdown as FluentDropdown, makeStyles, Option } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { BaseComponentProps } from "../hoc/propertyLine";

const useDropdownStyles = makeStyles({
    dropdownOption: {
        textAlign: "right",
        minWidth: "40px",
    },
    optionsLine: {},
});

export type DropdownOption = {
    /**
     * Defines the visible part of the option
     */
    label: string;
    /**
     * Defines the value part of the option
     */
    value: string | number | null;
};

export type DropdownProps = BaseComponentProps<DropdownOption> & {
    options: DropdownOption[];
};

/**
 * Renders a fluent UI dropdown with a calback for selection and a required default value
 * @param props
 * @returns dropdown component
 */
export const Dropdown: FunctionComponent<DropdownProps> = (props) => {
    const classes = useDropdownStyles();
    return (
        <FluentDropdown
            size="small"
            className={classes.dropdownOption}
            onOptionSelect={(evt, data) => {
                data.optionValue != undefined && props.onChange(props.options.find((o) => o.value?.toString() === data.optionValue) as DropdownOption);
            }}
            defaultValue={props.value.label}
            defaultSelectedOptions={[props.value.toString()]}
        >
            {props.options.map((option: DropdownOption) => (
                <Option className={classes.optionsLine} key={option.label} value={option.value?.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </FluentDropdown>
    );
};
