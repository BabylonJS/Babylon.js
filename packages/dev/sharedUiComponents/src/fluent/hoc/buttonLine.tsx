import { Body1, Button, makeStyles, tokens } from "@fluentui/react-components";
import { LineContainer } from "./propertyLine";
import type { FunctionComponent } from "react";

const useButtonLineStyles = makeStyles({
    button: {
        border: `1px solid ${tokens.colorBrandBackground}`,
    },
});

export type ButtonLineProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: string;
    title?: string;
};

/**
 * Wraps a button with a label in a line container
 * @param props Button props plus a label
 * @returns A button inside a line
 */
export const ButtonLine: FunctionComponent<ButtonLineProps> = (props) => {
    const classes = useButtonLineStyles();
    return (
        <LineContainer>
            <Button className={classes.button} {...props}>
                <Body1>{props.label}</Body1>
            </Button>
        </LineContainer>
    );
};
