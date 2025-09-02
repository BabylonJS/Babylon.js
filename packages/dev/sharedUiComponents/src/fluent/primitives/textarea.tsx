import type { TextareaOnChangeData } from "@fluentui/react-components";
import { Textarea as FluentTextarea, makeStyles } from "@fluentui/react-components";
import type { FunctionComponent, KeyboardEvent, ChangeEvent } from "react";
import type { PrimitiveProps } from "./primitive";

const useInputStyles = makeStyles({
    textarea: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "& textarea": {
            minHeight: "100px",
            maxHeight: "500px",
        },
    },
});

export type TextareaProps = PrimitiveProps<string> & {
    placeholder?: string;
};

/**
 * This is a texarea box that stops propagation of change/keydown events
 * @param props
 * @returns
 */
export const Textarea: FunctionComponent<TextareaProps> = (props) => {
    const classes = useInputStyles();
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>, _data: TextareaOnChangeData) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onChange) {
            props.onChange(event.target.value); // Call the original onChange handler passed as prop
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        event.stopPropagation(); // Prevent event propagation
    };

    return <FluentTextarea {...props} className={classes.textarea} onChange={handleChange} onKeyDown={handleKeyDown} />;
};
