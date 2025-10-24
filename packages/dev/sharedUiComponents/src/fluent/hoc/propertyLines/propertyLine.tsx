import { Body1, InfoLabel, Link, Checkbox, makeStyles, Body1Strong, tokens, mergeClasses } from "@fluentui/react-components";
import {
    ChevronCircleDown20Regular,
    ChevronCircleDown16Regular,
    ChevronCircleRight16Regular,
    ChevronCircleRight20Regular,
    Copy16Regular,
    Copy20Regular,
} from "@fluentui/react-icons";
import type { FunctionComponent, HTMLProps, PropsWithChildren } from "react";
import { useContext, useState, forwardRef, cloneElement, isValidElement, useRef } from "react";
import { Collapse } from "../../primitives/collapse";
import { copyCommandToClipboard } from "../../../copyCommandToClipboard";
import { ToolContext } from "../fluentToolWrapper";
import type { PrimitiveProps } from "../../primitives/primitive";
import { ToggleButton } from "../../primitives/toggleButton";
import { Button } from "../../primitives/button";
import { CustomTokens } from "../../primitives/utils";

const usePropertyLineStyles = makeStyles({
    baseLine: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
    },
    infoLabel: {
        display: "flex",
        flex: "1 1 0", // grow=1, shrink =1, basis = 0 initial size before
        minWidth: CustomTokens.labelMinWidth,
        textAlign: "left",
    },
    labelSlot: {
        display: "flex",
        minWidth: 0,
    },
    labelText: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    rightContent: {
        flex: "0 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    infoPopup: {
        whiteSpace: "normal",
        wordBreak: "break-word",
    },
    copy: {
        marginRight: CustomTokens.rightAlignOffset, // Accounts for the padding baked into fluent button / ensures propertyLine looks visually aligned at the right
    },
    expandedContentDiv: {
        overflow: "hidden",
    },
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
    ignoreNullable: false;
    value: ValueT;
    onChange: (value: ValueT) => void;
    defaultValue?: ValueT;
};

type IgnoreNullable<ValueT> = {
    ignoreNullable: true;
    nullable: false;
    value: ValueT;
    onChange: (value: ValueT) => void;
    defaultValue: ValueT;
};

type NonNullableProperty = {
    nullable?: false;
    ignoreNullable?: false;
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

export type PropertyLineProps<ValueT> = BasePropertyLineProps &
    (NullableProperty<ValueT> | NonNullableProperty | IgnoreNullable<ValueT>) &
    (ExpandableProperty | NonExpandableProperty);

/**
 * A reusable component that renders a property line with a label and child content, and an optional description, copy button, and expandable section.
 *
 * @param props - The properties for the PropertyLine component.
 * @returns A React element representing the property line.
 *
 */
export const PropertyLine = forwardRef<HTMLDivElement, PropsWithChildren<PropertyLineProps<any>>>((props, ref) => {
    PropertyLine.displayName = "PropertyLine";
    const { disableCopy, size } = useContext(ToolContext);
    const classes = usePropertyLineStyles();
    const { label, onCopy, expandedContent, children, nullable, ignoreNullable } = props;

    const [expanded, setExpanded] = useState("expandByDefault" in props ? props.expandByDefault : false);
    const cachedVal = useRef(nullable ? props.value : null);

    const description = props.docLink ? <Link href={props.docLink}>{props.description ?? "Docs"}</Link> : props.description;

    // Process children to handle nullable state -- creating component in disabled state with default value in lieu of null value
    const processedChildren =
        (nullable || ignoreNullable) && isValidElement(children)
            ? cloneElement(children, {
                  ...children.props,
                  disabled: children.props.disabled || (nullable && props.value == null),
                  value: props.value ?? props.defaultValue,
                  defaultValue: undefined, // Don't pass defaultValue to children as there is no guarantee how this will be used and we can't mix controlled + uncontrolled state
              })
            : children;

    return (
        <LineContainer ref={ref}>
            <div className={classes.baseLine}>
                <InfoLabel
                    size={size}
                    className={classes.infoLabel}
                    label={{ className: classes.labelSlot }}
                    info={description ? <div className={classes.infoPopup}>{description}</div> : undefined}
                    title={label}
                >
                    <Body1Strong className={classes.labelText}>{label}</Body1Strong>
                </InfoLabel>
                <div className={classes.rightContent}>
                    {expandedContent && (
                        <ToggleButton
                            title="Expand/Collapse property"
                            appearance="transparent"
                            checkedIcon={size === "small" ? ChevronCircleDown16Regular : ChevronCircleDown20Regular}
                            uncheckedIcon={size === "small" ? ChevronCircleRight16Regular : ChevronCircleRight20Regular}
                            value={expanded === true}
                            onChange={setExpanded}
                        />
                    )}

                    {nullable && !ignoreNullable && (
                        // If this is a nullableProperty and ignoreNullable was not sent, display a checkbox used to toggle null ('checked' means 'non null')
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
                    {processedChildren}
                    {onCopy && !disableCopy && (
                        <Button
                            className={classes.copy}
                            title="Copy to clipboard"
                            appearance="transparent"
                            icon={size === "small" ? Copy16Regular : Copy20Regular}
                            onClick={() => copyCommandToClipboard(onCopy())}
                        />
                    )}
                </div>
            </div>
            {expandedContent && (
                <Collapse visible={!!expanded}>
                    <div className={classes.expandedContentDiv}>{expandedContent}</div>
                </Collapse>
            )}
        </LineContainer>
    );
});

const useLineStyles = makeStyles({
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column", // Stack line + expanded content
        minHeight: CustomTokens.lineHeight,
        boxSizing: "border-box",
        justifyContent: "center",
        paddingTop: tokens.spacingVerticalXXS,
        paddingBottom: tokens.spacingVerticalXXS,
    },
    containerSmall: {
        minHeight: CustomTokens.lineHeightSmall,
    },
});

export const LineContainer = forwardRef<HTMLDivElement, PropsWithChildren<HTMLProps<HTMLDivElement>>>((props, ref) => {
    const { size } = useContext(ToolContext);
    const classes = useLineStyles();

    return (
        <div ref={ref} className={mergeClasses(classes.container, size == "small" ? classes.containerSmall : undefined)} {...props}>
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
