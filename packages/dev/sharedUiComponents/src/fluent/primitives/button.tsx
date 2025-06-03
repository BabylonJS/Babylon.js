import { FunctionComponent } from "react";
import { Button as FluentButton, ButtonProps, makeStyles } from "@fluentui/react-components";

type OurButtonProps = {
    label?: string;
    iconStr?: string;
    iconLabel?: string;
};

const useButtonStyles = makeStyles({
    button: {
        width: "100%",
    },
});

export const ButtonLine: FunctionComponent<ButtonProps & OurButtonProps> = (props: ButtonProps & OurButtonProps) => {
    const styles = useButtonStyles();

    return (
        <FluentButton
            className={styles.button}
            appearance="primary"
            icon={props.icon && <img src={props.iconStr} title={props.iconLabel} alt={props.iconLabel} className="icon" />}
            {...props}
        >
            {props.label}
        </FluentButton>
    );
};
