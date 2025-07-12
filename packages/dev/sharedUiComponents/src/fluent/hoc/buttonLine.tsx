import { LineContainer } from "./propertyLines/propertyLine";
import type { FunctionComponent } from "react";
import { Button } from "../primitives/button";
import type { ButtonProps } from "../primitives/button";

/**
 * Wraps a button with a label in a line container
 * @param props Button props plus a label
 * @returns A button inside a line
 */
export const ButtonLine: FunctionComponent<ButtonProps> = (props) => {
    return (
        <LineContainer>
            <Button {...props} />
        </LineContainer>
    );
};
