import { ToggleButton as FluentToggleButton, makeStyles, type TooltipProps } from "@fluentui/react-components";
import { type ButtonProps } from "./button";
import { useCallback, useContext, type FunctionComponent } from "react";
import { type FluentIcon } from "@fluentui/react-icons";
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
    /** The checked state supplied by the parent. */
    value: boolean;
    checkedIcon: FluentIcon;
    uncheckedIcon?: FluentIcon;
    /** Requests a new checked state. The parent must update value to accept the change. */
    onChange: (checked: boolean) => void;
    titlePositioning?: TooltipProps["positioning"];
};

/**
 * Displays a controlled toggle button with icons.
 * The parent supplies the checked state through value; clicks request the opposite value through onChange.
 * If no uncheckedIcon is provided, the same icon is used for both states.
 *
 * @param props The controlled state, change callback, icons, and button presentation.
 * @returns The toggle button.
 */
export const ToggleButton: FunctionComponent<ToggleButtonProps> = (props) => {
    ToggleButton.displayName = "ToggleButton";
    const { value, onChange, title, appearance = "subtle", ariaLabel } = props;
    const { size } = useContext(ToolContext);
    const classes = useStyles();
    const toggle = useCallback(() => {
        onChange(!value);
    }, [value, onChange]);

    return (
        <Tooltip content={title ?? ""} positioning={props.titlePositioning}>
            <FluentToggleButton
                className={classes.button}
                size={size}
                aria-label={ariaLabel ?? title}
                icon={value ? <props.checkedIcon /> : props.uncheckedIcon ? <props.uncheckedIcon /> : <props.checkedIcon />}
                appearance={appearance}
                checked={value}
                onClick={toggle}
            />
        </Tooltip>
    );
};
