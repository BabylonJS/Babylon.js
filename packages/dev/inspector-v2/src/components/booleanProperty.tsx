// eslint-disable-next-line import/no-internal-modules
import type { Observable } from "core/index";

import type { SwitchProps } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";

import { InfoLabel, makeStyles, Switch, tokens } from "@fluentui/react-components";
import { useCallback, useMemo } from "react";
import { useObservableState } from "../hooks/observableHooks";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    // TODO: probably common
    rootDiv: {
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalSNudge,
    },
    switch: {
        marginLeft: "auto",
    },
    indicator: {
        marginRight: 0,
    },
});

export type BooleanPropertyProps = {
    label: string;
    description?: string;
    accessor: () => boolean;
    mutator?: (value: boolean) => void;
    observable?: Observable<any>;
};

export const BooleanProperty: FunctionComponent<BooleanPropertyProps> = ({ label, description, accessor, mutator, observable }) => {
    const classes = useStyles();
    const indicatorProps = useMemo<SwitchProps["indicator"]>(() => ({ className: classes.indicator }), [classes.indicator]);

    const value = useObservableState(accessor, observable);

    const onChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            mutator?.(event.target.checked);
        },
        [mutator]
    );

    return (
        <div className={classes.rootDiv}>
            <InfoLabel info={description}>{label}</InfoLabel>
            <Switch className={classes.switch} indicator={indicatorProps} checked={value} onChange={onChange} />
        </div>
    );
};
