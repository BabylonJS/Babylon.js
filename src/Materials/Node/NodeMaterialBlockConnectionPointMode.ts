/**
 * Enum defining the mode of a NodeMaterialBlockConnectionPoint
 */
export enum NodeMaterialBlockConnectionPointMode {
    /** Value is an uniform */
    Uniform,
    /** Value is a mesh attribute */
    Attribute,
    /** Value is a varying between vertex and fragment shaders */
    Varying,
    /** Mode is undefined */
    Undefined,
}