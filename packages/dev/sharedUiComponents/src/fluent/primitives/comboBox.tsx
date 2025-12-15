import type { FunctionComponent } from "react";
import { useState, useContext, useEffect } from "react";
import { Combobox as FluentComboBox, makeStyles, useComboboxFilter, useId } from "@fluentui/react-components";
import type { OptionOnSelectData, SelectionEvents } from "@fluentui/react-components";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { CustomTokens } from "./utils";
import { PrimitiveProps } from "./primitive";

const useStyles = makeStyles({
    root: {
        // Stack the label above the field with a gap
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
        minWidth: 0, // Override Fluent's default minWidth on the input
    },
});

export type ComboBoxProps = PrimitiveProps<string> & {
    label: string;
    /**
     * The list of options to display
     */
    options: string[];
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
    const { size } = useContext(ToolContext);

    const [query, setQuery] = useState(props.value ?? "");

    // Sync query with props.value when it changes externally
    useEffect(() => {
        setQuery(props.value ?? "");
    }, [props.value]);

    const children = useComboboxFilter(query, props.options, {
        noOptionsMessage: "No items match your search.",
    });
    const onOptionSelect = (_e: SelectionEvents, data: OptionOnSelectData) => {
        setQuery(data.optionText ?? "");
        data.optionText && props.onChange(data.optionText);
    };

    return (
        <div className={styles.root}>
            <label id={comboId}>{props.label}</label>
            <FluentComboBox
                size={size}
                root={{ className: styles.comboBox }}
                input={{ className: styles.input }}
                onOptionSelect={onOptionSelect}
                onBlur={() => props.onChange(query)}
                aria-labelledby={comboId}
                placeholder="Search.."
                onChange={(ev) => setQuery(ev.target.value)}
                value={query}
            >
                {children}
            </FluentComboBox>
        </div>
    );
};
