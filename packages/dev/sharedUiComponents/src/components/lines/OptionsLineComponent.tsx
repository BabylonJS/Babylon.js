import type { ChangeEvent } from "react";
import { useState } from "react";
import { TextInputWithSubmit } from "../TextInputWithSubmit";
import style from "./OptionsLineComponent.modules.scss";

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
    addOptionPlaceholder?: string; // Placeholder text to display when adding a new option
    onOptionAdded?: (newOption: IOption) => void; // Optional function that can be used to add a new option to the menu
    onOptionSelected: (selectedOptionValue: string) => void;
    selectedOptionValue: string; // The value of the currently selected option
    validateNewOptionValue?: (newOptionValue: string) => boolean; // Optional function that can be used to validate the value of a new option
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

    const onCancelOptionAdd = () => {
        setOptionState(OptionStates.Default);
    };

    return (
        <div className={style.optionsLine}>
            {optionState === OptionStates.Adding && (
                <TextInputWithSubmit
                    submitValue={onOptionAdd}
                    placeholder={props.addOptionPlaceholder}
                    validateValue={props.validateNewOptionValue}
                    cancelSubmit={onCancelOptionAdd}
                />
            )}
            {optionState === OptionStates.Default && (
                <select className={style.optionsSelect} onChange={onOptionChange} value={props.selectedOptionValue}>
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
