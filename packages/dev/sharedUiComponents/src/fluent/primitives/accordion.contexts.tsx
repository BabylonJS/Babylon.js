import type { RefObject } from "react";
import type { AccordionProps, AccordionSectionBlockProps, AccordionSectionItemProps } from "./accordion";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { DataStorage } from "core/Misc/dataStorage";
import { Logger } from "core/Misc/logger";

// ============================================================================
// Storage Helpers
// ============================================================================

const STORAGE_KEY_ROOT = "Babylon/Accordion";

const ReadFromStorage = <T,>(path: string, initial: T): T => {
    try {
        const stored = DataStorage.ReadString(`${STORAGE_KEY_ROOT}/${path}`, "");
        return stored ? JSON.parse(stored) : initial;
    } catch {
        return initial;
    }
};

const WriteToStorage = (path: string, data: unknown): void => {
    DataStorage.WriteString(`${STORAGE_KEY_ROOT}/${path}`, JSON.stringify(data));
};

// ============================================================================
// State Types
// ============================================================================

/**
 * Immutable state for the Accordion.
 */
export type AccordionState = {
    /** IDs of pinned items (persisted to localStorage). */
    pinnedIds: string[];
    /** IDs of hidden items (persisted to localStorage). */
    hiddenIds: string[];
    /** Current search/filter term. */
    searchTerm: string;
    /** Whether edit mode is active (shows pin/hide controls). */
    editMode: boolean;
};

/**
 * Actions that can be dispatched to update accordion state.
 */
export type AccordionAction =
    | { type: "SET_SEARCH_TERM"; term: string }
    | { type: "SET_EDIT_MODE"; enabled: boolean }
    | { type: "TOGGLE_PINNED"; itemId: string }
    | { type: "TOGGLE_HIDDEN"; itemId: string }
    | { type: "MOVE_PINNED_UP"; itemId: string }
    | { type: "REMOVE_STALE_IDS"; activeIds: Set<string> }
    | { type: "SHOW_ALL" }
    | { type: "HIDE_ALL_VISIBLE"; visibleItemIds: string[] };

/**
 * Feature flags for the Accordion (immutable after initialization).
 */
export type AccordionFeatures = {
    /** Whether pinning is enabled. */
    pinning: boolean;
    /** Whether hiding is enabled. */
    hiding: boolean;
    /** Whether search is enabled. */
    search: boolean;
};

// ============================================================================
// Reducer
// ============================================================================

const AccordionReducer = (state: AccordionState, action: AccordionAction): AccordionState => {
    switch (action.type) {
        case "SET_SEARCH_TERM":
            return { ...state, searchTerm: action.term };

        case "SET_EDIT_MODE":
            return { ...state, editMode: action.enabled };

        case "TOGGLE_PINNED": {
            const isPinned = state.pinnedIds.includes(action.itemId);
            return {
                ...state,
                pinnedIds: isPinned ? state.pinnedIds.filter((id) => id !== action.itemId) : [...state.pinnedIds, action.itemId],
            };
        }

        case "TOGGLE_HIDDEN": {
            const isHidden = state.hiddenIds.includes(action.itemId);
            return {
                ...state,
                hiddenIds: isHidden ? state.hiddenIds.filter((id) => id !== action.itemId) : [...state.hiddenIds, action.itemId],
            };
        }

        case "MOVE_PINNED_UP": {
            const index = state.pinnedIds.indexOf(action.itemId);
            if (index <= 0) {
                return state;
            }
            const newPinnedIds = [...state.pinnedIds];
            [newPinnedIds[index - 1], newPinnedIds[index]] = [newPinnedIds[index], newPinnedIds[index - 1]];
            return { ...state, pinnedIds: newPinnedIds };
        }

        case "REMOVE_STALE_IDS": {
            const pinnedIds = state.pinnedIds.filter((id) => action.activeIds.has(id));
            const hiddenIds = state.hiddenIds.filter((id) => action.activeIds.has(id));
            if (pinnedIds.length === state.pinnedIds.length && hiddenIds.length === state.hiddenIds.length) {
                return state;
            }
            return { ...state, pinnedIds, hiddenIds };
        }

        case "SHOW_ALL":
            return { ...state, hiddenIds: [] };

        case "HIDE_ALL_VISIBLE":
            return {
                ...state,
                hiddenIds: [...new Set([...state.hiddenIds, ...action.visibleItemIds])],
            };

        default:
            return state;
    }
};

// ============================================================================
// Accordion Context
// ============================================================================

/**
 * Context value for the Accordion component.
 */
export type AccordionContextValue = {
    /** The unique ID of the Accordion instance. */
    accordionId: string;
    /** State for the Accordion, managed via dispatch function. */
    state: AccordionState;
    /** Dispatch function to update state. */
    dispatch: React.Dispatch<AccordionAction>;
    /** Feature flags. */
    features: AccordionFeatures;
    /** Ref for the pinned items portal container. */
    pinnedContainerRef: RefObject<HTMLDivElement>;
    /** Map of registered item IDs to labels (for duplicate detection and section empty checks). */
    registeredItemIds: Map<string, string>;
};

export const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

/**
 * Hook to create and manage the AccordionContext value.
 *
 * @param props - AccordionProps
 * @returns AccordionContextValue, or undefined if no features are enabled or no uniqueId is provided.
 */
export function useAccordionContext(props: AccordionProps): AccordionContextValue | undefined {
    const { uniqueId: accordionId, enablePinnedItems, enableHiddenItems, enableSearchItems } = props;

    const features: AccordionFeatures = useMemo(
        () => ({
            pinning: enablePinnedItems ?? false,
            hiding: enableHiddenItems ?? false,
            search: enableSearchItems ?? false,
        }),
        [enablePinnedItems, enableHiddenItems, enableSearchItems]
    );

    const hasFeatures = features.pinning || features.hiding || features.search;

    // Initialize state from localStorage
    const initialState = useMemo((): AccordionState => {
        if (!accordionId || !hasFeatures) {
            return { pinnedIds: [], hiddenIds: [], searchTerm: "", editMode: false };
        }
        return {
            pinnedIds: features.pinning ? ReadFromStorage<string[]>(`Pinned/${accordionId}`, []) : [],
            hiddenIds: features.hiding ? ReadFromStorage<string[]>(`Hidden/${accordionId}`, []) : [],
            searchTerm: "",
            editMode: false,
        };
    }, [accordionId, hasFeatures, features.pinning, features.hiding]);

    const [state, dispatch] = useReducer(AccordionReducer, initialState);

    const pinnedContainerRef = useRef<HTMLDivElement>(null);
    const registeredItemIds = useRef<Map<string, string>>(new Map());

    // Persist pinnedIds to localStorage when they change
    useEffect(() => {
        if (accordionId && features.pinning) {
            WriteToStorage(`Pinned/${accordionId}`, state.pinnedIds);
        }
    }, [accordionId, features.pinning, state.pinnedIds]);

    // Persist hiddenIds to localStorage when they change
    useEffect(() => {
        if (accordionId && features.hiding) {
            WriteToStorage(`Hidden/${accordionId}`, state.hiddenIds);
        }
    }, [accordionId, features.hiding, state.hiddenIds]);

    // Clean stale IDs from localStorage on mount. Parent effects run after
    // children's, so all items will have registered by the time this fires.
    useEffect(() => {
        if (accordionId && hasFeatures) {
            dispatch({ type: "REMOVE_STALE_IDS", activeIds: new Set(registeredItemIds.current.keys()) });
        }
    }, [accordionId, hasFeatures]);

    // Return undefined if no accordionId or no features enabled
    if (!accordionId || !hasFeatures) {
        return undefined;
    }

    return {
        accordionId,
        state,
        dispatch,
        features,
        pinnedContainerRef,
        registeredItemIds: registeredItemIds.current,
    };
}

// ============================================================================
// Section Context
// ============================================================================

/**
 * Context value for an AccordionSectionBlock.
 */
export type AccordionSectionBlockContextValue = {
    /** The section ID. */
    sectionId: string;
};

export const AccordionSectionBlockContext = createContext<AccordionSectionBlockContextValue | undefined>(undefined);

/**
 * Hook to create the AccordionSectionBlockContext value.
 *
 * @param props - AccordionSectionBlockProps
 * @returns AccordionSectionBlockContextValue and isEmpty state
 */
export function useAccordionSectionBlockContext(props: AccordionSectionBlockProps): {
    context: AccordionSectionBlockContextValue;
    isEmpty: boolean;
} {
    const { sectionId } = props;
    const context = useMemo(() => ({ sectionId }), [sectionId]);
    const isEmpty = useIsSectionEmpty(sectionId);

    return { context, isEmpty };
}

// ============================================================================
// Item Depth Context (to detect nested AccordionSectionItems)
// ============================================================================

/**
 * Context to track whether we're inside an AccordionSectionItem.
 * Used to prevent nested items from being individually manageable.
 */
export const AccordionItemDepthContext = createContext<boolean>(false);

// ============================================================================
// Item Context Hook
// ============================================================================

/**
 * Derived item state, computed from the accordion state during render.
 */
export type AccordionItemState = {
    /** The globally unique item ID. */
    itemUniqueId: string;
    /** Whether this item is nested inside another AccordionSectionItem. */
    isNested: boolean;
    /** Whether this item is pinned. */
    isPinned: boolean;
    /** Whether this item is hidden. */
    isHidden: boolean;
    /** Whether this item matches the current search term. */
    isMatch: boolean;
    /** The index of this item in the pinned list (for ordering). */
    pinnedIndex: number;
    /** Whether this pinned item can be moved up (is not first in the pinned list). */
    canMoveUp: boolean;
    /** Whether edit mode is active. */
    inEditMode: boolean;
    /** Callbacks to modify state. */
    actions: {
        togglePinned: () => void;
        toggleHidden: () => void;
        movePinnedUp: () => void;
    };
};

/**
 * Hook to compute item state from accordion context.
 *
 * @param props - AccordionSectionItemProps
 * @returns AccordionItemState, or undefined if no accordion context or nested item.
 */
export function useAccordionSectionItemState(props: AccordionSectionItemProps): AccordionItemState | undefined {
    const { uniqueId: itemId, label: itemLabel, staticItem } = props;

    const accordionCtx = useContext(AccordionContext);
    const sectionCtx = useContext(AccordionSectionBlockContext);
    const isNested = useContext(AccordionItemDepthContext);

    // Build the globally unique item ID
    const itemUniqueId = useMemo(() => {
        if (!accordionCtx || !sectionCtx) {
            return "";
        }
        return `${accordionCtx.accordionId}/${sectionCtx.sectionId}/${itemId}`;
    }, [accordionCtx?.accordionId, sectionCtx?.sectionId, itemId]);

    // Debug: warn if itemId changes (should be stable)
    const prevItemIdRef = useRef(itemId);
    useEffect(() => {
        if (prevItemIdRef.current !== itemId) {
            Logger.Warn(
                `Accordion: The uniqueId "${itemId}" in section "${sectionCtx?.sectionId}" has changed from "${prevItemIdRef.current}". ` +
                    `Each item must have a unique, stable ID for pin/hide persistence to work correctly.`
            );
        }
        prevItemIdRef.current = itemId;
    }, [itemId, sectionCtx?.sectionId]);

    // Register item and detect duplicates
    useEffect(() => {
        if (!accordionCtx || !itemUniqueId) {
            return;
        }
        const { registeredItemIds } = accordionCtx;
        if (registeredItemIds.has(itemUniqueId)) {
            Logger.Warn(
                `Accordion: Duplicate uniqueId "${itemId}" detected in section "${sectionCtx?.sectionId}". ` +
                    `Each item must have a unique ID within its section for pin/hide persistence to work correctly.`
            );
        }
        registeredItemIds.set(itemUniqueId, itemLabel ?? itemId);
        return () => {
            registeredItemIds.delete(itemUniqueId);
        };
    }, [accordionCtx, itemUniqueId, itemId, itemLabel, sectionCtx?.sectionId]);

    // If no context, static item, or nested, return undefined
    if (!accordionCtx || staticItem) {
        return undefined;
    }

    const { state, dispatch, features } = accordionCtx;
    const { pinnedIds, hiddenIds, searchTerm, editMode } = state;

    // Compute derived state
    const isPinned = features.pinning && pinnedIds.includes(itemUniqueId);
    const isHidden = features.hiding && hiddenIds.includes(itemUniqueId);
    const pinnedIndex = isPinned ? pinnedIds.indexOf(itemUniqueId) : -1;

    const canMoveUp = isPinned && pinnedIndex > 0;

    // Search matching
    const searchText = (itemLabel ?? itemId).toLowerCase();
    const isMatch = !features.search || !searchTerm || searchText.includes(searchTerm.toLowerCase());

    return {
        itemUniqueId,
        isNested,
        isPinned,
        isHidden,
        isMatch,
        pinnedIndex,
        canMoveUp,
        inEditMode: editMode,
        actions: {
            togglePinned: () => dispatch({ type: "TOGGLE_PINNED", itemId: itemUniqueId }),
            toggleHidden: () => dispatch({ type: "TOGGLE_HIDDEN", itemId: itemUniqueId }),
            movePinnedUp: () => dispatch({ type: "MOVE_PINNED_UP", itemId: itemUniqueId }),
        },
    };
}
/**
 * Hook to determine if a section is empty (has no visible items).
 * Derived from accordion state + globally registered items filtered by section prefix.
 *
 * @param sectionId - The section ID to check.
 * @returns Whether the section has no visible items.
 */
function useIsSectionEmpty(sectionId: string): boolean {
    const accordionCtx = useContext(AccordionContext);

    if (!accordionCtx) {
        return false;
    }

    const { state, features, accordionId, registeredItemIds } = accordionCtx;
    const { pinnedIds, hiddenIds, searchTerm, editMode } = state;

    if (editMode) {
        return false;
    }

    const sectionPrefix = `${accordionId}/${sectionId}/`;
    let hasItems = false;

    for (const [itemId, itemLabel] of registeredItemIds) {
        if (!itemId.startsWith(sectionPrefix)) {
            continue;
        }
        hasItems = true;
        const isPinned = features.pinning && pinnedIds.includes(itemId);
        const isHidden = features.hiding && hiddenIds.includes(itemId);
        const searchText = (itemLabel || itemId).toLowerCase();
        const isMatch = !features.search || !searchTerm || searchText.includes(searchTerm.toLowerCase());
        if (!isPinned && !isHidden && isMatch) {
            return false;
        }
    }

    return hasItems;
}
