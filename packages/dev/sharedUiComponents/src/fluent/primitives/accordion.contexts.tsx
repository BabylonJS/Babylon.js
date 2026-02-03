import type { RefObject } from "react";
import type { AccordionProps, AccordionSectionBlockProps, AccordionSectionItemProps } from "./accordion";
import { createContext, createRef, useMemo, useState, useEffect, useReducer, useContext } from "react";
import { DataStorage } from "core/Misc/dataStorage";
import { Logger } from "core/Misc/logger";

/**
 * Helper function that displays debug messages only when not in production.
 *
 * @param messageCallback - A callback that returns the message to display, or `undefined` if there is no message.
 */
const DEBUG_MESSAGE = (messageCallback: () => undefined | string) => {
    if (process.env.NODE_ENV !== "production") {
        const message = messageCallback();

        if (message) {
            Logger.Warn(message);
        }
    }
};

/**
 * Helper class to track the presence and order of items in a shared array.
 */
class ListedItem<T> {
    /** The shared array. */
    _array: T[];
    /** The tracked item. */
    _item: T;

    /**
     * @param array - The shared array.
     * @param item - The tracked item.
     */
    constructor(array: T[], item: T) {
        this._array = array;
        this._item = item;
    }

    /** Gets the array. */
    get array() {
        return this._array;
    }

    /** Gets the item. */
    get item() {
        return this._item;
    }

    /** Gets the index of the item in the array. */
    get index() {
        return this._array.indexOf(this._item);
    }

    /** Checks if the item is in the array. */
    get is() {
        return this._array.includes(this._item);
    }

    /** Adds or removes the item from the array. */
    set is(value: boolean) {
        const index = this.index;

        if (index === -1) {
            if (value) {
                this._array.push(this._item);
            }
        } else {
            if (!value) {
                this._array.splice(index, 1);
            }
        }
    }

    /**
     * Adds, removes or toggles the item in the array.
     *
     * @param value - The value to set.
     */
    toggle(value?: boolean) {
        this.is = value ?? !this.is;
    }

    /**
     * Swaps the positions of two items in the array.
     *
     * @param item - The item to swap.
     */
    swap(item: T) {
        this._array[this.index] = item;
        this._array[this._array.indexOf(item)] = this._item;
    }
}

/**
 * Context: `Accordion`.
 */
export type AccordionContext = {
    /** Gets the updated context. */
    updated: AccordionContext;
    /** The unique ID of the `Accordion` instance. */
    accordionId?: string;
    /** Map of all `AccordionSectionBlock` contexts, indexed by their section ID. */
    sectionContextMap: Map<string, AccordionSectionBlockContext>;
    /** Map of all mounted `AccordionSectionItem` contexts, indexed by their unique ID. */
    itemContextMap: Map<string, AccordionSectionItemContext>;
    /** Triggers a render cycle for all mounted items. */
    renderItems: (filter?: { sections?: string[]; items?: string[] }) => void;
    /** Tracks whether the `Accordion` is in edit mode. */
    editMode?: {
        is: boolean;
        set: () => void;
    };
    /** Tracks the state of pinned items, or `undefined` if the feature is not enabled. */
    pinnedItems?: {
        /** Ref to the container in the Pinned section (portal target for the pinned items). */
        containerRef: RefObject<HTMLDivElement>;
        /** List of unique item IDs for the pinned items. */
        uniqueIds: string[];
        /** List of unique item IDs for the currently active (mounted and filtered) pinned items. */
        activeIds: string[];
    };
    /** Tracks the state of hidden items, or `undefined` if the feature is not enabled. */
    hiddenItems?: {
        /** List of unique item IDs for the hidden items. */
        uniqueIds: string[];
    };
    /** Tracks the state of searched items, or `undefined` if the feature is not enabled. */
    searchItems?: {
        /** The current search term. */
        term: string;
        /** Sets the search term. */
        setTerm: (term: string) => void;
        /** Filters text based on the current search term. */
        includes: (text: string) => boolean;
    };
    /** Storage helper functions. */
    storage: {
        /** Reads data from persistent storage. */
        read: (path: string, initial: unknown) => any;
        /** Writes data to persistent storage. */
        write: (path: string, data: unknown) => void;
        /** Writes data to a specific persistent storage. */
        writeData: (listName: "Pinned" | "Hidden") => void;
    };
};

export const AccordionContext = createContext<undefined | AccordionContext>(undefined);

/**
 * Hook: `AccordionContext`.
 *
 * @param props - `AccordionProps`
 * @returns `AccordionContext`, or `undefined` if all features are disabled.
 */
export const useAccordionContext = (props: AccordionProps) => {
    return useMemo(() => {
        const { uniqueId: accordionId, enablePinnedItems, enableHiddenItems, enableSearchItems } = props;

        if (accordionId && (enablePinnedItems || enableHiddenItems || enableSearchItems)) {
            const storageKeyRoot = "Babylon/Accordion";

            const accordionContext: AccordionContext = {
                accordionId,
                sectionContextMap: new Map(),
                itemContextMap: new Map(),

                get updated() {
                    const { itemContextMap, pinnedItems } = accordionContext;

                    if (pinnedItems) {
                        const { uniqueIds, activeIds } = pinnedItems;

                        activeIds.length = 0;

                        for (const itemUniqueId of uniqueIds) {
                            const itemContext = itemContextMap.get(itemUniqueId);

                            if (itemContext && (itemContext.match?.is ?? true)) {
                                activeIds.push(itemUniqueId);
                            }
                        }
                    }

                    return accordionContext;
                },

                renderItems: (filter) => {
                    const { sectionContextMap, itemContextMap } = accordionContext;

                    for (const sectionContext of sectionContextMap.values()) {
                        if (filter?.sections?.includes(sectionContext.sectionId) ?? true) {
                            sectionContext.renderSection();
                        }
                    }

                    for (const itemContext of itemContextMap.values()) {
                        if (filter?.items?.includes(itemContext.itemUniqueId) ?? true) {
                            itemContext.renderItem();
                        }
                    }
                },

                storage: {
                    read: (path: string, initial: unknown) => {
                        return JSON.parse(DataStorage.ReadString(`${storageKeyRoot}/${path}`, '""')) || initial;
                    },

                    write: (path: string, data: unknown) => {
                        DataStorage.WriteString(`${storageKeyRoot}/${path}`, JSON.stringify(data));
                    },

                    writeData: (listName) => {
                        const { pinnedItems, hiddenItems, storage } = accordionContext;

                        storage.write(
                            `${listName}/${accordionId}`,
                            {
                                ["Pinned"]: pinnedItems?.uniqueIds,
                                ["Hidden"]: hiddenItems?.uniqueIds,
                            }[listName]
                        );
                    },
                },
            };

            if (enablePinnedItems) {
                accordionContext.pinnedItems = {
                    containerRef: createRef<HTMLDivElement>(),
                    uniqueIds: accordionContext.storage.read(`Pinned/${accordionId}`, []),
                    activeIds: [],
                };
            }

            if (enableHiddenItems) {
                accordionContext.hiddenItems = {
                    uniqueIds: accordionContext.storage.read(`Hidden/${accordionId}`, []),
                };
            }

            if (enableSearchItems) {
                accordionContext.searchItems = {
                    term: "",
                    setTerm: () => {},

                    includes: (text: string) => {
                        const term = accordionContext.searchItems?.term.toLocaleLowerCase();

                        return !text || !term || text.toLocaleLowerCase().includes(term);
                    },
                };
            }

            return accordionContext;
        }

        return;
    }, []);
};

/**
 * Context: `AccordionSectionBlock`.
 */
export type AccordionSectionBlockContext = {
    /** The ID of the `AccordionSectionBlock`, unique within the `Accordion` instance. */
    sectionId: string;
    /** Triggers a render cycle for the section. */
    renderSection: () => void;
    /** Gets the section empty state. */
    isEmpty: boolean;
};

export const AccordionSectionBlockContext = createContext<undefined | AccordionSectionBlockContext>(undefined);

/**
 * Hook: `AccordionSectionBlockContext`.
 *
 * @param props - `AccordionSectionBlockProps`
 * @returns `AccordionSectionBlockContext`, or `undefined` if all features are disabled.
 */
export const useAccordionSectionBlockContext = (props: AccordionSectionBlockProps) => {
    const { sectionId } = props;
    const accordionContext = useContext(AccordionContext);
    const [, setRenderCounter] = useReducer(($) => ++$, 0);

    return useMemo(() => {
        if (accordionContext) {
            const sectionContext: AccordionSectionBlockContext = {
                sectionId,
                renderSection: () => setTimeout(setRenderCounter),

                get isEmpty() {
                    if (accordionContext) {
                        const { itemContextMap, editMode } = accordionContext;

                        if (!editMode?.is) {
                            for (const { sectionId: itemSectionId, isDescendant, pinned, hidden, match } of itemContextMap.values()) {
                                if (!isDescendant) {
                                    const isPinned = pinned?.is ?? false;
                                    const isHidden = hidden?.is ?? false;
                                    const isMatch = match?.is ?? true;

                                    if (!isHidden && isMatch && ((isPinned && sectionId === "Pinned") || (!isPinned && itemSectionId === sectionId))) {
                                        return false;
                                    }
                                }
                            }

                            return true;
                        }
                    }

                    return false;
                },
            };

            accordionContext.sectionContextMap.set(sectionId, sectionContext);

            return sectionContext;
        }

        return;
    }, []);
};

/**
 * Context: `AccordionSectionItem`.
 * - Used to differentiate the first occurrence in the tree (the parent, where the context is `undefined`) from the others (the descendants),
 *   ensuring that only the parent is manageable.
 * - Stores the item ID to generate a globally unique identifier by combining it with the `Accordion` and `AccordionSectionBlock` IDs.
 * - Stores the item label to be used with the search filter.
 */
export type AccordionSectionItemContext = {
    /** The ID of the `AccordionSectionBlock`, unique within the `Accordion` instance. */
    sectionId: string;
    /** The unique global ID of the `AccordionSectionItem`. */
    itemUniqueId: string;
    /** The ID of the `AccordionSectionItem`, unique within the `AccordionSectionBlock` instance. */
    itemId: string;
    /** The searchable text label for the item. */
    itemLabel?: string;
    /** Triggers a render cycle for the item. */
    renderItem: () => void;
    /** Whether the item is a descendant of another `AccordionSectionItem`. */
    isDescendant: boolean;
    /** Whether the item is not interactable. */
    isStatic: boolean;
    /** Tracks the Ctrl mode of the item. */
    ctrlMode?: {
        is: boolean;
        set: (value: boolean) => void;
    };
    /** Tracks the pinned state of the item. */
    pinned?: ListedItem<string>;
    /** Tracks the hidden state of the item. */
    hidden?: ListedItem<string>;
    /** Tracks the match state of the item. */
    match?: {
        is: boolean;
    };
};

export const AccordionSectionItemContext = createContext<undefined | AccordionSectionItemContext>(undefined);

/**
 * Hook: `AccordionSectionItemContext`.
 *
 * @param props - `AccordionSectionItemProps`
 * @returns `AccordionSectionItemContext`, or `undefined` if all features are disabled.
 */
export const useAccordionSectionItemContext = (props: AccordionSectionItemProps) => {
    const { uniqueId: itemId, label: itemLabel, staticItem, onRender } = props;
    const accordionContext = useContext(AccordionContext);
    const sectionContext = useContext(AccordionSectionBlockContext);
    const sectionId = sectionContext?.sectionId ?? "";
    const isDescendant = !!useContext(AccordionSectionItemContext);
    const itemUniqueId = useMemo(() => `${accordionContext?.accordionId}\0${sectionId}\0${itemId}`, []);
    const [renderCounter, setRenderCounter] = useReducer(($) => ++$, 0);
    const [ctrlMode, setCtrlMode] = useState(false);

    const itemContext = useMemo(() => {
        if (accordionContext) {
            const { itemContextMap, pinnedItems, hiddenItems, searchItems } = accordionContext;

            const itemContext: AccordionSectionItemContext = {
                sectionId,
                itemUniqueId,
                itemId,
                itemLabel,
                renderItem: () => setTimeout(setRenderCounter),
                isDescendant: isDescendant,
                isStatic: staticItem ?? false,
            };

            if (!isDescendant) {
                if (pinnedItems) {
                    itemContext.pinned = new ListedItem(pinnedItems.uniqueIds, itemUniqueId);
                }

                if (hiddenItems) {
                    itemContext.hidden = new ListedItem(hiddenItems.uniqueIds, itemUniqueId);
                }

                if (searchItems) {
                    itemContext.match = {
                        get is() {
                            return searchItems.includes(itemLabel ?? itemId);
                        },
                    };
                }
            }

            itemContextMap.set(itemUniqueId, itemContext);

            return itemContext;
        }

        return;
    }, []);

    useEffect(() => {
        if (accordionContext && itemContext && !isDescendant) {
            const { itemContextMap, renderItems } = accordionContext;
            const { sectionId, pinned } = itemContext;
            const filter = { sections: [pinned?.is ? "Pinned" : sectionId], items: [] };

            DEBUG_MESSAGE(() => {
                const currentItemContext = itemContextMap.get(itemUniqueId);

                if (currentItemContext && currentItemContext !== itemContext) {
                    return (
                        `Accordion: Duplicate uniqueId "${itemId}" in section "${sectionId}". ` +
                        `Each item must have a unique, stable ID for pin/hide persistence to work correctly.`
                    );
                }

                return;
            });

            itemContextMap.set(itemUniqueId, itemContext);
            renderItems(filter);

            return () => {
                itemContextMap.delete(itemUniqueId);
                renderItems(filter);
            };
        }

        return;
    }, []);

    useMemo(() => {
        if (accordionContext) {
            const { pinnedItems, hiddenItems } = accordionContext;

            if (itemContext && (pinnedItems || hiddenItems)) {
                itemContext.ctrlMode = {
                    is: ctrlMode,
                    set: setCtrlMode,
                };
            }
        }
    }, [ctrlMode]);

    useEffect(() => {
        if (accordionContext) {
            onRender?.();
        }
    }, [renderCounter]);

    DEBUG_MESSAGE(() => {
        if (itemContext && itemId !== itemContext.itemId) {
            return (
                `Accordion: The uniqueId "${itemId}" in section "${sectionId}" has changed. ` +
                `Each item must have a unique, stable ID for pin/hide persistence to work correctly.`
            );
        }

        return;
    });

    return itemContext;
};
