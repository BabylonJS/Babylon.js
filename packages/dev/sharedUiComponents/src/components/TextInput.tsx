import { useState } from "react";

export interface ITextInputProps {
    label?: string;
    placeholder?: string;
    submitValue: (newValue: string) => void; // Function to call when the value is updated
}

/**
 * This component represents a text input that can be submitted on buttons
 */
export const TextInput = (props: ITextInputProps) => {
    const [value, setValue] = useState("");

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    return (
        <div>
            <label>{props.label}</label>
            <input type="text" placeholder={props.placeholder} value={value} onChange={onChange} />
            <button onClick={() => props.submitValue(value)}>Submit</button>
        </div>
    );
};
