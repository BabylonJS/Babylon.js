/**
 * Enum used to define the target of a block
 */
export enum NodeMaterialBlockTargets {
    /** Vertex shader */
    Vertex = 1,
    /** Fragment shader */
    Fragment = 2,
    /** Neutral */
    Neutral = 4,
    /** Vertex and Fragment */
    VertexAndFragment = Vertex | Fragment
}
