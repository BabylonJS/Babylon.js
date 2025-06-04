import { Body1Strong, Button, InfoLabel, makeStyles, tokens } from "@fluentui/react-components";
import { Add24Filled, Copy24Regular, Subtract24Filled } from "@fluentui/react-icons";
import type { FunctionComponent, PropsWithChildren } from "react";
import { useState } from "react";
import { copyCommandToClipboard } from "shared-ui-components/copyCommandToClipboard";

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
        width: "33%",
        textAlign: "left",
    },
    rightContent: {
        width: "67%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    button: {
        marginLeft: tokens.spacingHorizontalXXS,
        width: "100px",
    },
    fillRestOfRightContentWidth: {
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    expandedContent: {
        backgroundColor: tokens.colorNeutralBackground1,
    },
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

/**
 * A reusable component that renders a property line with a label and child content, and an optional description, copy button, and expandable section.
 *
 * @param props - The properties for the PropertyLine component.
 * @returns A React element representing the property line.
 *
 */
export const PropertyLine: FunctionComponent<PropsWithChildren<PropertyLineProps>> = (props) => {
    const styles = usePropertyLineStyles();
    const [expanded, setExpanded] = useState(false);

    const { label, description, onCopy, expandedContent, children } = props;

    return (
        <div className={styles.container}>
            <div className={styles.line}>
                <InfoLabel className={styles.label} info={description}>
                    <Body1Strong>{label}</Body1Strong>
                </InfoLabel>
                <div className={styles.rightContent}>
                    <div className={styles.fillRestOfRightContentWidth}>{children}</div>

                    {expandedContent && (
                        <Button
                            appearance="subtle"
                            icon={expanded ? <Subtract24Filled /> : <Add24Filled />}
                            className={styles.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded((expanded) => !expanded);
                            }}
                        />
                    )}

                    {onCopy && (
                        <Button className={styles.button} id="copyProperty" icon={<Copy24Regular />} onClick={() => copyCommandToClipboard(onCopy())} title="Copy to clipboard" />
                    )}
                </div>
            </div>

            {expanded && expandedContent && <div className={styles.expandedContent}>{expandedContent}</div>}
        </div>
    );
};

/**
 * Helper which splits the PropertyLineProps from the rest of the props, to be used by HOCs that wrap a component in a PropertyLine
 * @param props The full set of props passed to the component
 * @returns A tuple containing the PropertyLineProps and the rest of the props
 */
export const SplitPropertyLineProps = <T extends PropertyLineProps>(props: T): [PropertyLineProps, Omit<T, keyof PropertyLineProps>] => {
    const { label, description, onCopy, ...rest } = props;
    return [{ label, description, onCopy }, rest as Omit<T, keyof PropertyLineProps>];
};
