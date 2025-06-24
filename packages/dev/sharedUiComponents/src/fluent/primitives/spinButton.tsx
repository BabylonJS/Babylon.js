import { makeStyles, SpinButton as FluentSpinButton } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { useCallback, useState } from "react";
import type { BaseComponentProps } from "../hoc/propertyLine";

const useSpinStyles = makeStyles({
    base: {
        display: "flex",
        flexDirection: "column",
    },
});

export type SpinButtonProps = BaseComponentProps<number>;

export const SpinButton: FunctionComponent<SpinButtonProps> = (props) => {
    const classes = useSpinStyles();

    const [spinButtonValue, setSpinButtonValue] = useState<number | null>(props.value);

    const onSpinButtonChange = useCallback(
        (_ev: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            // Stop propagation of the event to prevent it from bubbling up
            _ev.stopPropagation();

            if (data.value !== undefined) {
                setSpinButtonValue(data.value);
            } else if (data.displayValue !== undefined) {
                const newValue = parseFloat(data.displayValue);
                if (!Number.isNaN(newValue)) {
                    setSpinButtonValue(newValue);
                }
            }
        },
        [setSpinButtonValue]
    );

    return (
        <div className={classes.base}>
            <FluentSpinButton value={spinButtonValue} onChange={onSpinButtonChange} />
        </div>
    );
};
