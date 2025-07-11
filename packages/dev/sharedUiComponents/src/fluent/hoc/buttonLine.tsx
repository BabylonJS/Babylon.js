import { Body1, Button as FluentButton, makeStyles, tokens } from "@fluentui/react-components";
import { LineContainer } from "./propertyLine";
import type { FunctionComponent } from "react";
import type { FluentIcon } from "@fluentui/react-icons";

const useButtonLineStyles = makeStyles({
    button: {
        border: `1px solid ${tokens.colorBrandBackground}`,
    },
});

export type ButtonProps = {
    onClick: () => void;
    icon?: FluentIcon;
    label: string;
    disabled?: boolean;
};

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

export const Button: FunctionComponent<ButtonProps> = (props) => {
    const classes = useButtonLineStyles();
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { icon: Icon, ...buttonProps } = props;

    return (
        <FluentButton iconPosition="after" className={classes.button} {...buttonProps} icon={Icon && <Icon />}>
            <Body1>{props.label}</Body1>
        </FluentButton>
    );
};
