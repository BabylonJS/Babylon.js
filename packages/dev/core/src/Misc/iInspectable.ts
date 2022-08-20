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
    String = 5,
    /**
     * Button
     */
    Button = 6,
    /**
     * Options
     */
    Options = 7,
    /**
     * Tab
     */
    Tab = 8,
    /**
     * File button
     */
    FileButton = 9,
}

/**
 * Interface used to define custom inspectable options in "Options" mode.
 * This interface is used by the inspector to display the list of options
 */
export interface IInspectableOptions {
    /**
     * Defines the visible part of the option
     */
    label: string;
    /**
     * Defines the value part of the option (returned through the callback)
     */
    value: number | string;
    /**
     * Defines if the option should be selected or not
     */
    selected?: boolean;
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
    /**
     * Gets the callback function when using "Button" mode
     */
    callback?: () => void;
    /**
     * Gets the callback function when using "FileButton" mode
     */
    fileCallback?: (file: File) => void;
    /**
     * Gets the list of options when using "Option" mode
     */
    options?: IInspectableOptions[];
    /**
     * Gets the extensions to accept when using "FileButton" mode.
     * The value should be a comma separated string with the list of extensions to accept e.g., ".jpg, .png, .tga, .dds, .env".
     */
    accept?: string;
}
