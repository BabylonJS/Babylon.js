/**
 * Physical input source that generated an interaction.
 */
export type InputSource = "pointer" | "wheel" | "touch" | "keyboard";

/**
 * Modifier key state, shared across input sources that support modifiers.
 */
export type InputModifiers = {
    ctrl?: boolean;
    shift?: boolean;
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
export type PointerInputMapEntry<TInteraction extends string = string> = {
    source: "pointer";
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
} & PointerConditions;

/**
 * Mapping rule for mouse wheel inputs.
 */
export type WheelInputMapEntry<TInteraction extends string = string> = {
    source: "wheel";
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
} & WheelConditions;

/**
 * Mapping rule for touch inputs.
 */
export type TouchInputMapEntry<TInteraction extends string = string> = {
    source: "touch";
    interaction: TInteraction;
    /** Multiplier applied to input deltas before passing to the handler. Default is 1. */
    sensitivity?: number;
} & TouchConditions;

/**
 * Mapping rule for keyboard inputs.
 * The `key` field on the entry supports a single key code or an array of key codes for matching.
 * When resolving, the condition's `key` is checked against the entry's `key` value(s).
 */
export type KeyboardInputMapEntry<TInteraction extends string = string> = {
    source: "keyboard";
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
