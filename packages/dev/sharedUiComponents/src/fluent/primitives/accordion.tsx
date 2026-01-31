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
    AccordionSectionItemContext,
    useAccordionContext,
    useAccordionSectionBlockContext,
    useAccordionSectionItemContext,
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
    const accordionContext = useContext(AccordionContext);
    const [editMode, setEditMode] = useState(false);

    useMemo(() => {
        if (accordionContext) {
            Object.assign(accordionContext, {
                editMode: {
                    is: editMode,
                    set: setEditMode,
                },
            }).renderItems();
        }
    }, [editMode]);

    const hideAll = useCallback((isHidden: boolean) => {
        if (accordionContext?.hiddenItems) {
            const { itemContextMap, renderItems, storage } = accordionContext;

            for (const { isStatic, hidden, match } of itemContextMap.values()) {
                if (!isStatic && (match?.is ?? true)) {
                    hidden?.toggle(isHidden);
                }
            }

            storage.writeData("Hidden");
            renderItems();
        }
    }, []);

    if (accordionContext) {
        const { pinnedItems, hiddenItems } = accordionContext;

        return (
            <div className={classes.menuBar}>
                <AccordionSearchBox />
                <div className={classes.menuBarControls}>
                    {hiddenItems && editMode && (
                        <>
                            <Button title="Show all" icon={EyeFilled} appearance="subtle" onClick={() => hideAll(false)} />
                            <Button title="Hide all" icon={EyeOffRegular} appearance="subtle" onClick={() => hideAll(true)} />
                        </>
                    )}
                    {(pinnedItems || hiddenItems) && (
                        <Button
                            title="Edit mode"
                            icon={editMode ? CheckmarkFilled : EditRegular}
                            appearance={editMode ? "primary" : "subtle"}
                            onClick={() => {
                                setEditMode(!editMode);
                            }}
                        />
                    )}
                </div>
            </div>
        );
    }

    return;
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
    const classes = useStyles();
    const accordionContext = useContext(AccordionContext);
    const sectionContext = useAccordionSectionBlockContext(props);

    if (accordionContext && sectionContext) {
        return (
            <AccordionSectionBlockContext.Provider value={sectionContext}>
                <AccordionItem className={sectionContext.isEmpty ? classes.sectionEmpty : undefined} value={sectionId}>
                    {children}
                </AccordionItem>
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
    /** Event triggered after the item has been rendered. */
    onRender?: () => void;
};

/**
 * Wrapper component that must encapsulate individual items.
 * - Renders the pin button and tracks the pinned state of the item.
 * - Renders the hide button and tracks the hidden state of the item.
 * - Filters items based on the current search term.
 *
 * @param props - `AccordionSectionItemProps`
 * @returns `Portal` if pinned; `undefined` if discarded; `children` otherwise.
 */
export const AccordionSectionItem: FunctionComponent<PropsWithChildren<AccordionSectionItemProps>> = (props) => {
    AccordionSectionItem.displayName = "AccordionSectionItem";
    const { children } = props;
    const classes = useStyles();
    const accordionContext = useContext(AccordionContext);
    const itemContext = useAccordionSectionItemContext(props);

    if (accordionContext && itemContext) {
        const { renderItems, editMode, pinnedItems, storage } = accordionContext.updated;
        const { itemUniqueId, isDescendant, isStatic, ctrlMode, pinned, hidden, match } = itemContext;
        const inEditMode = editMode?.is || (ctrlMode?.is ?? false);
        const isPinned = pinned?.is ?? false;
        const isHidden = hidden?.is ?? false;
        const isMatch = match?.is ?? true;

        const writeData: typeof storage.writeData = (listName) => {
            ctrlMode?.set(false);
            storage.writeData(listName);
            renderItems();
        };

        if (isStatic) {
            return children;
        } else if ((isDescendant || !isHidden || inEditMode) && isMatch) {
            const pinnedContainer = isPinned ? pinnedItems?.containerRef.current : undefined;
            const pinnedActiveIds = isPinned ? pinnedItems?.activeIds : undefined;
            const pinnedOrder = pinnedActiveIds?.indexOf(itemUniqueId);

            const itemElement = (
                <div
                    className={classes.sectionItemContainer}
                    style={isPinned ? { order: pinnedOrder } : undefined}
                    onMouseMove={ctrlMode ? (event) => ctrlMode.set(event.ctrlKey) : undefined}
                    onMouseLeave={ctrlMode ? () => ctrlMode.set(false) : undefined}
                >
                    {!isDescendant && inEditMode && (
                        <div className={classes.sectionItemButtons}>
                            {hidden && (
                                <Button
                                    title={isHidden ? "Unhide" : "Hide"}
                                    icon={isHidden ? EyeOffRegular : EyeFilled}
                                    appearance="transparent"
                                    onClick={() => {
                                        hidden.toggle();
                                        writeData("Hidden");
                                    }}
                                />
                            )}
                            {pinned && (
                                <>
                                    <Button
                                        title={isPinned ? "Unpin" : "Pin"}
                                        icon={isPinned ? PinFilled : PinRegular}
                                        appearance="transparent"
                                        onClick={() => {
                                            pinned.toggle();
                                            writeData("Pinned");
                                        }}
                                    />
                                    {isPinned && (
                                        <Button
                                            title="Move up"
                                            icon={ArrowCircleUpRegular}
                                            appearance="transparent"
                                            disabled={pinnedOrder === 0}
                                            onClick={() => {
                                                if (pinnedActiveIds && pinnedOrder) {
                                                    pinned.swap(pinnedActiveIds[pinnedOrder - 1]);
                                                    writeData("Pinned");
                                                }
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    <AccordionSectionItemContext.Provider value={itemContext}>{children}</AccordionSectionItemContext.Provider>
                </div>
            );

            return pinnedContainer ? <Portal mountNode={pinnedContainer}>{itemElement}</Portal> : itemElement;
        } else {
            return;
        }
    }

    return children;
};

/**
 * Renders the Pinned section container and defines the portal target for the pinned items.
 *
 * @returns `div`
 */
const AccordionPinnedContainer: FunctionComponent = () => {
    AccordionPinnedContainer.displayName = "AccordionPinnedContainer";
    const classes = useStyles();
    const accordionContext = useContext(AccordionContext);

    return (
        <div ref={accordionContext?.pinnedItems?.containerRef} className={classes.pinnedContainer}>
            <MessageBar className={classes.pinnedContainerEmpty}>
                <MessageBarBody>No pinned items</MessageBarBody>
            </MessageBar>
        </div>
    );
};

/**
 * Renders the search box for filtering items.
 *
 * @returns `SearchBox`, or `undefined` if the feature is disabled.
 */
const AccordionSearchBox: FunctionComponent = () => {
    AccordionSearchBox.displayName = "AccordionSearchBox";
    const classes = useStyles();
    const accordionContext = useContext(AccordionContext);
    const searchItems = accordionContext?.searchItems;
    const [term, setTerm] = useState("");

    useMemo(() => {
        if (searchItems) {
            Object.assign(searchItems, {
                term,
                setTerm,
            });
            accordionContext.renderItems();
        }
    }, [term]);

    if (searchItems) {
        return (
            <SearchBox
                className={classes.searchBox}
                appearance="underline"
                contentBefore={<FilterRegular />}
                placeholder="Filter"
                value={term}
                onChange={(_, data) => {
                    setTerm(data.value);
                }}
            />
        );
    }

    return;
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
    const accordionContext = useAccordionContext(props);
    const pinnedItems = accordionContext?.pinnedItems;

    const pinnedSectionElement = useMemo(() => {
        return (
            pinnedItems && (
                <AccordionSection title="Pinned" collapseByDefault={false}>
                    <AccordionPinnedContainer />
                </AccordionSection>
            )
        );
    }, []);

    // Prevents sections contents from unmounting when closed, allowing their elements to be used in the Pinned section.
    const preventUnmountMotion: AccordionPanelProps["collapseMotion"] = useMemo(() => {
        // https://github.com/microsoft/fluentui/issues/34309#issuecomment-2824364945
        // eslint-disable-next-line
        return pinnedItems ? { children: (Component, props) => <Component {...props} unmountOnExit={false} /> } : undefined;
    }, []);

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
            <AccordionContext.Provider value={accordionContext}>
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
