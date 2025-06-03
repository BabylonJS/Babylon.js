import { Dropdown as FluentDropdown, makeStyles, Option } from "@fluentui/react-components";
import { IInspectableOptions } from "core/Misc";

const useDropdownStyles = makeStyles({
    dropdownOption: {
        textAlign: "right",
        minWidth: "40px",
    },
    optionsLine: {},
});

export const Dropdown = (props: { options: IInspectableOptions[]; onSelect: (o: string) => void; defaultValue: string | number }) => {
    const styles = useDropdownStyles();
    return (
        <FluentDropdown
            className={styles.dropdownOption}
            onOptionSelect={(evt, data) => {
                data.optionValue != undefined && props.onSelect(data.optionValue);
            }}
            defaultValue={props.options.find((o) => o.value === props.defaultValue)?.label}
            defaultSelectedOptions={[props.defaultValue.toString()]}
        >
            {props.options.map((option: IInspectableOptions, i: number) => (
                <Option className={styles.optionsLine} key={option.label + i} value={option.value.toString()} disabled={false}>
                    {option.label}
                </Option>
            ))}
        </FluentDropdown>
    );
};
