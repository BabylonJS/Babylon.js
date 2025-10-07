import { LineContainer } from "./propertyLines/propertyLine";
import type { FunctionComponent } from "react";
import { Button } from "../primitives/button";
import type { ButtonProps } from "../primitives/button";

type ButtonLineProps = Omit<ButtonProps, "label"> & { label: string }; // Require a label when button is the entire line (by default, label is optional on a button)

/**
 * Wraps a button with a label in a line container
 * @param props Button props plus a label
 * @returns A button inside a line
 */
export const ButtonLine: FunctionComponent<ButtonLineProps> = (props) => {
    ButtonLine.displayName = "ButtonLine";

    return (
        <LineContainer>
            <Button {...props} />
        </LineContainer>
    );
};
