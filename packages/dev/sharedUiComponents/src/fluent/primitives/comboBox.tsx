import { useState, useContext, useEffect, forwardRef } from "react";
import { Combobox as FluentComboBox, makeStyles, useComboboxFilter, useId, Option } from "@fluentui/react-components";
import type { OptionOnSelectData, SelectionEvents } from "@fluentui/react-components";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { CustomTokens } from "./utils";
import type { PrimitiveProps } from "./primitive";

const useStyles = makeStyles({
    root: {
        display: "grid",
        gridTemplateRows: "repeat(1fr)",
        justifyItems: "start",
        gap: "2px",
        maxWidth: "400px",
    },
    comboBox: {
        width: CustomTokens.inputWidth,
        minWidth: CustomTokens.inputWidth,
        boxSizing: "border-box",
    },
    input: {
        minWidth: 0,
    },
    listbox: {
        width: "fit-content",
        minWidth: "fit-content",
        maxWidth: "350px",
    },
});

/**
 * An option object for the ComboBox with separate label and value.
 */
export type ComboBoxOption = {
    /**
     * Defines the visible part of the option
     */
    label: string;
    /**
     * Defines the value part of the option
     */
    value: string;
};

export type ComboBoxProps = PrimitiveProps<string> & {
    /**
     * Label for the ComboBox
     */
    label: string;
    /**
     * Options to display as label/value pairs
     */
    options: ComboBoxOption[];
    /**
     * The default open state when open is uncontrolled
     */
    defaultOpen?: boolean;
};

/**
 * Wrapper around a Fluent ComboBox that allows for filtering options.
 * @param props
 * @returns
 */
export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>((props, ref) => {
    ComboBox.displayName = "ComboBox";
    const comboId = useId();
    const styles = useStyles();
    const { size } = useContext(ToolContext);

    // Find the label for the current value
    const getLabel = (value: string) => props.options.find((opt) => opt.value === value)?.label ?? "";

    const [query, setQuery] = useState(getLabel(props.value ?? ""));

    useEffect(() => {
        setQuery(getLabel(props.value ?? ""));
    }, [props.value, props.options]);

    // Convert to Fluent's { children, value } format
    const normalizedOptions = props.options.map((opt) => ({ children: opt.label, value: opt.value }));

    const children = useComboboxFilter(query, normalizedOptions, {
        noOptionsMessage: "No items match your search.",
        optionToReactKey: (option) => option.value,
        optionToText: (option) => option.children,
        renderOption: (option) => (
            <Option key={option.value} value={option.value} text={option.children}>
                {option.children}
            </Option>
        ),
    });

    const onOptionSelect = (_e: SelectionEvents, data: OptionOnSelectData) => {
        setQuery(data.optionText ?? "");
        data.optionValue && props.onChange(data.optionValue);
    };

    return (
        <div className={styles.root}>
            <label id={comboId}>{props.label}</label>
            <FluentComboBox
                ref={ref}
                defaultOpen={props.defaultOpen}
                size={size}
                root={{ className: styles.comboBox }}
                input={{ className: styles.input }}
                listbox={{ className: styles.listbox }}
                onOptionSelect={onOptionSelect}
                aria-labelledby={comboId}
                placeholder="Search.."
                onChange={(ev) => setQuery(ev.target.value)}
                value={query}
            >
                {children}
            </FluentComboBox>
        </div>
    );
});
