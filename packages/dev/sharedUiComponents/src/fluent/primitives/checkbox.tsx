// eslint-disable-next-line import/no-internal-modules

import type { CheckboxProps, CheckboxOnChangeData } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";

import { Checkbox as FluentCheckbox } from "@fluentui/react-components";
import { useEffect, useState } from "react";

/**
 * This is a primitive fluent checkbox that can both read and write checked state
 * @param props
 * @returns Checkbox component
 */
export const Checkbox: FunctionComponent<CheckboxProps> = (props) => {
    const [checked, setChecked] = useState(() => props.checked ?? false);

    useEffect(() => {
        if (props.checked != undefined) {
            setChecked(props.checked); // Update local state when props.checked changes
        }
    }, [props.checked]);

    const onChange = (ev: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
        props.onChange && props.onChange(ev, data);
        setChecked(ev.target.checked);
    };

    return <FluentCheckbox {...props} checked={checked} onChange={onChange} />;
};
