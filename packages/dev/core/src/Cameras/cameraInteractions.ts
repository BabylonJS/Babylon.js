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

/**
 * Mapping rule for pointer (mouse button) inputs.
 */
export type PointerInputMapEntry<TInteraction extends string = string> = {
    source: "pointer";
    interaction: TInteraction;
    /** Mouse button filter (0=left, 1=middle, 2=right). Omit to match any button. */
    button?: number;
    /** Modifier key filters. Only specified keys are checked; omitted = don't-care. */
    modifiers?: InputModifiers;
};

/**
 * Mapping rule for mouse wheel inputs.
 */
export type WheelInputMapEntry<TInteraction extends string = string> = {
    source: "wheel";
    interaction: TInteraction;
    /** Modifier key filters. Only specified keys are checked; omitted = don't-care. */
    modifiers?: InputModifiers;
};

/**
 * Mapping rule for touch inputs.
 */
export type TouchInputMapEntry<TInteraction extends string = string> = {
    source: "touch";
    interaction: TInteraction;
    /** Number of active touch points. Omit to match any count. */
    touchCount?: number;
};

/**
 * Mapping rule for keyboard inputs.
 */
export type KeyboardInputMapEntry<TInteraction extends string = string> = {
    source: "keyboard";
    interaction: TInteraction;
    /** Modifier key filters. Only specified keys are checked; omitted = don't-care. */
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
 * Conditions from a physical input event, passed to resolveInteraction().
 */
export type InputConditions = {
    /** Mouse button (0=left, 1=middle, 2=right) */
    button?: number;
    /** Modifier key state */
    modifiers?: InputModifiers;
    /** Number of active touch points */
    touchCount?: number;
};
