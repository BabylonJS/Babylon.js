/**
 * Enum used to define well known values e.g. values automatically provided by the system
 */
export enum NodeMaterialWellKnownValues {
    /** World */
    World = 1,
    /** View */
    View = 2,
    /** Projection */
    Projection = 3,
    /** ViewProjection */
    ViewProjection = 4,
    /** WorldView */
    WorldView = 5,
    /** WorldViewProjection */
    WorldViewProjection = 6,
    /** CameraPosition */
    CameraPosition = 7,
    /** Will be filled by the block itself */
    Automatic = 8
}