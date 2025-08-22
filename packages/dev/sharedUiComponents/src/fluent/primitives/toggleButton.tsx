import { ToggleButton as FluentToggleButton } from "@fluentui/react-components";
import type { PrimitiveProps } from "./primitive";
import { useCallback, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { FluentIcon } from "@fluentui/react-icons";

type ToggleButtonProps = PrimitiveProps<boolean> & {
    enabledIcon: FluentIcon; // Intentionally using FluentIcon so that we can control the visual toggle look/feel
    disabledIcon?: FluentIcon;
    appearance?: "subtle" | "transparent";
};

/**
 * Toggles between two states using a button with icons.
 * If no disabledIcon is provided, the button will toggle between visual enabled/disabled states without an icon change
 *
 * @param props
 * @returns
 */
export const ToggleButton: FunctionComponent<ToggleButtonProps> = (props) => {
    const { value, onChange, title, appearance = "subtle" } = props;
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
        <FluentToggleButton
            title={title}
            icon={checked ? <props.enabledIcon /> : props.disabledIcon ? <props.disabledIcon /> : <props.enabledIcon />}
            appearance={appearance}
            checked={checked}
            onClick={toggle}
        />
    );
};
