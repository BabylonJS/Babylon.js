import { Body1Strong, Button, InfoLabel, ToggleButton, makeStyles, tokens } from "@fluentui/react-components";
import { Collapse } from "@fluentui/react-motion-components-preview";
import { AddFilled, CopyRegular, SubtractFilled } from "@fluentui/react-icons";
import type { FunctionComponent, PropsWithChildren } from "react";
import { useContext, useState } from "react";
import { copyCommandToClipboard } from "../../copyCommandToClipboard";
import { ToolContext } from "./fluentToolWrapper";

const usePropertyLineStyles = makeStyles({
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column", // Stack line + expanded content
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
    line: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: `${tokens.spacingVerticalXS} 0px`,
        width: "100%",
    },
    label: {
        flex: "1 1 0",
        minWidth: "50px",
        textAlign: "left",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    labelText: {
        whiteSpace: "nowrap",
    },
    rightContent: {
        flex: "0 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: tokens.spacingHorizontalS,
    },
    button: {
        marginLeft: tokens.spacingHorizontalXXS,
        margin: 0,
        padding: 0,
        border: 0,
        minWidth: 0,
    },
    fillRestOfRightContentWidth: {
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    expandButton: {
        margin: 0,
    },
    expandedContent: {},
});

export type PropertyLineProps = {
    /**
     * The name of the property to display in the property line.
     */
    label: string;
    /**
     * Optional description for the property, shown on hover of the info icon
     */
    description?: string;
    /**
     * Optional function returning a string to copy to clipboard.
     */
    onCopy?: () => string;
    /**
     * If supplied, an 'expand' icon will be shown which, when clicked, renders this component within the property line.
     */
    expandedContent?: JSX.Element;
};

export const LineContainer: FunctionComponent<PropsWithChildren> = (props) => {
    const classes = usePropertyLineStyles();
    return <div className={classes.container}>{props.children}</div>;
};

export type BaseComponentProps<T> = {
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
    className?: string;
};

/**
 * A reusable component that renders a property line with a label and child content, and an optional description, copy button, and expandable section.
 *
 * @param props - The properties for the PropertyLine component.
 * @returns A React element representing the property line.
 *
 */
export const PropertyLine: FunctionComponent<PropsWithChildren<PropertyLineProps>> = (props) => {
    const classes = usePropertyLineStyles();
    const [expanded, setExpanded] = useState(false);

    const { label, description, onCopy, expandedContent, children } = props;

    const { disableCopy } = useContext(ToolContext);

    return (
        <LineContainer>
            <div className={classes.line}>
                <InfoLabel className={classes.label} info={description}>
                    <Body1Strong className={classes.labelText}>{label}</Body1Strong>
                </InfoLabel>
                <div className={classes.rightContent}>
                    <div className={classes.fillRestOfRightContentWidth}>{children}</div>

                    {expandedContent && (
                        <ToggleButton
                            appearance="transparent"
                            icon={expanded ? <SubtractFilled /> : <AddFilled />}
                            className={classes.button}
                            checked={expanded}
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded((expanded) => !expanded);
                            }}
                        />
                    )}

                    {onCopy && !disableCopy && (
                        <Button className={classes.button} id="copyProperty" icon={<CopyRegular />} onClick={() => copyCommandToClipboard(onCopy())} title="Copy to clipboard" />
                    )}
                </div>
            </div>
            <Collapse visible={expanded && !!expandedContent}>
                <div className={classes.expandedContent}>{expandedContent}</div>
            </Collapse>
        </LineContainer>
    );
};
