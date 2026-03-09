import { Dropdown, makeStyles, Option, useId } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { useContext, useEffect, useState } from "react";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

export type BoneOption = { label: string; value: string };

export type BoneDropdownProps = {
    value: string;
    options: readonly BoneOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
};

const useStyles = makeStyles({
    dropdown: {
        minWidth: 0,
        width: "100%",
    },
    buttonText: {
        textAlign: "end",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflowX: "hidden",
    },
});

/**
 * A dropdown for bone/node selection.
 * Unlike the generic StringDropdown, the popup list auto-sizes to content width
 * (no matchTargetSize constraint) and hides horizontal overflow.
 */
export const BoneDropdown: FunctionComponent<BoneDropdownProps> = (props) => {
    BoneDropdown.displayName = "BoneDropdown";
    const classes = useStyles();
    const { size } = useContext(ToolContext);
    const id = useId("bone-dropdown");
    const [currentValue, setCurrentValue] = useState(props.value);

    useEffect(() => {
        setCurrentValue(props.value);
    }, [props.value]);

    const optionLabel = props.options.find((o) => o.value === currentValue)?.label;

    return (
        <Dropdown
            id={id}
            disabled={props.disabled}
            size={size}
            className={classes.dropdown}
            button={<span className={classes.buttonText}>{optionLabel}</span>}
            positioning={{ matchTargetSize: undefined, position: "below", align: "start" }}
            listbox={{ style: { overflowX: "hidden", minWidth: "max-content" } }}
            selectedOptions={[currentValue]}
            value={optionLabel}
            onOptionSelect={(_evt, data) => {
                if (data.optionValue !== undefined) {
                    setCurrentValue(data.optionValue);
                    props.onChange(data.optionValue);
                }
            }}
        >
            {props.options.map((opt) => (
                <Option key={opt.value} value={opt.value} text={opt.value}>
                    {opt.label}
                </Option>
            ))}
        </Dropdown>
    );
};
