import type { FunctionComponent } from "react";
import { Body1Strong, InfoLabel as FluentInfoLabel, makeStyles } from "@fluentui/react-components";

export type InfoLabelProps = {
    htmlFor: string; // required ID of the element whose label we are applying
    info?: JSX.Element;
    label: string;
    className?: string;
};
export type InfoLabelParentProps = Omit<InfoLabelProps, "htmlFor">;
const useInfoLabelStyles = makeStyles({
    infoPopup: {
        whiteSpace: "normal",
        wordBreak: "break-word",
    },
    labelText: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
});
/**
 * Renders a label with an optional popup containing more info
 * @param props
 * @returns
 */
export const InfoLabel: FunctionComponent<InfoLabelProps> = (props) => {
    InfoLabel.displayName = "InfoLabel";
    const classes = useInfoLabelStyles();

    const infoContent = props.info ? <div className={classes.infoPopup}>{props.info}</div> : undefined;

    return (
        <FluentInfoLabel htmlFor={props.htmlFor} info={infoContent} className={props.className}>
            <Body1Strong className={classes.labelText}>{props.label}</Body1Strong>
        </FluentInfoLabel>
    );
};
