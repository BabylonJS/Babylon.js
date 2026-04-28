/**
 * Physical input source that generated an interaction.
 */
export type InputSource = "pointer" | "wheel" | "touch" | "keyboard";

/**
 * Modifier key state, shared across input sources that support modifiers.
 */
export type InputModifiers = {
    /** Ctrl key pressed */
    ctrl?: boolean;
    /** Shift key pressed */
    shift?: boolean;
    /** Alt key pressed */
    alt?: boolean;
};

// ── Per-source condition shapes ────────────────────────────────────

/**
 * Conditions for pointer inputs.
 */
export type PointerConditions = {
    /** Mouse button (0=left, 1=middle, 2=right). Omit to match any button. */
    button?: number;
    /** Modifier key state. Only specified keys are checked; omitted = don't-care. */
    modifiers?: InputModifiers;
};

/**
 * Conditions for mouse wheel inputs.
 */
export type WheelConditions = {
    /** Modifier key state. Only specified keys are checked; omitted = don't-care. */
    modifiers?: InputModifiers;
};

/**
 * Conditions for touch inputs.
 */
export type TouchConditions = {
    /** Number of active touch points. Omit to match any count. */
    touchCount?: number;
};

/**
 * Conditions for keyboard inputs.
 */
export type KeyboardConditions = {
    /** Key code of the current key being resolved. Omit to match any key. */
    key?: number;
    /** Modifier key state. Only specified keys are checked; omitted = don't-care. */
    modifiers?: InputModifiers;
};

// ── Per-source inputMap entry types ────────────────────────────────

/**
 * Mapping rule for pointer (mouse button) inputs.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type PointerInputMapEntry<TInteraction extends string = string> = {
    source: "pointer";
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
    /** Optional per-axis override for the X (horizontal / yaw) component. Falls back to `sensitivity` if unset. */
    sensitivityX?: number;
    /** Optional per-axis override for the Y (vertical / pitch) component. Falls back to `sensitivity` if unset. */
    sensitivityY?: number;
} & PointerConditions;

/**
 * Mapping rule for mouse wheel inputs.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type WheelInputMapEntry<TInteraction extends string = string> = {
    source: "wheel";
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
} & WheelConditions;

/**
 * Mapping rule for touch inputs.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type TouchInputMapEntry<TInteraction extends string = string> = {
    source: "touch";
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
    /** Optional per-axis override for the X component. Falls back to `sensitivity` if unset. */
    sensitivityX?: number;
    /** Optional per-axis override for the Y component. Falls back to `sensitivity` if unset. */
    sensitivityY?: number;
} & TouchConditions;

/**
 * Mapping rule for keyboard inputs.
 * The `key` field on the entry supports a single key code or an array of key codes for matching.
 * When resolving, the condition's `key` is checked against the entry's `key` value(s).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type KeyboardInputMapEntry<TInteraction extends string = string> = {
    /** Discriminator: keyboard input source */
    source: "keyboard";
    /** Interaction type to dispatch when this entry matches */
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
    /** Key code filter(s). Supports a single code or an array. Omit to match any key. */
    key?: number | number[];
    /** Modifier keys that must be active for this entry to match. Omit to match regardless of modifiers. */
    modifiers?: InputModifiers;
};

/**
 * A single mapping rule: source + optional conditions → interaction type.
 * The inputMap is an ordered array on the movement class; first matching entry wins.
 * The interaction string should match a handler property name on the camera's movement subclass.
 *
 * Discriminated union by `source` — only fields relevant to that source are available.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type InputMapEntry<TInteraction extends string = string> =
    | PointerInputMapEntry<TInteraction>
    | WheelInputMapEntry<TInteraction>
    | TouchInputMapEntry<TInteraction>
    | KeyboardInputMapEntry<TInteraction>;

/**
 * Flat conditions object passed to resolveInteraction().
 * Only the fields relevant to the source type need to be set.
 * Per-source condition types (PointerConditions, KeyboardConditions, etc.) are subtypes
 * of this and should be used at call sites for clarity.
 */
export type InputConditions = {
    /** Mouse button (0=left, 1=middle, 2=right) */
    button?: number;
    /** Current modifier key state */
    modifiers?: InputModifiers;
    /** Number of active touch points */
    touchCount?: number;
    /** Key code of the current key being resolved */
    key?: number;
};

/**
 * Extracts the string-typed interaction names from a handlers object type.
 * Equivalent to `keyof THandlers & string` — filters out symbol/number keys.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type InteractionName<THandlers> = keyof THandlers & string;

/**
 * Generic input-to-interaction mapper that resolves physical input events to semantic interaction types
 * and dispatches them to typed handlers.
 *
 * `InputMapper` is not tied to cameras — any object that needs a configurable, prioritized
 * mapping from physical inputs (pointer, keyboard, wheel, touch) to named interactions can use it.
 *
 * The mapper holds an ordered `inputMap` array. When `resolveInteraction` is called, the first
 * entry whose source and conditions match the current input wins. More specific entries (with more
 * conditions like button, key, modifiers) should be placed before less specific ones; use `addEntry`
 * to auto-insert based on specificity.
 *
 * @typeParam THandlers - Object type whose keys are the valid interaction type strings and values
 *   are the handler functions/objects for each interaction (e.g. `ArcRotateHandlers`).
 *   Interaction types are derived as `InteractionName<THandlers>`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class InputMapper<THandlers extends Record<string, unknown>> {
    /**
     * Ordered list of input-to-interaction mapping rules. First matching entry wins.
     */
    public inputMap: InputMapEntry<InteractionName<THandlers>>[] = [];

    /**
     * Interaction handlers keyed by interaction type.
     * Override individual handlers to customize behavior without changing input mapping.
     */
    public handlers: THandlers;

    /**
     * Creates a new InputMapper.
     * @param handlers - The interaction handlers, keyed by interaction type.
     * @param createDefaultEntries - Optional factory that returns the default inputMap entries.
     *   Called by `resetInputMap()` and during construction. When omitted, the default map is empty.
     */
    constructor(handlers: THandlers, createDefaultEntries?: () => InputMapEntry<InteractionName<THandlers>>[]) {
        this.handlers = handlers;
        this._createDefaultEntries = createDefaultEntries;
        this.resetInputMap();
    }

    private _createDefaultEntries?: () => InputMapEntry<InteractionName<THandlers>>[];

    /**
     * Resolves a physical input event to a matching inputMap entry.
     * Iterates the inputMap in order; the first entry whose source and conditions match wins.
     * @param source - The physical input source (e.g. "pointer", "keyboard")
     * @param currentConditions - Conditions to match against, specific to the source type
     * @returns The matched InputMapEntry, or null if no entry matches
     */
    public resolveInteraction(source: "pointer", currentConditions?: InputConditions): PointerInputMapEntry<InteractionName<THandlers>> | null;
    public resolveInteraction(source: "wheel", currentConditions?: InputConditions): WheelInputMapEntry<InteractionName<THandlers>> | null;
    public resolveInteraction(source: "touch", currentConditions?: InputConditions): TouchInputMapEntry<InteractionName<THandlers>> | null;
    public resolveInteraction(source: "keyboard", currentConditions?: InputConditions): KeyboardInputMapEntry<InteractionName<THandlers>> | null;
    public resolveInteraction(source: InputSource, currentConditions?: InputConditions): InputMapEntry<InteractionName<THandlers>> | null;
    public resolveInteraction(source: InputSource, currentConditions?: InputConditions): InputMapEntry<InteractionName<THandlers>> | null {
        for (const entry of this.inputMap) {
            if (entry.source === source && this._entryMatches(entry, currentConditions)) {
                return entry;
            }
        }
        return null;
    }

    /**
     * Restores the inputMap to the default entries provided at construction time.
     * If no factory was provided, resets to an empty array.
     */
    public resetInputMap(): void {
        this.inputMap = this._createDefaultEntries?.() ?? [];
    }

    /**
     * Finds the first inputMap entry matching the given source and interaction.
     * Useful for modifying entry properties (e.g. sensitivity) without rebuilding the entire inputMap.
     * @param source - The physical input source to match
     * @param interaction - The interaction type to match
     * @returns The matching entry, or undefined if not found
     */
    public getEntry(source: "pointer", interaction: InteractionName<THandlers>): PointerInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: "wheel", interaction: InteractionName<THandlers>): WheelInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: "touch", interaction: InteractionName<THandlers>): TouchInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: "keyboard", interaction: InteractionName<THandlers>): KeyboardInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: InputSource, interaction: InteractionName<THandlers>): InputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: InputSource, interaction: InteractionName<THandlers>): InputMapEntry<InteractionName<THandlers>> | undefined {
        return this.inputMap.find((e) => e.source === source && e.interaction === interaction);
    }

    /**
     * Adds an entry to the inputMap at the correct position based on specificity.
     * More specific entries (with more conditions like button, key, modifiers) are placed
     * before less specific ones, ensuring they match first. Among equally specific entries,
     * the new entry is placed after existing ones.
     * @param entry - The entry to add
     */
    public addEntry(entry: InputMapEntry<InteractionName<THandlers>>): void {
        const score = this._entrySpecificity(entry);
        let insertIndex = this.inputMap.length;
        for (let i = 0; i < this.inputMap.length; i++) {
            if (this._entrySpecificity(this.inputMap[i]) < score) {
                insertIndex = i;
                break;
            }
        }
        this.inputMap.splice(insertIndex, 0, entry);
    }

    private _entryMatches(entry: InputMapEntry<InteractionName<THandlers>>, currentConditions?: InputConditions): boolean {
        switch (entry.source) {
            case "pointer":
                if (entry.button !== undefined && entry.button !== currentConditions?.button) {
                    return false;
                }
                return this._matchModifiers(entry.modifiers, currentConditions?.modifiers);
            case "wheel":
                return this._matchModifiers(entry.modifiers, currentConditions?.modifiers);
            case "touch":
                if (entry.touchCount !== undefined && entry.touchCount !== currentConditions?.touchCount) {
                    return false;
                }
                return true;
            case "keyboard":
                if (entry.key !== undefined) {
                    if (Array.isArray(entry.key) ? entry.key.indexOf(currentConditions?.key ?? -1) === -1 : entry.key !== currentConditions?.key) {
                        return false;
                    }
                }
                return this._matchModifiers(entry.modifiers, currentConditions?.modifiers);
        }
    }

    private _entrySpecificity(entry: InputMapEntry<InteractionName<THandlers>>): number {
        let score = 0;
        if ("button" in entry && entry.button !== undefined) {
            score++;
        }
        if ("key" in entry && entry.key !== undefined) {
            score++;
        }
        if ("touchCount" in entry && entry.touchCount !== undefined) {
            score++;
        }
        if ("modifiers" in entry && entry.modifiers) {
            score++;
        }
        return score;
    }

    private _matchModifiers(entryModifiers?: InputModifiers, currentModifiers?: InputModifiers): boolean {
        if (!entryModifiers) {
            return true;
        }
        if (entryModifiers.ctrl !== undefined && entryModifiers.ctrl !== (currentModifiers?.ctrl ?? false)) {
            return false;
        }
        if (entryModifiers.shift !== undefined && entryModifiers.shift !== (currentModifiers?.shift ?? false)) {
            return false;
        }
        if (entryModifiers.alt !== undefined && entryModifiers.alt !== (currentModifiers?.alt ?? false)) {
            return false;
        }
        return true;
    }
}
