import { Textarea as FluentTextarea, TextareaProps as FluentTextareaProps, makeStyles } from "@fluentui/react-components";
import { FunctionComponent } from "react";

const useInputStyles = makeStyles({
    textarea: {},
});

/**
 * This is a texarea box that stops propagation of change/keydown events
 * @param props
 * @returns
 */
export const Textarea: FunctionComponent<FluentTextareaProps> = (props: FluentTextareaProps) => {
    const styles = useInputStyles();
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>, data: any) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onChange) {
            props.onChange(event, data); // Call the original onChange handler passed as prop
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onKeyDown) {
            props.onKeyDown(event); // Call the original onKeyDown handler passed as prop
        }
    };

    return <FluentTextarea {...props} className={styles.textarea} onChange={handleChange} onKeyDown={handleKeyDown} />;
};
