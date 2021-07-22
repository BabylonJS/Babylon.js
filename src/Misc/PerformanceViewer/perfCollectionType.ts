/**
 * Defines the predefined collection types used in the performance viewer.
 */
export enum PerfCollectionType {
    /**
     * Collection type for fps collection.
     */
    Fps = "fps",
    /**
     * Collection type for cpu utilization collection.
     */
    Cpu = "cpu utilization",
    /**
     * Collection type for collection of total number of meshes.
     */
    TotalMeshes = "total meshes",
    /**
     * Collection type for collection of number of active meshes.
     */
    ActiveMeshes = "active meshes",
    /**
     * Collection type for collection of number of active indices.
     */
    ActiveIndicies = "active indices",
    /**
     * Collection type for collection of number of active faces.
     */
    ActiveFaces = "active faces",
    /**
     * Collection type for collection of number of active bones.
     */
    ActiveBones = "active bones",
    /**
     * Collection type for collection of number of active particles.
     */
    ActiveParticles = "active particles",
    /**
     * Collection type for collection of number of draw calls.
     */
    DrawCalls = "draw calls",
    /**
     * Collection type for collection of total number of lights.
     */
    TotalLights = "total lights",
    /**
     * Collection type for collection of total number of vertices.
     */
    TotalVertices = "total vertices",
    /**
     * Collection type for collection of total number of materials.
     */
    TotalMaterials = "total materials",
    /**
     * Collection type for collection of total number of textures.
     */
    TotalTextures = "total textures",
    /**
     * Collection type for collection of the absolute fps.
     */
    AbsoluteFps = "absolute fps",
    /**
     * Collection type for collection of time taken for meshes selection.
     */
    MeshesSelection = "meshes selection time",
    /**
     * Collection type for collection of time taken for render targets.
     */
    RenderTargets = "render targets time",
    /**
     * Collection type for collection of time taken for particles.
     */
    Particles = "particles time",
    /**
     * Collection type for collection of time taken for sprites.
     */
    Sprites = "sprites time",
    /**
     * Collection type for collection of time taken for animations.
     */
    Animations = "animations time",
    /**
     * Collection type for collection of time taken for physics.
     */
    Physics = "physics time",
    /**
     * Collection type for collection of time taken for rendering.
     */
    Render = "render time",
    /**
     * Collection type for collection of frame total time.
     */
    FrameTotal = "total frame time",
    /**
     * Collection type for collection of inter-frame time.
     */
    InterFrame = "inter-frame time",
    /**
     * Collection type for collection of gpu frame time.
     */
    GpuFrameTime = "gpu frame time",
}