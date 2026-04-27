/**
 * Determines how values from the PhysicsMaterial are combined when
 * two objects are in contact. When each PhysicsMaterial specifies
 * a different combine mode for some property, the combine mode which
 * is used will be selected based on their order in this enum - i.e.
 * a value later in this list will be preferentially used.
 */
export const enum PhysicsMaterialCombineMode {
    /**
     * The final value will be the geometric mean of the two values:
     * sqrt( valueA *  valueB )
     */
    GEOMETRIC_MEAN,
    /**
     * The final value will be the smaller of the two:
     * min( valueA , valueB )
     */
    MINIMUM,
    /** The final value will be the larger of the two:
     * max( valueA , valueB )
     */
    MAXIMUM,
    /** The final value will be the arithmetic mean of the two values:
     * (valueA + valueB) / 2
     */
    ARITHMETIC_MEAN,
    /**
     * The final value will be the product of the two values:
     * valueA * valueB
     */
    MULTIPLY,
}

/**
 * Physics material class
 * Helps setting friction and restitution that are used to compute responding forces in collision response
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface PhysicsMaterial {
    /**
     * Sets the friction used by this material
     *
     * The friction determines how much an object will slow down when it is in contact with another object.
     * This is important for simulating realistic physics, such as when an object slides across a surface.
     *
     * If not provided, a default value of 0.5 will be used.
     */
    friction?: number;

    /**
     * Sets the static friction used by this material.
     *
     * Static friction is the friction that must be overcome before a pair of objects can start sliding
     * relative to each other; for physically-realistic behaviour, it should be at least as high as the
     * normal friction value. If not provided, the friction value will be used
     */
    staticFriction?: number;

    /**
     * Sets the restitution of the physics material.
     *
     * The restitution is a factor which describes, the amount of energy that is retained after a collision,
     * which should be a number between 0 and 1..
     *
     * A restitution of 0 means that no energy is retained and the objects will not bounce off each other,
     * while a restitution of 1 means that all energy is retained and the objects will bounce.
     *
     * Note, though, due that due to the simulation implementation, an object with a restitution of 1 may
     * still lose energy over time.
     *
     * If not provided, a default value of 0 will be used.
     */
    restitution?: number;

    /**
     * Describes how two different friction values should be combined. See PhysicsMaterialCombineMode for
     * more details.
     *
     * If not provided, will use PhysicsMaterialCombineMode.MINIMUM
     */
    frictionCombine?: PhysicsMaterialCombineMode;

    /**
     * Describes how two different restitution values should be combined. See PhysicsMaterialCombineMode for
     * more details.
     *
     * If not provided, will use PhysicsMaterialCombineMode.MAXIMUM
     */
    restitutionCombine?: PhysicsMaterialCombineMode;
}
