import { ToggleButton as FluentToggleButton, makeStyles } from "@fluentui/react-components";
import type { ButtonProps } from "./button";
import { useCallback, useContext, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { FluentIcon } from "@fluentui/react-icons";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { Tooltip } from "./tooltip";

const useStyles = makeStyles({
    button: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
});

type ToggleButtonProps = Omit<ButtonProps, "icon" | "onClick"> & {
    value: boolean;
    checkedIcon: FluentIcon;
    uncheckedIcon?: FluentIcon;
    onChange: (checked: boolean) => void;
};

/**
 * Toggles between two states using a button with icons.
 * If no disabledIcon is provided, the button will toggle between visual enabled/disabled states without an icon change
 *
 * @param props
 * @returns
 */
export const ToggleButton: FunctionComponent<ToggleButtonProps> = (props) => {
    ToggleButton.displayName = "ToggleButton";
    const { value, onChange, title, appearance = "subtle" } = props;
    const { size } = useContext(ToolContext);
    const classes = useStyles();
    const [checked, setChecked] = useState(value);
    const toggle = useCallback(() => {
        setChecked((prev) => {
            const enabled = !prev;
            onChange(enabled);
            return enabled;
        });
    }, [setChecked]);

    useEffect(() => {
        setChecked(props.value);
    }, [props.value]);

    return (
        <Tooltip content={title ?? ""}>
            <FluentToggleButton
                className={classes.button}
                size={size}
                icon={checked ? <props.checkedIcon /> : props.uncheckedIcon ? <props.uncheckedIcon /> : <props.checkedIcon />}
                appearance={appearance}
                checked={checked}
                onClick={toggle}
            />
        </Tooltip>
    );
};
