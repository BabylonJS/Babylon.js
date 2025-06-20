// eslint-disable-next-line import/no-internal-modules

import type { SwitchOnChangeData, SwitchProps as FluentSwitchProps } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";

import { makeStyles, Switch as FluentSwitch } from "@fluentui/react-components";
import { useEffect, useState } from "react";

const useSwitchStyles = makeStyles({
    switch: {
        marginLeft: "auto",
    },
    indicator: {
        margin: 0, // Remove the default right margin so the switch aligns well on the right side inside panels like the properties pane.
    },
});

/**
 * This is a primitive fluent boolean switch component whose only knowledge is the shared styling across all tools
 * @param props
 * @returns Switch component
 */
export const Switch: FunctionComponent<FluentSwitchProps> = (props) => {
    const classes = useSwitchStyles();
    const [checked, setChecked] = useState(() => props.checked ?? false);

    useEffect(() => {
        if (props.checked != undefined) {
            setChecked(props.checked); // Update local state when props.checked changes
        }
    }, [props.checked]);

    const onChange = (event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => {
        props.onChange && props.onChange(event, data);
        setChecked(event.target.checked);
    };

    return <FluentSwitch {...props} className={classes.switch} indicator={{ className: classes.indicator }} checked={checked} onChange={onChange} />;
};
