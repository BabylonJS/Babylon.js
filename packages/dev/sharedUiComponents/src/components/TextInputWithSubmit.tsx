import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import style from "./TextInputWithSubmit.modules.scss";

import submitIcon from "../imgs/confirmGridElementDark.svg";
import cancelIcon from "../imgs/deleteGridElementDark.svg";
import { ClassNames } from "./classNames";

export interface ITextInputProps {
    label?: string;
    placeholder?: string;
    submitValue: (newValue: string) => void; // Function to call when the value is updated
    validateValue?: (value: string) => boolean; // Function to call to validate the value
    cancelSubmit?: () => void; // Function to call when the user cancels the submit
}

/**
 * This component represents a text input that can be submitted or cancelled on buttons
 * @param props properties
 * @returns TextInputWithSubmit element
 */
export const TextInputWithSubmit = (props: ITextInputProps) => {
    const [value, setValue] = useState("");
    const [valid, setValid] = useState(props.validateValue ? props.validateValue(value) : true);

    useEffect(() => {
        setValid(props.validateValue ? props.validateValue(value) : true);
    }, [value]);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    const onClickSubmit = () => {
        props.submitValue(value);
    };

    const onClickCancel = () => {
        props.cancelSubmit?.();
        setValue("");
    };

    return (
        <div className={ClassNames({ line: true, valid, invalid: !valid }, style)}>
            {props.label && <label>{props.label}</label>}
            <input className={style.input} type="text" placeholder={props.placeholder} value={value} onChange={onChange} />
            <div>
                <Button color="light" size="smaller" backgroundColor="inherit" onClick={onClickSubmit} disabled={!valid}>
                    <Icon icon={submitIcon} color="dark"></Icon>
                </Button>
                <Button color="light" size="smaller" backgroundColor="inherit" onClick={onClickCancel}>
                    <Icon icon={cancelIcon} color="dark"></Icon>
                </Button>
            </div>
        </div>
    );
};
