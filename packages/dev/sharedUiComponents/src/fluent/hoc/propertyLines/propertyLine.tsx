import { Body1, Body1Strong, Button, InfoLabel, Link, ToggleButton, Checkbox, makeStyles, tokens } from "@fluentui/react-components";
import { Collapse } from "@fluentui/react-motion-components-preview";
import { AddFilled, CopyRegular, SubtractFilled } from "@fluentui/react-icons";
import type { FunctionComponent, HTMLProps, PropsWithChildren } from "react";
import { useContext, useState, forwardRef, cloneElement, isValidElement, useRef } from "react";
import { copyCommandToClipboard } from "../../../copyCommandToClipboard";
import { ToolContext } from "../fluentToolWrapper";
import type { PrimitiveProps } from "../../primitives/primitive";

const usePropertyLineStyles = makeStyles({
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column", // Stack line + expanded content
        padding: `${tokens.spacingVerticalXS} 0px`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
    line: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
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

type BasePropertyLineProps = {
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
     * Link to the documentation for this property, available from the info icon either linked from the description (if provided) or default 'docs' text
     */
    docLink?: string;
};

// Only require value/onChange/defaultValue props if nullable is true
type NullableProperty<ValueT> = {
    nullable: true;
    value: ValueT;
    onChange: (value: ValueT) => void;
    defaultValue?: ValueT;
};

type NonNullableProperty = {
    nullable?: false;
};

// Only expect optional expandByDefault prop if expandedContent is defined
type ExpandableProperty = {
    /**
     * If supplied, an 'expand' icon will be shown which, when clicked, renders this component within the property line.
     */
    expandedContent: JSX.Element;

    /**
     * If true, the expanded content will be shown by default.
     */
    expandByDefault?: boolean;
};

// If expanded content is undefined, don't expect expandByDefault prop
type NonExpandableProperty = {
    expandedContent?: undefined;
};

export type PropertyLineProps<ValueT> = BasePropertyLineProps & (NullableProperty<ValueT> | NonNullableProperty) & (ExpandableProperty | NonExpandableProperty);

/**
 * A reusable component that renders a property line with a label and child content, and an optional description, copy button, and expandable section.
 *
 * @param props - The properties for the PropertyLine component.
 * @returns A React element representing the property line.
 *
 */
export const PropertyLine = forwardRef<HTMLDivElement, PropsWithChildren<PropertyLineProps<any>>>((props, ref) => {
    const classes = usePropertyLineStyles();
    const { label, onCopy, expandedContent, children, nullable } = props;

    const [expanded, setExpanded] = useState("expandByDefault" in props ? props.expandByDefault : false);
    const cachedVal = useRef(nullable ? props.value : null);

    const { disableCopy } = useContext(ToolContext);

    const description = props.description ?? (props.docLink ? <Link href={props.docLink}>{props.description ?? "Docs"}</Link> : props.description);

    // Process children to handle nullable state -- creating component in disabled state with default value in lieu of null value
    const processedChildren =
        nullable && isValidElement(children)
            ? cloneElement(children, {
                  ...children.props,
                  disabled: props.value == null || children.props.disabled,
                  value: props.value ?? props.defaultValue,
                  defaultValue: undefined, // Don't pass defaultValue to children as there is no guarantee how this will be used and we can't mix controlled + uncontrolled state
              })
            : children;

    return (
        <LineContainer ref={ref}>
            <div className={classes.line}>
                <InfoLabel className={classes.label} info={description} title={label}>
                    <Body1Strong className={classes.labelText}>{label}</Body1Strong>
                </InfoLabel>
                <div className={classes.rightContent}>
                    {nullable && (
                        // Since this checkbox is used to toggle null, 'checked' means 'non null'
                        <Checkbox
                            checked={!(props.value == null)}
                            onChange={(_, data) => {
                                if (data.checked) {
                                    // if checked this means we are returning to non-null, use cached value if exists. If no cached value, use default value
                                    cachedVal.current != null ? props.onChange(cachedVal.current) : props.onChange(props.defaultValue);
                                } else {
                                    // if moving to un-checked state, this means moving to null value. Cache the old value and tell props.onChange(null)
                                    cachedVal.current = props.value;
                                    props.onChange(null);
                                }
                            }}
                            title="Toggle null state"
                        />
                    )}
                    <div className={classes.fillRestOfRightContentWidth}>{processedChildren}</div>

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
});

export const LineContainer = forwardRef<HTMLDivElement, PropsWithChildren<HTMLProps<HTMLDivElement>>>((props, ref) => {
    const classes = usePropertyLineStyles();
    return (
        <div ref={ref} className={classes.container} {...props}>
            {props.children}
        </div>
    );
});

export const PlaceholderPropertyLine: FunctionComponent<PrimitiveProps<any> & PropertyLineProps<any>> = (props) => {
    return (
        <PropertyLine {...props}>
            <Body1>{props.value}</Body1>
        </PropertyLine>
    );
};
