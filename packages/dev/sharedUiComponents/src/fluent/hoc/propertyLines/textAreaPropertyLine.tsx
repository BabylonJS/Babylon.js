import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { type FunctionComponent } from "react";
import { Textarea, type TextareaProps } from "../../primitives/textarea";
/**
 * Wraps textarea in a property line
 * @param props - PropertyLineProps and TextProps
 * @returns property-line wrapped text
 */
export const TextAreaPropertyLine: FunctionComponent<PropertyLineProps<string> & TextareaProps> = (props) => {
    TextAreaPropertyLine.displayName = "TextAreaPropertyLine";
    return (
        <PropertyLine {...props}>
            <Textarea {...props} />
        </PropertyLine>
    );
};
