/**
 * Enum that determines the text-wrapping mode to use.
 */
export enum InspectableType {
    /**
     * Checkbox for booleans
     */
    Checkbox = 0,
    /**
     * Sliders for numbers
     */
    Slider = 1,
    /**
     * Vector3
     */
    Vector3 = 2,
    /**
     * Quaternions
     */
    Quaternion = 3,
    /**
     * Color3
     */
    Color3 = 4,
    /**
     * String
     */
    String = 5
}

/**
 * Interface used to define custom inspectable properties.
 * This interface is used by the inspector to display custom property grids
 * @see https://doc.babylonjs.com/how_to/debug_layer#extensibility
 */
export interface IInspectable {
    /**
     * Gets the label to display
     */
    label: string;
    /**
     * Gets the name of the property to edit
     */
    propertyName: string;
    /**
     * Gets the type of the editor to use
     */
    type: InspectableType;
    /**
     * Gets the minimum value of the property when using in "slider" mode
     */
    min?: number;
    /**
     * Gets the maximum value of the property when using in "slider" mode
     */
    max?: number;
    /**
     * Gets the setp to use when using in "slider" mode
     */
    step?: number;
}