import type { FunctionComponent } from "react";
import { useState } from "react";
import { Combobox as FluentComboBox, makeStyles, useComboboxFilter, useId } from "@fluentui/react-components";
import type { OptionOnSelectData, SelectionEvents } from "@fluentui/react-components";
const useStyles = makeStyles({
    root: {
        // Stack the label above the field with a gap
        display: "grid",
        gridTemplateRows: "repeat(1fr)",
        justifyItems: "start",
        gap: "2px",
        maxWidth: "400px",
    },
});

export type ComboBoxProps = {
    label: string;
    value: string[];
    onChange: (value: string) => void;
};
/**
 * Wrapper around a Fluent ComboBox that allows for filtering options
 * @param props
 * @returns
 */
export const ComboBox: FunctionComponent<ComboBoxProps> = (props) => {
    ComboBox.displayName = "ComboBox";
    const comboId = useId();
    const styles = useStyles();

    const [query, setQuery] = useState("");
    const children = useComboboxFilter(query, props.value, {
        noOptionsMessage: "No items match your search.",
    });
    const onOptionSelect = (_e: SelectionEvents, data: OptionOnSelectData) => {
        setQuery(data.optionText ?? "");
        data.optionText && props.onChange(data.optionText);
    };

    return (
        <div className={styles.root}>
            <label id={comboId}>{props.label}</label>
            <FluentComboBox onOptionSelect={onOptionSelect} aria-labelledby={comboId} placeholder="Search.." onChange={(ev) => setQuery(ev.target.value)} value={query}>
                {children}
            </FluentComboBox>
        </div>
    );
};
