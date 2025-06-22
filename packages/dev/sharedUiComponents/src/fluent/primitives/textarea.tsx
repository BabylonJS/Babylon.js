import type { TextareaProps as FluentTextareaProps } from "@fluentui/react-components";
import { Textarea as FluentTextarea, makeStyles } from "@fluentui/react-components";
import type { FunctionComponent, KeyboardEvent, ChangeEvent } from "react";
import type { BaseComponentProps } from "../hoc/propertyLine";

const useInputStyles = makeStyles({
    textarea: {},
});

export type TextareaProps = BaseComponentProps<string> & {
    placeholder?: string;
};

/**
 * This is a texarea box that stops propagation of change/keydown events
 * @param props
 * @returns
 */
export const Textarea: FunctionComponent<FluentTextareaProps> = (props) => {
    const classes = useInputStyles();
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>, data: any) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onChange) {
            props.onChange(event, data); // Call the original onChange handler passed as prop
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onKeyDown) {
            props.onKeyDown(event); // Call the original onKeyDown handler passed as prop
        }
    };

    return <FluentTextarea {...props} className={classes.textarea} onChange={handleChange} onKeyDown={handleKeyDown} />;
};
