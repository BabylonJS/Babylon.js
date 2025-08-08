import { makeStyles, SpinButton as FluentSpinButton } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { useCallback, useState } from "react";
import type { PrimitiveProps } from "./primitive";

const useSpinStyles = makeStyles({
    base: {
        display: "flex",
        flexDirection: "column",
    },
});

export type SpinButtonProps = PrimitiveProps<number> & {
    precision?: number; // Optional precision for the spin button
    step?: number; // Optional step value for the spin button
    min?: number;
    max?: number;
};

export const SpinButton: FunctionComponent<SpinButtonProps> = (props) => {
    const classes = useSpinStyles();

    const [spinButtonValue, setSpinButtonValue] = useState(props.value);

    const onSpinButtonChange = useCallback(
        (_ev: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
            // Stop propagation of the event to prevent it from bubbling up
            _ev.stopPropagation();

            if (data.value != null) {
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
            <FluentSpinButton {...props} value={spinButtonValue} onChange={onSpinButtonChange} />
        </div>
    );
};
