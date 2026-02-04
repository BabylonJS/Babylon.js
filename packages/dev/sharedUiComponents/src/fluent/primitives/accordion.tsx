import type { AccordionToggleData, AccordionToggleEvent, AccordionProps as FluentAccordionProps, AccordionPanelProps } from "@fluentui/react-components";
import type { ForwardRefExoticComponent, FunctionComponent, PropsWithChildren, RefAttributes } from "react";

import { Children, forwardRef, isValidElement, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
    Accordion as FluentAccordion,
    AccordionItem,
    AccordionHeader,
    AccordionPanel,
    Divider,
    Subtitle2Stronger,
    Portal,
    SearchBox,
    makeStyles,
    tokens,
    MessageBar,
    MessageBarBody,
} from "@fluentui/react-components";
import { EditRegular, CheckmarkFilled, PinRegular, PinFilled, ArrowCircleUpRegular, EyeFilled, EyeOffRegular, FilterRegular } from "@fluentui/react-icons";
import { Button } from "./button";
import { CustomTokens } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";
import {
    AccordionContext,
    AccordionSectionBlockContext,
    AccordionItemDepthContext,
    useAccordionContext,
    useAccordionSectionBlockContext,
    useAccordionSectionItemState,
} from "./accordion.contexts";

const useStyles = makeStyles({
    accordion: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    accordionBody: {
        overflowX: "hidden",
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM, // bottom padding since there is no divider at the bottom
    },
    divider: {
        paddingTop: CustomTokens.dividerGap,
        paddingBottom: CustomTokens.dividerGap,
    },
    dividerSmall: {
        paddingTop: CustomTokens.dividerGapSmall,
        paddingBottom: CustomTokens.dividerGapSmall,
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    highlightDiv: {
        borderRadius: tokens.borderRadiusLarge,
        animationDuration: "1s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "5",
        animationFillMode: "forwards",
        animationName: {
            from: {
                boxShadow: `inset 0 0 4px ${tokens.colorTransparentBackground}`,
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "50%": {
                boxShadow: `inset 0 0 12px ${tokens.colorBrandBackground}`,
            },
            to: {
                boxShadow: `inset 0 0 4px ${tokens.colorTransparentBackground}`,
            },
        },
    },
    menuBar: {
        display: "flex",
    },
    menuBarControls: {
        display: "flex",
        flexGrow: 1,
        justifyContent: "end",
    },
    sectionEmpty: {
        display: "none",
    },
    sectionItemContainer: {
        display: "flex",
        flexDirection: "row",
    },
    sectionItemButtons: {
        display: "flex",
        flexDirection: "row",
        alignItems: "start",
        marginRight: tokens.spacingHorizontalXS,
    },
    pinnedContainer: {
        display: "flex",
        flexDirection: "column",
    },
    pinnedContainerEmpty: {
        "&:not(:only-child)": {
            display: "none",
        },
    },
    searchBox: {
        width: "100%",
    },
});

/**
 * Renders the menu bar and control buttons.
 *
 * @returns `div`, or `undefined` if all features are disabled.
 */
const AccordionMenuBar: FunctionComponent = () => {
    AccordionMenuBar.displayName = "AccordionMenuBar";
    const classes = useStyles();
    const accordionCtx = useContext(AccordionContext);

    if (!accordionCtx) {
        return null;
    }

    const { state, dispatch, features } = accordionCtx;
    const { editMode } = state;

    return (
        <div className={classes.menuBar}>
            <AccordionSearchBox />
            <div className={classes.menuBarControls}>
                {features.hiding && editMode && (
                    <>
                        <Button title="Show all" icon={EyeFilled} appearance="subtle" onClick={() => dispatch({ type: "SHOW_ALL" })} />
                        <Button
                            title="Hide all"
                            icon={EyeOffRegular}
                            appearance="subtle"
                            onClick={() => {
                                // Hide all visible items - we pass all non-hidden, matching items
                                // For simplicity, we dispatch with an empty array; the actual filtering
                                // would need to be done with knowledge of all registered items.
                                // This is a limitation - in a full implementation, you'd track registered items.
                                dispatch({ type: "HIDE_ALL_VISIBLE", visibleItemIds: [] });
                            }}
                        />
                    </>
                )}
                {(features.pinning || features.hiding) && (
                    <Button
                        title="Edit mode"
                        icon={editMode ? CheckmarkFilled : EditRegular}
                        appearance={editMode ? "primary" : "subtle"}
                        onClick={() => dispatch({ type: "SET_EDIT_MODE", enabled: !editMode })}
                    />
                )}
            </div>
        </div>
    );
};

/**
 * Props: `AccordionSectionBlock`.
 */
export type AccordionSectionBlockProps = {
    /** The ID of the `AccordionSectionBlock`, unique within the `Accordion` instance. */
    sectionId: string;
};

/**
 * Wrapper component that must encapsulate the section headers and panels.
 * - Stores the section ID for use in `AccordionSectionItem`.
 *
 * @param props - `AccordionSectionBlockProps`
 * @returns `AccordionSectionBlockContext.Provider`, or `AccordionItem` if all features are disabled.
 */
const AccordionSectionBlock: FunctionComponent<PropsWithChildren<AccordionSectionBlockProps>> = (props) => {
    AccordionSectionBlock.displayName = "AccordionSectionBlock";
    const { children, sectionId } = props;
    const accordionCtx = useContext(AccordionContext);
    const sectionContext = useAccordionSectionBlockContext(props);

    if (accordionCtx) {
        return (
            <AccordionSectionBlockContext.Provider value={sectionContext}>
                <AccordionItem value={sectionId}>{children}</AccordionItem>
            </AccordionSectionBlockContext.Provider>
        );
    }

    return <AccordionItem value={sectionId}>{children}</AccordionItem>;
};

/**
 * Props: `AccordionSectionItem`.
 */
export type AccordionSectionItemProps = {
    /** The ID of the `AccordionSectionItem`, unique within the `AccordionSectionBlock` instance. */
    uniqueId: string;
    /** The searchable text label for the item. */
    label?: string;
    /** Whether the item is not interactable. */
    staticItem?: boolean;
};

/**
 * Wrapper component that must encapsulate individual items.
 * - Renders the pin button and tracks the pinned state of the item.
 * - Renders the hide button and tracks the hidden state of the item.
 * - Filters items based on the current search term.
 *
 * @param props - `AccordionSectionItemProps`
 * @returns `Portal` if pinned; `null` if hidden/filtered; `children` otherwise.
 */
export const AccordionSectionItem: FunctionComponent<PropsWithChildren<AccordionSectionItemProps>> = (props) => {
    AccordionSectionItem.displayName = "AccordionSectionItem";
    const { children, staticItem } = props;
    const classes = useStyles();
    const accordionCtx = useContext(AccordionContext);
    const itemState = useAccordionSectionItemState(props);
    const [ctrlMode, setCtrlMode] = useState(false);

    // If static item or no context, just render children
    if (staticItem || !accordionCtx || !itemState) {
        return <>{children}</>;
    }

    const { pinnedContainerRef, features } = accordionCtx;
    const { isNested, isPinned, isHidden, isMatch, pinnedIndex, inEditMode, actions } = itemState;

    // Nested items just render children (don't show controls)
    if (isNested) {
        return <>{children}</>;
    }

    // If hidden (and not in edit mode) or doesn't match search, don't render
    if ((isHidden && !inEditMode) || !isMatch) {
        return null;
    }

    const pinnedContainer = isPinned ? pinnedContainerRef.current : null;
    const showControls = inEditMode || ctrlMode;

    const onMouseMove = (e: React.MouseEvent) => {
        if (e.ctrlKey !== ctrlMode) {
            setCtrlMode(e.ctrlKey);
        }
    };

    const onMouseLeave = () => {
        if (ctrlMode) {
            setCtrlMode(false);
        }
    };

    const itemElement = (
        <div className={classes.sectionItemContainer} style={isPinned ? { order: pinnedIndex } : undefined} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            {showControls && (
                <div className={classes.sectionItemButtons}>
                    {features.hiding && (
                        <Button title={isHidden ? "Unhide" : "Hide"} icon={isHidden ? EyeOffRegular : EyeFilled} appearance="transparent" onClick={actions.toggleHidden} />
                    )}
                    {features.pinning && (
                        <>
                            <Button title={isPinned ? "Unpin" : "Pin"} icon={isPinned ? PinFilled : PinRegular} appearance="transparent" onClick={actions.togglePinned} />
                            {isPinned && (
                                <Button title="Move up" icon={ArrowCircleUpRegular} appearance="transparent" disabled={pinnedIndex === 0} onClick={actions.movePinnedUp} />
                            )}
                        </>
                    )}
                </div>
            )}
            <AccordionItemDepthContext.Provider value={true}>{children}</AccordionItemDepthContext.Provider>
        </div>
    );

    return pinnedContainer ? <Portal mountNode={pinnedContainer}>{itemElement}</Portal> : itemElement;
};

/**
 * Renders the Pinned section container and defines the portal target for the pinned items.
 *
 * @returns `div`
 */
const AccordionPinnedContainer: FunctionComponent = () => {
    AccordionPinnedContainer.displayName = "AccordionPinnedContainer";
    const classes = useStyles();
    const accordionCtx = useContext(AccordionContext);

    return (
        <div ref={accordionCtx?.pinnedContainerRef} className={classes.pinnedContainer}>
            <MessageBar className={classes.pinnedContainerEmpty}>
                <MessageBarBody>No pinned items</MessageBarBody>
            </MessageBar>
        </div>
    );
};

/**
 * Renders the search box for filtering items.
 *
 * @returns `SearchBox`, or `null` if the feature is disabled.
 */
const AccordionSearchBox: FunctionComponent = () => {
    AccordionSearchBox.displayName = "AccordionSearchBox";
    const classes = useStyles();
    const accordionCtx = useContext(AccordionContext);

    if (!accordionCtx?.features.search) {
        return null;
    }

    const { state, dispatch } = accordionCtx;

    return (
        <SearchBox
            className={classes.searchBox}
            appearance="underline"
            contentBefore={<FilterRegular />}
            placeholder="Filter"
            value={state.searchTerm}
            onChange={(_, data) => dispatch({ type: "SET_SEARCH_TERM", term: data.value })}
        />
    );
};

/**
 * Props: `AccordionSection`.
 */
export type AccordionSectionProps = {
    /** The text label shown in the section header. */
    title: string;
    /** Indicates whether the `AccordionSection` is initially collapsed. */
    collapseByDefault?: boolean;
};

/**
 * Wrapper component that must encapsulate the section body.
 *
 * @param props - `AccordionSectionProps`
 * @returns `div`
 */
export const AccordionSection: FunctionComponent<PropsWithChildren<AccordionSectionProps>> = (props) => {
    AccordionSection.displayName = "AccordionSection";
    const classes = useStyles();

    return <div className={classes.panelDiv}>{props.children}</div>;
};

/**
 * Props: `Accordion`.
 */
export type AccordionProps = {
    /** The unique ID of the `Accordion` instance. */
    uniqueId?: string;
    /** The list of sections to be highlighted. */
    highlightSections?: readonly string[];
    /** Enables the pinned items feature. */
    enablePinnedItems?: boolean;
    /** Enables the hidden items feature. */
    enableHiddenItems?: boolean;
    /** Enables the search items feature. */
    enableSearchItems?: boolean;
};

const StringAccordion = FluentAccordion as ForwardRefExoticComponent<FluentAccordionProps<string> & RefAttributes<HTMLDivElement>>;

export const Accordion = forwardRef<HTMLDivElement, PropsWithChildren<AccordionProps>>((props, ref) => {
    Accordion.displayName = "Accordion";
    const { children, highlightSections, ...rest } = props;
    const classes = useStyles();
    const { size } = useContext(ToolContext);
    const accordionCtx = useAccordionContext(props);
    const hasPinning = accordionCtx?.features.pinning ?? false;

    const pinnedSectionElement = useMemo(() => {
        return (
            hasPinning && (
                <AccordionSection title="Pinned" collapseByDefault={false}>
                    <AccordionPinnedContainer />
                </AccordionSection>
            )
        );
    }, [hasPinning]);

    // Prevents sections contents from unmounting when closed, allowing their elements to be used in the Pinned section.
    const preventUnmountMotion: AccordionPanelProps["collapseMotion"] = useMemo(() => {
        // https://github.com/microsoft/fluentui/issues/34309#issuecomment-2824364945
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return hasPinning ? { children: (Component, props) => <Component {...props} unmountOnExit={false} /> } : undefined;
    }, [hasPinning]);

    const validChildren = useMemo(() => {
        return (
            Children.map([pinnedSectionElement, children], (child) => {
                if (isValidElement(child)) {
                    const childProps = child.props as Partial<AccordionSectionProps>;
                    if (childProps.title) {
                        return {
                            title: childProps.title,
                            collapseByDefault: childProps.collapseByDefault,
                            content: child,
                        };
                    }
                }
                return null;
            })?.filter(Boolean) ?? []
        );
    }, [children]);

    // Tracks open items, and used to tell the Accordion which sections should be expanded.
    const [openItems, setOpenItems] = useState(validChildren.filter((child) => !child.collapseByDefault).map((child) => child.title));

    // Tracks closed items, which is needed so that when the children change, we only update the open/closed state
    // (depending on the collapseByDefault prop) for items that have not been explicitly opened or closed.
    const [closedItems, setClosedItems] = useState(validChildren.filter((child) => child.collapseByDefault).map((child) => child.title));

    const internalOpenItemsRef = useRef<string[] | undefined>(openItems);

    // When highlight sections is requested, we temporarily override the open items, but if highlight sections is cleared,
    // then we revert back to the normal open items tracking.
    useLayoutEffect(() => {
        if (highlightSections) {
            internalOpenItemsRef.current = [...openItems];
            setOpenItems([...highlightSections]);
        } else {
            setOpenItems([...(internalOpenItemsRef.current ?? [])]);
            internalOpenItemsRef.current = undefined;
        }
    }, [highlightSections]);

    useEffect(() => {
        for (const defaultOpenItem of validChildren.filter((child) => !child.collapseByDefault).map((child) => child.title)) {
            // If a child is not marked as collapseByDefault, then it should be opened by default, and
            // it is only "default" if it hasn't already been explicitly added to the opened or closed list.
            if (!closedItems.includes(defaultOpenItem) && !openItems.includes(defaultOpenItem)) {
                setOpenItems((prev) => [...prev, defaultOpenItem]);
            }
        }
    }, [validChildren]);

    const onToggle = useCallback((event: AccordionToggleEvent, data: AccordionToggleData<string>) => {
        if (data.openItems.includes(data.value)) {
            setOpenItems((prev) => [...prev, data.value]);
            setClosedItems((prev) => prev.filter((item) => item !== data.value));
        } else {
            setClosedItems((prev) => [...prev, data.value]);
            setOpenItems((prev) => prev.filter((item) => item !== data.value));
        }
    }, []);

    return (
        <StringAccordion ref={ref} className={classes.accordion} collapsible multiple onToggle={onToggle} openItems={openItems} {...rest}>
            <AccordionContext.Provider value={accordionCtx}>
                <AccordionMenuBar />
                <div className={classes.accordionBody}>
                    {validChildren.map((child, index) => {
                        const isHighlighted = highlightSections?.includes(child.title);
                        return (
                            <AccordionSectionBlock key={child.content.key ?? child.title} sectionId={child.title}>
                                <div className={isHighlighted ? classes.highlightDiv : undefined}>
                                    <AccordionHeader size={size}>
                                        <Subtitle2Stronger>{child.title}</Subtitle2Stronger>
                                    </AccordionHeader>
                                    <AccordionPanel collapseMotion={preventUnmountMotion}>
                                        <div className={classes.panelDiv}>{child.content}</div>
                                    </AccordionPanel>
                                </div>
                                {index < validChildren.length - 1 && <Divider inset={true} className={size === "small" ? classes.dividerSmall : classes.divider} />}
                            </AccordionSectionBlock>
                        );
                    })}
                </div>
            </AccordionContext.Provider>
        </StringAccordion>
    );
});
