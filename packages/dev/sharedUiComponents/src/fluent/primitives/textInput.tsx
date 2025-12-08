import type { FunctionComponent, KeyboardEvent, ChangeEvent } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import type { InputOnChangeData } from "@fluentui/react-components";
import { Input as FluentInput, mergeClasses, useId } from "@fluentui/react-components";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";
import { HandleOnBlur, HandleKeyDown, useInputStyles } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";

export type TextInputProps = PrimitiveProps<string> & {
    validator?: (value: string) => boolean;
};

export const TextInput: FunctionComponent<TextInputProps> = (props) => {
    TextInput.displayName = "TextInput";
    const classes = useInputStyles();
    const [value, setValue] = useState(props.value);
    const lastCommittedValue = useRef(props.value);
    const { size } = useContext(ToolContext);
    useEffect(() => {
        if (props.value !== lastCommittedValue.current) {
            setValue(props.value); // Update local state when props.value changes
            lastCommittedValue.current = props.value;
        }
    }, [props.value]);

    const validateValue = (val: string): boolean => {
        const failsValidator = props.validator && !props.validator(val);
        return !failsValidator;
    };

    const tryCommitValue = (currVal: string) => {
        // Only commit if valid and different from last committed value
        if (validateValue(currVal) && currVal !== lastCommittedValue.current) {
            lastCommittedValue.current = currVal;
            props.onChange(currVal);
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
        event.stopPropagation();
        setValue(data.value);
        tryCommitValue(data.value);
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();
        setValue(event.currentTarget.value);
        tryCommitValue(event.currentTarget.value);
    };
    const mergedClassName = mergeClasses(classes.input, !validateValue(value) ? classes.invalid : "", props.className);

    const id = useId("input-button");
    return (
        <div className={classes.container}>
            {props.infoLabel && <InfoLabel {...props.infoLabel} htmlFor={id} />}
            <FluentInput
                {...props}
                input={{ className: classes.inputSlot }}
                id={id}
                size={size}
                value={value}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
                onKeyDown={HandleKeyDown}
                onBlur={HandleOnBlur}
                className={mergedClassName}
            />
        </div>
    );
};
