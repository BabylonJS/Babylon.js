/**
 * Curve-editor interpolation modes used by the shared editor model.
 */
export enum CurveEditorInterpolation {
    Linear = 0,
    Step = 1,
}

/**
 * Curve-editor animation data categories.
 */
export type CurveEditorAnimationKind = "float" | "vector2" | "vector3" | "quaternion" | "color3" | "color4" | "components";

/**
 * One normalized animation key used by the shared curve editor.
 */
export type CurveEditorKey = {
    /** Editor frame corresponding to the key time. */
    frame: number;
    /** Key value split into numeric components. */
    value: readonly number[];
    /** Optional incoming tangent in value per editor frame. */
    inTangent?: readonly number[];
    /** Optional outgoing tangent in value per editor frame. */
    outTangent?: readonly number[];
    /** Whether tangent handles move together. */
    lockedTangent: boolean;
    /** Optional per-key interpolation override supported by native animations. */
    interpolation?: CurveEditorInterpolation;
};

/**
 * One numeric component displayed for a curve-editor animation.
 */
export type CurveEditorComponent = {
    /** Human-readable component label. */
    name: string;
    /** Curve and key color. */
    color: string;
};

/**
 * Animation data exposed to the shared curve editor.
 */
export interface ICurveEditorAnimation {
    /** Stable identifier used to track channels. */
    readonly uniqueId: string;
    /** Display name shown in the editor. */
    readonly name: string;
    /** Source animation frame rate. */
    readonly framePerSecond: number;
    /** Value category used for editor-specific behavior. */
    readonly kind: CurveEditorAnimationKind;
    /** Components available for editing and display. */
    readonly components: readonly CurveEditorComponent[];
    /** Whether tangent editing is supported. */
    readonly supportsTangents: boolean;
    /** Whether interpolation can be changed per key. */
    readonly supportsInterpolationEditing: boolean;
    /** Source object associated with the animation. */
    readonly source: object;
    getKeys(): CurveEditorKey[];
    setKeys(keys: readonly CurveEditorKey[]): void;
    evaluate(frame: number): readonly number[];
    /** Captures a consistent evaluator for sampling a curve path. */
    createEvaluator?(): (frame: number) => readonly number[];
}

/**
 * Playback operations required by the shared curve editor.
 */
export interface ICurveEditorPlayback {
    play(forward: boolean, fromFrame: number, toFrame: number, currentFrame: number): void;
    stop(): void;
    moveToFrame(frame: number, fromFrame: number, toFrame: number, isPlaying: boolean): void;
    getCurrentFrame(): number;
}

/**
 * Editing capabilities that vary between curve-editor hosts.
 */
export type CurveEditorSourceCapabilities = {
    /** Whether the user can change the clip duration. */
    canEditClipLength: boolean;
    /** Whether keys at either end of a curve can be deleted. */
    canDeleteBoundaryKeys: boolean;
    /** Whether keys at either end of a curve can be retimed. */
    canEditBoundaryKeyFrames: boolean;
    /** Whether deleting the final key from a curve is allowed. */
    canDeleteLastKey: boolean;
    /** Whether key positions are constrained to the clip and kept separate from neighboring keys. */
    constrainKeyFrames: boolean;
};

/**
 * Host-independent data and operations required by the shared curve editor.
 */
export interface ICurveEditorSource {
    /** All animations exposed by this host. */
    readonly animations: readonly ICurveEditorAnimation[];
    /** Animations initially selected when the editor opens. */
    readonly initialActiveAnimations: readonly ICurveEditorAnimation[];
    /** Whether the selected source is already playing when the editor opens. */
    readonly initiallyPlaying?: boolean;
    /** Host-specific playback and seeking operations. */
    readonly playback: ICurveEditorPlayback;
    /** Clip duration in editor frames. */
    readonly clipDuration: number;
    /** Editing behavior supported by this host. */
    readonly capabilities: CurveEditorSourceCapabilities;
}
