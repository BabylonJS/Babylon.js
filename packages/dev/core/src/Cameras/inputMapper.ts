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
    public readonly handlers: THandlers;

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
     * Finds the first inputMap entry matching the given source, interaction, and optional entry conditions.
     * Useful for modifying entry properties (e.g. sensitivity) without rebuilding the entire inputMap.
     * @param source - The physical input source to match
     * @param interaction - The interaction type to match
     * @param conditions - Optional entry conditions to match. Omitted condition fields are ignored.
     * @returns The matching entry, or undefined if not found
     */
    public getEntry(source: "pointer", interaction: InteractionName<THandlers>, conditions?: PointerConditions): PointerInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: "wheel", interaction: InteractionName<THandlers>, conditions?: WheelConditions): WheelInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: "touch", interaction: InteractionName<THandlers>, conditions?: TouchConditions): TouchInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: "keyboard", interaction: InteractionName<THandlers>, conditions?: KeyboardConditions): KeyboardInputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: InputSource, interaction: InteractionName<THandlers>, conditions?: InputConditions): InputMapEntry<InteractionName<THandlers>> | undefined;
    public getEntry(source: InputSource, interaction: InteractionName<THandlers>, conditions?: InputConditions): InputMapEntry<InteractionName<THandlers>> | undefined {
        // Manual loop instead of `inputMap.find(arrow)` to avoid per-call closure allocation;
        // this is hit per pointer-move from multi-touch panning paths.
        const arr = this.inputMap;
        for (let i = 0; i < arr.length; i++) {
            const e = arr[i];
            if (e.source === source && e.interaction === interaction && this._entryConditionsMatch(e, conditions)) {
                return e;
            }
        }
        return undefined;
    }

    /**
     * Finds all inputMap entries matching the given source, interaction, and optional entry conditions.
     * Useful for bulk updates when more than one physical input maps to the same interaction.
     * @param source - The physical input source to match
     * @param interaction - The interaction type to match
     * @param conditions - Optional entry conditions to match. Omitted condition fields are ignored.
     * @returns All matching entries, in inputMap order
     */
    public getEntries(source: "pointer", interaction: InteractionName<THandlers>, conditions?: PointerConditions): PointerInputMapEntry<InteractionName<THandlers>>[];
    public getEntries(source: "wheel", interaction: InteractionName<THandlers>, conditions?: WheelConditions): WheelInputMapEntry<InteractionName<THandlers>>[];
    public getEntries(source: "touch", interaction: InteractionName<THandlers>, conditions?: TouchConditions): TouchInputMapEntry<InteractionName<THandlers>>[];
    public getEntries(source: "keyboard", interaction: InteractionName<THandlers>, conditions?: KeyboardConditions): KeyboardInputMapEntry<InteractionName<THandlers>>[];
    public getEntries(source: InputSource, interaction: InteractionName<THandlers>, conditions?: InputConditions): InputMapEntry<InteractionName<THandlers>>[];
    public getEntries(source: InputSource, interaction: InteractionName<THandlers>, conditions?: InputConditions): InputMapEntry<InteractionName<THandlers>>[] {
        const matches: InputMapEntry<InteractionName<THandlers>>[] = [];
        const arr = this.inputMap;
        for (let i = 0; i < arr.length; i++) {
            const e = arr[i];
            if (e.source === source && e.interaction === interaction && this._entryConditionsMatch(e, conditions)) {
                matches.push(e);
            }
        }
        return matches;
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

    /**
     * Sets the interaction for the input combination described by `conditions`. Smart enough to
     * either mutate an existing entry in place or insert a new entry, depending on whether
     * the matched entry is as specific as the request:
     *
     * - If a matching entry already exists and constrains every field present in `conditions`
     *   (i.e. it is at least as specific as the request), its `interaction` is updated in place.
     * - If a matching entry exists but is *broader* than the request — for example, the
     *   conditions specify `{ button: 0, modifiers: { ctrl: true } }` and the only match is
     *   the catch-all `{ button: 0 }` — a new, more-specific entry is inserted via
     *   {@link addEntry} so the new mapping wins for the requested combination without
     *   clobbering the broader entry. This avoids the footgun where `setInteraction` would
     *   silently mutate the catch-all and break unrelated gestures.
     * - If no entry matches at all, a new entry is inserted via {@link addEntry}.
     *
     * Note: only the first matching entry is considered. To force an update on every matching
     * entry use {@link setInteractions}; to address an individual entry beyond the first, look
     * it up via {@link getEntries} and assign `entry.interaction` directly.
     * @param source - The physical input source to match
     * @param conditions - Conditions describing the input combination (button, modifiers, key, etc.)
     * @param interaction - The interaction to assign / insert
     * @returns true (the mapping is always made effective; the boolean is preserved for source
     *   compatibility with the previous "found and updated" semantics)
     */
    public setInteraction(source: InputSource, conditions: InputConditions | undefined, interaction: InteractionName<THandlers>): boolean {
        const entry = this.resolveInteraction(source, conditions);
        if (entry && this._entryConstrainsAllOf(entry, conditions)) {
            entry.interaction = interaction;
            return true;
        }
        // No matching entry, or matched entry is broader than the request — add a new
        // more-specific entry so the requested conditions resolve to the new interaction
        // without clobbering the broader entry.
        this.addEntry({ source, ...(conditions ?? {}), interaction } as InputMapEntry<InteractionName<THandlers>>);
        return true;
    }

    /**
     * Returns true when `entry` constrains at least every field that `conditions` specifies,
     * i.e. `entry` is at least as specific as the request. Used by {@link setInteraction} to
     * decide whether to mutate an existing entry or add a more-specific one.
     *
     * `InputConditions` is a flat type covering all source-specific fields (`button`, `key`,
     * `touchCount`, `modifiers`); for any given source the irrelevant fields are `undefined`
     * on both `entry` and `conditions`, so checking them all is harmless.
     * @param entry - The matched inputMap entry to test
     * @param conditions - The conditions the caller supplied to `setInteraction`
     * @returns true if `entry` constrains every field present in `conditions`
     */
    private _entryConstrainsAllOf(entry: InputMapEntry<InteractionName<THandlers>>, conditions?: InputConditions): boolean {
        if (!conditions) {
            return true;
        }
        // `as any` here because `entry` is a discriminated union and TypeScript can't narrow it
        // from a string-keyed loop. The runtime check is harmless: irrelevant-for-this-source
        // fields are undefined on both entry and conditions and skip the early return.
        const e = entry as any;
        for (const field of ["button", "key", "touchCount"] as const) {
            if (conditions[field] !== undefined && e[field] === undefined) {
                return false;
            }
        }
        if (conditions.modifiers) {
            const entryMods = e.modifiers ?? {};
            for (const key of Object.keys(conditions.modifiers) as (keyof InputModifiers)[]) {
                if (conditions.modifiers[key] !== undefined && entryMods[key] === undefined) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Changes the interaction for every inputMap entry matching the given source and conditions.
     * Useful when more than one entry maps to the same physical input (e.g. duplicate bindings,
     * or several keys aliased to the same action) and all of them should be remapped together.
     * @param source - The physical input source to match
     * @param conditions - Conditions to match (button, modifiers, key, etc.). Uses the same
     *                     event-resolution semantics as {@link resolveInteraction}: omitted entry
     *                     condition fields are treated as wildcards and will match.
     * @param interaction - The new interaction to assign to every matched entry
     * @returns The number of entries that were updated
     */
    public setInteractions(source: InputSource, conditions: InputConditions | undefined, interaction: InteractionName<THandlers>): number {
        let count = 0;
        const arr = this.inputMap;
        for (let i = 0; i < arr.length; i++) {
            const entry = arr[i];
            if (entry.source === source && this._entryMatches(entry, conditions)) {
                entry.interaction = interaction;
                count++;
            }
        }
        return count;
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

    private _entryConditionsMatch(entry: InputMapEntry<InteractionName<THandlers>>, conditions?: InputConditions): boolean {
        if (!conditions) {
            return true;
        }

        // NOTE: Uses the `"key" in conditions` form rather than `conditions.key !== undefined`
        // so that callers can explicitly target entries with no constraint via
        // `getEntries({ button: undefined })` — i.e. "find catch-all entries that don't
        // require a specific button". `!== undefined` would silently ignore a deliberate
        // `undefined` and behave like the property was omitted, which would be wrong here.
        switch (entry.source) {
            case "pointer":
                if ("button" in conditions && entry.button !== conditions.button) {
                    return false;
                }
                return !("modifiers" in conditions) || this._entryModifiersMatch(entry.modifiers, conditions.modifiers);
            case "wheel":
                return !("modifiers" in conditions) || this._entryModifiersMatch(entry.modifiers, conditions.modifiers);
            case "touch":
                return !("touchCount" in conditions) || entry.touchCount === conditions.touchCount;
            case "keyboard":
                if ("key" in conditions) {
                    if (entry.key === undefined) {
                        return conditions.key === undefined;
                    }
                    if (conditions.key === undefined || (Array.isArray(entry.key) ? entry.key.indexOf(conditions.key) === -1 : entry.key !== conditions.key)) {
                        return false;
                    }
                }
                return !("modifiers" in conditions) || this._entryModifiersMatch(entry.modifiers, conditions.modifiers);
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

    private _entryModifiersMatch(entryModifiers?: InputModifiers, conditionsModifiers?: InputModifiers): boolean {
        if (!conditionsModifiers) {
            return !entryModifiers;
        }

        const hasModifierConditions = conditionsModifiers.ctrl !== undefined || conditionsModifiers.shift !== undefined || conditionsModifiers.alt !== undefined;
        if (!hasModifierConditions) {
            return !entryModifiers || (entryModifiers.ctrl === undefined && entryModifiers.shift === undefined && entryModifiers.alt === undefined);
        }

        if (conditionsModifiers.ctrl !== undefined && entryModifiers?.ctrl !== conditionsModifiers.ctrl) {
            return false;
        }
        if (conditionsModifiers.shift !== undefined && entryModifiers?.shift !== conditionsModifiers.shift) {
            return false;
        }
        if (conditionsModifiers.alt !== undefined && entryModifiers?.alt !== conditionsModifiers.alt) {
            return false;
        }
        return true;
    }
}
