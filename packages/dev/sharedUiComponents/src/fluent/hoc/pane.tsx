import { Body1Strong, makeStyles, tokens } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import type { FunctionComponent, PropsWithChildren } from "react";

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    icon: {
        width: tokens.fontSizeBase400,
        height: tokens.fontSizeBase400,
        verticalAlign: "middle",
    },
    header: {
        height: tokens.fontSizeBase400,
        fontSize: tokens.fontSizeBase400,
        textAlign: "center",
        verticalAlign: "middle",
    },
});

export type PaneProps = {
    title: string;
    icon?: FluentIcon;
};
export const Pane: FunctionComponent<PropsWithChildren<PaneProps>> = (props) => {
    const classes = useStyles();
    return (
        <div className={classes.rootDiv}>
            <div className={classes.header}>
                {props.icon ? (
                    <props.icon className={classes.icon} />
                ) : (
                    <img className={classes.icon} id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                )}
                <Body1Strong id="title">{props.title}</Body1Strong>
            </div>
            {props.children}
        </div>
    );
};
