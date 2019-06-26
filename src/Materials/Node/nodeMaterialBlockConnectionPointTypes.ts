/**
 * Defines the kind of connection point for node based material
 */
export enum NodeMaterialBlockConnectionPointTypes {
    /** Float */
    Float = 1,
    /** Int */
    Int = 2,
    /** Vector2 */
    Vector2 = 4,
    /** Vector3 */
    Vector3 = 8,
    /** Vector4 */
    Vector4 = 16,
    /** Color3 */
    Color3 = 32,
    /** Color4 */
    Color4 = 64,
    /** Matrix */
    Matrix = 128,
    /** Vector3 or Color3 */
    Vector3OrColor3 = Vector3 | Color3,
    /** Vector3 or Vector4 */
    Vector3OrVector4 = Vector3 | Vector4,
    /** Vector4 or Color4 */
    Vector4OrColor4 = Vector4 | Color4,
    /** Color3 or Color4 */
    Color3OrColor4 = Color3 | Color4,
    /** Vector2 or Color3 or Color4 */
    Vector2OrColor3OrColor4 = Vector2 | Color3 | Color4,
    /** Vector3 or Color3 or Color4 or Vector4 */
    Vector3OrColor3OrVector4OrColor4 = Vector3 | Color3 | Vector4 | Color4,
    /** Vector2 or Vector3 or Color3 or Color4 or Vector4 */
    Vector2OrVector3OrColor3OrVector4OrColor4 = Vector2 | Vector3 | Color3 | Vector4 | Color4,
    /** Detect type based on connection */
    AutoDetect = 1024,
    /** Output type that will be defined by input type */
    BasedOnInput = 2048
}