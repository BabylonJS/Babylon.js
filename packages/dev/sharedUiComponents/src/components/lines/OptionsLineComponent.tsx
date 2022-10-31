import type { ChangeEvent } from "react";
import { useState } from "react";
import { TextInput } from "../TextInput";

/**
 * This components represents an options menu with optional
 * customizable properties
 */
export interface IOption {
    label: string;
    value: string;
}

export interface IOptionsLineComponentProps {
    options: IOption[];
    addOptionText?: string; // Text to display when adding a new option
    addOptionPlaceholder?: string; // Placeholder text to display when adding a new option
    onOptionAdded?: (newOption: IOption) => void; // Optional function that can be used to add a new option to the menu
    onOptionSelected: (selectedOptionValue: string) => void;
    icon: string;
    iconLabel: string;
    label: string;
    selectedOptionValue: string; // The value of the currently selected option
}

/**
 * We have two possible states. The user starts in the Default option, and can choose to
 * add a new option.
 */
enum OptionStates {
    Default = 0, // Default state,
    Adding = 1, // State when the user is adding a new option to the menu
}

const OptionAddKey = "addCustomOption";

export const OptionsLineComponent = (props: IOptionsLineComponentProps) => {
    const [optionState, setOptionState] = useState(OptionStates.Default); // State of the component

    const onOptionChange = (evt: ChangeEvent<HTMLSelectElement>) => {
        if (evt.target.value === OptionAddKey) {
            setOptionState(OptionStates.Adding);
        } else {
            props.onOptionSelected(evt.target.value);
        }
    };

    const onOptionAdd = (value: string) => {
        const newOptionText = value;
        const newOption = { label: newOptionText, value: newOptionText };
        props.onOptionAdded?.(newOption);
        props.onOptionSelected(newOption.value);
        setOptionState(OptionStates.Default);
    };

    return (
        <div>
            {optionState === OptionStates.Adding && <TextInput submitValue={onOptionAdd} />}
            {optionState === OptionStates.Default && (
                <select onChange={onOptionChange} value={props.selectedOptionValue}>
                    {props.onOptionAdded && (
                        <option key={OptionAddKey} value={OptionAddKey}>
                            Custom
                        </option>
                    )}
                    {props.options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};
