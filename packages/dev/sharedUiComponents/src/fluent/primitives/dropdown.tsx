import { Dropdown as FluentDropdown, makeStyles, Option } from "@fluentui/react-components";
import type { FunctionComponent } from "react";

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
     * Defines the value part of the option (returned through the callback)
     */
    value: string | number;
};

type DropdownProps = { options: readonly DropdownOption[]; onSelect: (o: string) => void; defaultValue?: DropdownOption };

/**
 * Renders a fluent UI dropdown with a calback for selection and a required default value
 * @param props
 * @returns dropdown component
 */
export const Dropdown: FunctionComponent<DropdownProps> = (props) => {
    const classes = useDropdownStyles();
    return (
        <FluentDropdown
            className={classes.dropdownOption}
            onOptionSelect={(evt, data) => {
                data.optionValue != undefined && props.onSelect(data.optionValue);
            }}
            defaultValue={props.defaultValue?.label}
            defaultSelectedOptions={props.defaultValue && [props.defaultValue.value.toString()]}
        >
            {props.options.map((option: DropdownOption) => (
                <Option className={classes.optionsLine} key={option.label} value={option.value.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </FluentDropdown>
    );
};
