import type { SwitchOnChangeData } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";

import { makeStyles, Switch as FluentSwitch, mergeClasses } from "@fluentui/react-components";
import { useContext, useEffect, useState } from "react";
import { ToolContext } from "../hoc/fluentToolWrapper";

const useSwitchStyles = makeStyles({
    switch: {
        marginLeft: "auto",
    },
    switchSmall: {
        transform: `scale(.85)`, // workaround since we cannot resize fluent switch
        transformOrigin: "right",
    },
    indicator: {
        margin: 0, // Remove the default right margin so the switch aligns well on the right side inside panels like the properties pane.
    },
});

export type SwitchProps = PrimitiveProps<boolean>;

/**
 * This is a primitive fluent boolean switch component whose only knowledge is the shared styling across all tools
 * @param props
 * @returns Switch component
 */
export const Switch: FunctionComponent<SwitchProps> = (props) => {
    Switch.displayName = "Switch";
    const { size } = useContext(ToolContext);
    const classes = useSwitchStyles();
    const [checked, setChecked] = useState(() => props.value ?? false);

    useEffect(() => {
        if (props.value != undefined) {
            setChecked(props.value); // Update local state when props.checked changes
        }
    }, [props.value]);

    const onChange = (event: ChangeEvent<HTMLInputElement>, _: SwitchOnChangeData) => {
        props.onChange && props.onChange(event.target.checked);
        setChecked(event.target.checked);
    };

    return (
        <FluentSwitch
            className={mergeClasses(classes.switch, size === "small" && classes.switchSmall)}
            indicator={{ className: classes.indicator }}
            checked={checked}
            disabled={props.disabled}
            onChange={onChange}
        />
    );
};
