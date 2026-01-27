import { Body1, Checkbox, makeStyles, tokens, mergeClasses, Tooltip } from "@fluentui/react-components";
import {
    ChevronCircleDown20Regular,
    ChevronCircleDown16Regular,
    ChevronCircleRight16Regular,
    ChevronCircleRight20Regular,
    CopyRegular,
    Copy16Regular,
} from "@fluentui/react-icons";
import type { FunctionComponent, HTMLProps, PropsWithChildren } from "react";
import { useContext, useState, forwardRef, cloneElement, isValidElement, useRef } from "react";
import { Collapse } from "../../primitives/collapse";
import { copyCommandToClipboard } from "../../../copyCommandToClipboard";
import { ToolContext } from "../fluentToolWrapper";
import type { PrimitiveProps } from "../../primitives/primitive";
import { Link } from "../../primitives/link";
import { ToggleButton } from "../../primitives/toggleButton";
import { Button } from "../../primitives/button";
import { CustomTokens, TokenMap } from "../../primitives/utils";
import { InfoLabel } from "../../primitives/infoLabel";

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
    rightContent: {
        flex: "0 1 auto",
        minWidth: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    childWrapper: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
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
    expandedContentDivIndented: {
        paddingLeft: tokens.spacingHorizontalM,
    },
    checkbox: {
        display: "flex",
        alignItems: "center",
        marginRight: tokens.spacingHorizontalXS,
    },
    checkboxIndicator: {
        margin: TokenMap.px2,
        width: TokenMap.px12,
        height: TokenMap.px12,
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

// Only expect optional expandByDefault or indentExpandedContent prop if expandedContent is defined
type ExpandableProperty = {
    /**
     * If supplied, an 'expand' icon will be shown which, when clicked, renders this component within the property line.
     */
    expandedContent: JSX.Element;

    /**
     * If true, the expanded content will be shown by default.
     */
    expandByDefault?: boolean;

    /**
     * If true, the expanded content will be indented to the right.
     */
    indentExpandedContent?: boolean;
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

    const description = props.docLink ? <Link url={props.docLink} value={props.description ?? "Docs"} /> : props.description ? <Body1>{props.description}</Body1> : undefined;

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
                <InfoLabel className={classes.infoLabel} htmlFor="property" info={description} label={label} flexLabel />
                <div className={classes.rightContent} id="property">
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
                        <Tooltip relationship="label" content={props.value == null ? "Enable property" : "Disable property (set to null)"}>
                            <Checkbox
                                className={classes.checkbox}
                                indicator={{ className: classes.checkboxIndicator }}
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
                            />
                        </Tooltip>
                    )}
                    <div className={classes.childWrapper}>{processedChildren}</div>
                    {onCopy && !disableCopy && (
                        <Button
                            className={classes.copy}
                            title="Copy to clipboard"
                            appearance="transparent"
                            icon={size === "small" ? Copy16Regular : CopyRegular}
                            onClick={() => copyCommandToClipboard(onCopy())}
                        />
                    )}
                </div>
            </div>
            {expandedContent && (
                <Collapse visible={!!expanded}>
                    <div className={mergeClasses(classes.expandedContentDiv, props.indentExpandedContent ? classes.expandedContentDivIndented : undefined)}>{expandedContent}</div>
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
        borderTop: `1px solid transparent`,
        borderBottom: `1px solid transparent`,
        ":hover": {
            borderTopColor: tokens.colorNeutralStroke2,
            borderBottomColor: tokens.colorNeutralStroke2,
        },
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
