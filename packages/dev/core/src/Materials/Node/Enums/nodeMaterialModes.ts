/**
 * Enum used to define the material modes
 */
export enum NodeMaterialModes {
    /** Regular material */
    Material = 0,
    /** For post process */
    PostProcess = 1,
    /** For particle system */
    Particle = 2,
    /** For procedural texture */
    ProceduralTexture = 3,
    /** For gaussian splatting */
    GaussianSplatting = 4,
    /** For SFE */
    SFE = 5,
}
