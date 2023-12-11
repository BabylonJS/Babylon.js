/**
 * Enum used to define the mode for an animation group mask
 */
export enum AnimationGroupMaskMode {
    /**
     * The mask defines the animatable target names that should be included
     */
    Include = 0,
    /**
     * The mask defines the animatable target names in a "exclude" mode: all animatable targets will be animated except the ones defined in the mask
     */
    Exclude = 1,
}

/**
 * Defines a mask used to filter animation targets.
 * If you apply a mask to an animation group (see the AnimationGroup.mask property), only the animations whose target names match the mask will play.
 * Note that a target is defined by its name (string). This means that the same mask can be used for several animation groups, provided that their targets are named in the same way.
 */
export class AnimationGroupMask {
    /**
     * The set of target names included in the mask. If mode is AnimationGroupMaskMode.Exclude, the targets in this set will be excluded from the mask instead.
     */
    private _targetNames: Set<String>;

    /**
     * Gets or sets a boolean indicating if the mask is disabled (default is false)
     */
    public disabled = false;

    /**
     * Creates a new mask
     * @param names The list of target names to add to the mask (optional)
     * @param mode Defines the mode for the mask (default: AnimationGroupMaskMode.Include)
     */
    constructor(
        names?: string[],
        /**
         * Defines the mode for the mask
         */
        public mode: AnimationGroupMaskMode = AnimationGroupMaskMode.Include
    ) {
        this._targetNames = new Set<String>();
        if (names) {
            this.addTargetName(names);
        }
    }

    /**
     * Adds one or several target names to the mask
     * @param name The name(s) to add to the mask
     */
    public addTargetName(name: string | string[]): void {
        if (Array.isArray(name)) {
            for (const n of name) {
                this._targetNames.add(n);
            }
            return;
        }

        this._targetNames.add(name);
    }

    /**
     * Removes one or several target names from the mask
     * @param name The name(s) to remove from the mask
     */
    public removeTargetName(name: string | string[]): void {
        if (Array.isArray(name)) {
            for (const n of name) {
                this._targetNames.delete(n);
            }
            return;
        }

        this._targetNames.delete(name);
    }

    /**
     * Checks if the mask includes a target name.
     * This method is intended to know if a given target name is included in the mask, not if the name is actually retained by the mask (see retainsTarget() instead).
     * @param name The name to check with the mask
     * @returns True if the mask includes the name, false otherwise
     */
    public hasTarget(name: string): boolean {
        return this._targetNames.has(name);
    }

    /**
     * Checks if the mask retains a target name.
     * Note that in the "Exclude" mode, this will return false if the mask includes the name, and true otherwise!
     * This method is intended to know if a given target name is retained by the mask, not if the name is in the list of target names.
     * @param name The name to check with the mask
     * @returns True if the mask retains the name, false otherwise
     */
    public retainsTarget(name: string): boolean {
        return this._targetNames.has(name) === (this.mode === AnimationGroupMaskMode.Include);
    }
}
