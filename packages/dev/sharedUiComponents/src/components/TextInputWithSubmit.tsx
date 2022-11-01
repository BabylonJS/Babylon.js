import { useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import style from "./TextInputWithSubmit.modules.scss";

import submitIcon from "../imgs/confirmGridElementDark.svg";

export interface ITextInputProps {
    label?: string;
    placeholder?: string;
    submitValue: (newValue: string) => void; // Function to call when the value is updated
}

/**
 * This component represents a text input that can be submitted on buttons
 */
export const TextInputWithSubmit = (props: ITextInputProps) => {
    const [value, setValue] = useState("");

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    const onClick = () => {
        props.submitValue(value);
    };

    return (
        <div className={style.line}>
            <label>{props.label}</label>
            <input className={style.input} type="text" placeholder={props.placeholder} value={value} onChange={onChange} />
            <Button color="light" size="smaller" backgroundColor="white" onClick={onClick}>
                <Icon icon={submitIcon} color="dark"></Icon>
            </Button>
        </div>
    );
};
