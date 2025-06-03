// eslint-disable-next-line import/no-internal-modules

import type { SwitchOnChangeData, SwitchProps as FluentSwitchProps } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";

import { makeStyles, Switch as FluentSwitch } from "@fluentui/react-components";
import { useCallback, useMemo, useState } from "react";

const useSwitchStyles = makeStyles({
    switch: {
        marginLeft: "auto",
    },
    indicator: {
        marginRight: 0,
    },
});

/**
 * This is a primitive fluent boolean switch component whose only knowledge is the shared styling across all tools
 */
export const Switch: FunctionComponent<FluentSwitchProps> = (props: FluentSwitchProps) => {
    const classes = useSwitchStyles();
    const indicatorProps = useMemo<FluentSwitchProps["indicator"]>(() => ({ className: classes.indicator }), [classes.indicator]);

    const [checked, setChecked] = useState(() => props.checked ?? false);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData) => {
        props.onChange && props.onChange(event, data);
        setChecked(event.target.checked);
    }, []);

    return <FluentSwitch {...props} className={classes.switch} indicator={indicatorProps} checked={checked} onChange={onChange} />;
};
