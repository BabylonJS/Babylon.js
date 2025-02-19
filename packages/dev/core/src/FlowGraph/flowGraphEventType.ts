/**
 * Event types supported by the FlowGraph.
 */
export const enum FlowGraphEventType {
    SceneReady = "SceneReady",
    SceneDispose = "SceneDispose",
    SceneBeforeRender = "SceneBeforeRender",
    SceneAfterRender = "SceneAfterRender",
    MeshPick = "MeshPick",
    PointerDown = "PointerDown",
    PointerUp = "PointerUp",
    PointerMove = "PointerMove",
    PointerOver = "PointerOver",
    PointerOut = "PointerOut",
    NoTrigger = "NoTrigger",
}
