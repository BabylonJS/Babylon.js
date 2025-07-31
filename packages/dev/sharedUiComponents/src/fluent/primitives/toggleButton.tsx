import { ToggleButton as FluentToggleButton } from "@fluentui/react-components";
import type { PrimitiveProps } from "./primitive";
import { useCallback, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { FluentIcon } from "@fluentui/react-icons";

type ToggleButtonProps = PrimitiveProps<boolean> & {
    enabledIcon: FluentIcon;
    disabledIcon?: FluentIcon;
};

/**
 * Toggles between two states using a button with icons.
 * If no disabledIcon is provided, the button will toggle between enabled/disabled states without an icon change
 *
 * @param props
 * @returns
 */
// export const ToggleButton: FunctionComponent<ToggleButtonProps> = (props) => {
//     const [checked, setChecked] = useState(props.value);
//     useEffect(() => {
//         setChecked(props.value);
//     }, [props.value]);
//     return (
//         <FluentToggleButton
//             appearance={!checked && !props.disabledIcon ? "transparent" : "primary"}
//             icon={!checked && props.disabledIcon ? <props.disabledIcon /> : <props.enabledIcon />}
//             onClick={() => props.onChange(!checked)}
//             checked={checked}
//         />
//     );
// };

export const ToggleButton: FunctionComponent<ToggleButtonProps> = (props) => {
    const { value, onChange, title } = props;
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
        // <Tooltip content={props.title} relationship="label">

        // </Tooltip>
        <FluentToggleButton
            title={title}
            icon={!checked && props.disabledIcon ? <props.disabledIcon /> : <props.enabledIcon />}
            appearance="transparent"
            checked={checked}
            onClick={toggle}
        />
    );
};
