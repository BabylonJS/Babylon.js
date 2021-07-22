/**
 * Defines the predefined collection types used in the performance viewer.
 */
export enum PerfCollectionType {
    /**
     * Collection type for fps collection.
     */
    Fps = 1,
    /**
     * Collection type for cpu utilization collection.
     */
    Cpu = 2,
    /**
     * Collection type for collection of total number of meshes.
     */
    TotalMeshes = 4,
    /**
     * Collection type for collection of number of active meshes.
     */
    ActiveMeshes = 8,
    /**
     * Collection type for collection of number of active indices.
     */
    ActiveIndicies = 16,
    /**
     * Collection type for collection of number of active faces.
     */
    ActiveFaces = 32,
    /**
     * Collection type for collection of number of active bones.
     */
    ActiveBones = 64,
    /**
     * Collection type for collection of number of active particles.
     */
    ActiveParticles = 128,
    /**
     * Collection type for collection of number of draw calls.
     */
    DrawCalls = 256,
    /**
     * Collection type for collection of total number of lights.
     */
    TotalLights = 512,
    /**
     * Collection type for collection of total number of vertices.
     */
    TotalVertices = 1024,
    /**
     * Collection type for collection of total number of materials.
     */
    TotalMaterials = 2048,
    /**
     * Collection type for collection of total number of textures.
     */
    TotalTextures = 4096,
    /**
     * Collection type for collection of the absolute fps.
     */
    AbsoluteFps = 8192,
    /**
     * Collection type for collection of time taken for meshes selection.
     */
    MeshesSelection = 16384,
    /**
     * Collection type for collection of time taken for render targets.
     */
    RenderTargets = 32768,
    /**
     * Collection type for collection of time taken for particles.
     */
    Particles = 65536,
    /**
     * Collection type for collection of time taken for sprites.
     */
    Sprites = 131072,
    /**
     * Collection type for collection of time taken for animations.
     */
    Animations = 262144,
    /**
     * Collection type for collection of time taken for physics.
     */
    Physics = 524288,
    /**
     * Collection type for collection of time taken for rendering.
     */
    Render = 1048576,
    /**
     * Collection type for collection of frame total time.
     */
    FrameTotal = 2097152,
    /**
     * Collection type for collection of inter-frame time.
     */
    InterFrame = 4194304,
    /**
     * Collection type for collection of gpu frame time.
     */
    GpuFrameTime = 8388608,
}