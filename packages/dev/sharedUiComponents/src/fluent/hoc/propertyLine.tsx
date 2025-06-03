import { Body1Strong, Button, InfoLabel, makeStyles, tokens } from "@fluentui/react-components";
import { Add24Filled, Copy24Regular, Subtract24Filled } from "@fluentui/react-icons";
import { ComponentType, FunctionComponent, useState } from "react";
import { copyCommandToClipboard } from "shared-ui-components/copyCommandToClipboard";

const usePropertyLineStyle = makeStyles({
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column", // Stack line + expanded content
        borderBottom: "1px solid #eee",
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
        marginLeft: "10px",
        width: "100px",
    },
    fillRestOfRightContentWidth: {
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    expandedContent: {
        padding: "8px 12px",
        backgroundColor: "#f9f9f9",
    },
});

export interface IPropertyLineProps {
    children: React.ReactNode;
    label: string; // The name of the property to display in the propetryline
    description?: string; // if passed, the property line label will have a tooltip with this description
    onCopy?: () => string; // Optional function returning a string to copy to clipboard
    renderExpandedContent?: ComponentType; // If supplied, the propertyline will render an 'expand' icon which when clicked renders this component within the property line
}

export const PropertyLine: FunctionComponent<IPropertyLineProps> = (props: IPropertyLineProps) => {
    const styles = usePropertyLineStyle();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.line}>
                <InfoLabel className={styles.label} info={props.description}>
                    <Body1Strong>{props.label}</Body1Strong>
                </InfoLabel>
                <div className={styles.rightContent}>
                    <div className={styles.fillRestOfRightContentWidth}>{props.children}</div>

                    {props.renderExpandedContent && (
                        <Button
                            appearance="subtle"
                            icon={expanded ? <Subtract24Filled /> : <Add24Filled />}
                            className={styles.button}
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        />
                    )}

                    {props.onCopy && (
                        <Button
                            className={styles.button}
                            id="copyProperty"
                            icon={<Copy24Regular />}
                            onClick={() => copyCommandToClipboard(props.onCopy?.() || "")}
                            title="Copy to clipboard"
                        />
                    )}
                </div>
            </div>

            {expanded && props.renderExpandedContent && (
                <div className={styles.expandedContent}>
                    <props.renderExpandedContent />
                </div>
            )}
        </div>
    );
};
