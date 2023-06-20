import type { AbstractMesh } from "../Meshes/abstractMesh";

/**
 * Class used to store configuration data associated with pointer picking
 */
export class PointerPickingConfiguration {
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer down event
     */
    public pointerDownPredicate: (Mesh: AbstractMesh) => boolean;
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer up event
     */
    public pointerUpPredicate: (Mesh: AbstractMesh) => boolean;

    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer move event
     */
    public pointerMovePredicate: (Mesh: AbstractMesh) => boolean;

    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer down event
     */
    public pointerDownFastCheck = false;
    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer up event
     */
    public pointerUpFastCheck = false;

    /**
     * Gets or sets a predicate used to select candidate meshes for a pointer move event
     */
    public pointerMoveFastCheck = false;

    /**
     * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer move event occurs.
     */
    public skipPointerMovePicking = false;

    /**
     * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer down event occurs.
     */
    public skipPointerDownPicking = false;

    /**
     * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer up event occurs.  Off by default.
     */
    public skipPointerUpPicking = false;
}
