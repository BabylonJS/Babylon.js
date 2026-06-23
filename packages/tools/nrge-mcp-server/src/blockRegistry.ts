/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Complete registry of all Node Render Graph block types available in Babylon.js.
 *
 * Each entry describes the block's Babylon class name, category, purpose,
 * its typed input/output ports, and optional customisable properties.
 *
 * ── Connection-point types quick reference ───────────────────────────────
 *
 * Texture types (use these names exactly in the catalog & connect calls):
 *   Texture                                – generic render target / history texture
 *   TextureBackBuffer                      – the final back-buffer colour attachment
 *   TextureBackBufferDepthStencilAttachment– back-buffer depth/stencil attachment
 *   TextureDepthStencilAttachment          – off-screen depth/stencil attachment
 *   TextureViewDepth                       – geometry depth in view-space
 *   TextureNormalizedViewDepth             – geometry normalised depth in view-space
 *   TextureScreenDepth                     – geometry depth in screen-space
 *   TextureViewNormal                      – geometry normals in view-space
 *   TextureWorldNormal                     – geometry normals in world-space
 *   TextureAlbedo                          – geometry albedo (base-colour) buffer
 *   TextureReflectivity                    – geometry reflectivity buffer
 *   TextureLocalPosition                   – geometry positions in local-space
 *   TextureWorldPosition                   – geometry positions in world-space
 *   TextureVelocity                        – motion/velocity buffer
 *   TextureLinearVelocity                  – linear velocity buffer
 *   TextureIrradiance                      – irradiance buffer
 *   TextureAlbedoSqrt                      – sqrt-encoded albedo buffer
 *
 * Non-texture types:
 *   Camera       – a Babylon.js Camera object (provided by an InputBlock)
 *   ObjectList   – a set of meshes/particle-systems (provided by InputBlock or CullObjects)
 *   ShadowLight  – a shadow-casting light (provided by an InputBlock)
 *   ShadowGenerator – output of a shadow-generator block
 *   ResourceContainer – groups multiple texture handles for dependency tracking
 *   Object       – opaque custom object (e.g. objectRenderer handle for layer blocks)
 *
 * Special meta-types (cannot be used as concrete port types):
 *   AutoDetect   – port accepts many types; the type is resolved at connection time
 *   BasedOnInput – output type mirrors a connected input port
 *
 * ── additionalConstructionParameters ─────────────────────────────────────
 * Several blocks require extra constructor arguments beyond (name, frameGraph, scene).
 * These map directly to the serialisation field `additionalConstructionParameters`
 * and MUST be supplied when adding the block so the deserialiser can recreate it.
 * The default values used when the parameter is omitted are listed in each block entry.
 */

/**
 * Describes a single typed port on a block.
 */
export interface IPortInfo {
    /** Port name (pass exactly this string to connect_blocks) */
    name: string;
    /** Human-readable type label (from the connection-point reference above) */
    type: string;
    /** True when the port does not have to be connected for the block to work */
    isOptional?: boolean;
}

/**
 * Describes a block type in the NRGE catalog.
 */
export interface IBlockTypeInfo {
    /** The Babylon.js class name (without BABYLON. prefix) */
    className: string;
    /** Grouping category shown in the NRGE left panel */
    category: string;
    /** Short description of the block's purpose */
    description: string;
    /** Input ports */
    inputs: IPortInfo[];
    /** Output ports */
    outputs: IPortInfo[];
    /**
     * Named properties whose values can be tweaked via set_block_properties.
     * Each key is the property name; the value is a human-readable type/range hint.
     */
    properties?: Record<string, string>;
    /**
     * `additionalConstructionParameters` to embed in the serialised block.
     * If a block requires these, they MUST be present – omitting them will cause a
     * runtime deserialisation crash.  The defaults shown here match the constructor
     * default arguments in the Babylon.js source.
     */
    defaultAdditionalConstructionParameters?: unknown[];
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

// Base blocks such as NodeRenderGraphBaseObjectRendererBlock, NodeRenderGraphBasePostProcessBlock,
// NodeRenderGraphBaseWithPropertiesPostProcessBlock, and NodeRenderGraphBaseShadowGeneratorBlock are not creatable catalog entries.
export const BlockRegistry: Record<string, IBlockTypeInfo> = {
    // ═══════════════════════════════════════════════════════════════════════
    //  Input / Output
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphInputBlock: {
        className: "NodeRenderGraphInputBlock",
        category: "Input",
        description:
            "Exposes an external resource to the render graph. " +
            "The type is determined by `additionalConstructionParameters[0]` (a NodeRenderGraphBlockConnectionPointTypes enum value). " +
            "Common type values: Texture=1, TextureDepthStencilAttachment=8, Camera=0x01000000, ObjectList=0x02000000, ShadowLight=0x00400000. " +
            "Set `isExternal=true` so Babylon auto-fills the value from the scene at build time. " +
            "For texture inputs you must provide `creationOptions` with size/format/samples; " +
            "use the `set_block_properties` tool to set these fields after adding the block.",
        inputs: [],
        outputs: [{ name: "output", type: "AutoDetect" }],
        properties: {
            isExternal: "boolean – when true Babylon.js fills the value automatically (cameras, object-lists, lights). Default: false",
            creationOptions: "FrameGraphTextureCreationOptions JSON – for texture inputs; defines size, format, samples, etc.",
        },
        // additionalConstructionParameters[0] must be set to a NodeRenderGraphBlockConnectionPointTypes value.
        // Common values: Texture=1 (0x1), TextureDepthStencilAttachment=8 (0x8),
        //   Camera=16777216 (0x01000000), ObjectList=33554432 (0x02000000), ShadowLight=4194304 (0x00400000)
        defaultAdditionalConstructionParameters: [1073741824], // Undefined – callers must override
    },

    NodeRenderGraphOutputBlock: {
        className: "NodeRenderGraphOutputBlock",
        category: "Output",
        description:
            "The final output block. Every render graph MUST have exactly one. " +
            "Connect the last rendered texture to the `texture` port. " +
            "The outputNodeId of the serialised graph must equal this block's id.",
        inputs: [
            { name: "texture", type: "Texture", isOptional: false },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Texture utilities
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphClearBlock: {
        className: "NodeRenderGraphClearBlock",
        category: "Textures",
        description:
            "Clears a colour texture and/or depth-stencil attachment to a configurable colour / depth value. " +
            "Both `target` and `depth` are optional, but at least one should be connected. " +
            "Outputs mirror the connected inputs so downstream blocks can use the cleared textures.",
        inputs: [
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "depth", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "BasedOnInput" },
            { name: "outputDepth", type: "BasedOnInput" },
        ],
        properties: {
            color: "Color4 {r,g,b,a} – clear colour (default: {r:0,g:0,b:0,a:1})",
            clearColor: "boolean – whether to clear the colour channel (default: true)",
            clearDepth: "boolean – whether to clear the depth channel (default: false)",
            clearStencil: "boolean – whether to clear the stencil channel (default: false)",
            convertColorToLinearSpace: "boolean – convert sRGB clear colour to linear space (default: false)",
        },
    },

    NodeRenderGraphCopyTextureBlock: {
        className: "NodeRenderGraphCopyTextureBlock",
        category: "Textures",
        description: "Copies (blits) one texture into another. Useful for preserving intermediate render results or preparing textures for later read-back.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphGenerateMipmapsBlock: {
        className: "NodeRenderGraphGenerateMipmapsBlock",
        category: "Textures",
        description:
            "Generates all mip-map levels for a texture in-place after prior rendering has been done. " +
            "Required for techniques that sample lower mip levels (e.g. bloom, reflections).",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Rendering
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphObjectRendererBlock: {
        className: "NodeRenderGraphObjectRendererBlock",
        category: "Rendering",
        description:
            "Renders a list of scene objects (meshes, particles) to a colour target using a camera. " +
            "This is the primary rasterisation block — almost every graph needs one. " +
            "Connect a cleared colour texture to `target`, a depth attachment to `depth`, " +
            "a Camera input to `camera`, and a (possibly culled) ObjectList to `objects`. " +
            "Optional `shadowGenerators` port accepts a ShadowGenerator or ResourceContainer of shadow generators.",
        inputs: [
            { name: "target", type: "AutoDetect" },
            { name: "depth", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
            { name: "shadowGenerators", type: "AutoDetect", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "BasedOnInput" },
            { name: "outputDepth", type: "BasedOnInput" },
            { name: "objectRenderer", type: "Object" },
        ],
        properties: {
            doNotChangeAspectRatio: "boolean – do not change the aspect ratio of the scene when rendering to RTT (default: true). Set as additionalConstructionParameters[0]",
            enableClusteredLights: "boolean – enable clustered light rendering (default: true). Set as additionalConstructionParameters[1]",
            isMainObjectRenderer:
                "boolean – marks this as the main object renderer; only one block should be main per graph. Babylon.js auto-assigns the first one if none is set.",
            depthTest: "boolean – enable depth testing (default: true)",
            depthWrite: "boolean – enable depth writing (default: true)",
            disableShadows: "boolean – disable shadow sampling (default: false)",
            renderParticles: "boolean – render particle systems (default: true)",
            renderSprites: "boolean – render sprite managers (default: true)",
        },
        defaultAdditionalConstructionParameters: [true, true],
    },

    NodeRenderGraphGeometryRendererBlock: {
        className: "NodeRenderGraphGeometryRendererBlock",
        category: "Rendering",
        description:
            "Renders scene geometry into a multi-render target (G-Buffer), producing typed geometry textures " +
            "(view-depth, normals, albedo, reflectivity, positions, velocity, etc.). " +
            "Use these outputs as inputs for deferred shading techniques such as SSR, SSAO, or custom deferred passes. " +
            "The `target` port for the colour attachment is OPTIONAL for this block.",
        inputs: [
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "depth", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
            { name: "shadowGenerators", type: "AutoDetect", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "BasedOnInput" },
            { name: "outputDepth", type: "BasedOnInput" },
            { name: "objectRenderer", type: "Object" },
            { name: "geomViewDepth", type: "TextureViewDepth" },
            { name: "geomNormViewDepth", type: "TextureNormalizedViewDepth" },
            { name: "geomScreenDepth", type: "TextureScreenDepth" },
            { name: "geomViewNormal", type: "TextureViewNormal" },
            { name: "geomWorldNormal", type: "TextureWorldNormal" },
            { name: "geomLocalPosition", type: "TextureLocalPosition" },
            { name: "geomWorldPosition", type: "TextureWorldPosition" },
            { name: "geomAlbedo", type: "TextureAlbedo" },
            { name: "geomReflectivity", type: "TextureReflectivity" },
            { name: "geomVelocity", type: "TextureVelocity" },
            { name: "geomLinearVelocity", type: "TextureLinearVelocity" },
        ],
        properties: {
            doNotChangeAspectRatio: "boolean – do not change aspect ratio (default: true) — additionalConstructionParameters[0]",
            enableClusteredLights: "boolean – enable clustered lights (default: true) — additionalConstructionParameters[1]",
            depthTest: "boolean",
            depthWrite: "boolean",
            width: "number – G-buffer width in pixels (or percentage when sizeInPercentage=true)",
            height: "number – G-buffer height",
            sizeInPercentage: "boolean – use width/height as screen percentage (default: true)",
            samples: "number – MSAA sample count (default: 1)",
        },
        defaultAdditionalConstructionParameters: [true, true],
    },

    NodeRenderGraphUtilityLayerRendererBlock: {
        className: "NodeRenderGraphUtilityLayerRendererBlock",
        category: "Rendering",
        description:
            "Renders the Babylon.js utility layer (gizmos, helpers) on top of the main colour attachment. Used when the inspector / gizmos should appear in the final output.",
        inputs: [
            { name: "target", type: "AutoDetect" },
            { name: "depth", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
            { name: "shadowGenerators", type: "AutoDetect", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "BasedOnInput" },
            { name: "outputDepth", type: "BasedOnInput" },
            { name: "objectRenderer", type: "Object" },
        ],
        defaultAdditionalConstructionParameters: [true, true],
    },

    NodeRenderGraphShadowGeneratorBlock: {
        className: "NodeRenderGraphShadowGeneratorBlock",
        category: "Rendering",
        description:
            "Generates a shadow map for a directional, spot, or point light. " +
            "Connect its `output` (ShadowGenerator) to the `shadowGenerators` port of an ObjectRendererBlock " +
            "so rendered objects receive shadows from this light.",
        inputs: [
            { name: "light", type: "ShadowLight" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "ShadowGenerator" }],
        properties: {
            mapSize: "number – shadow map resolution (default: 1024)",
            useExponentialShadowMap: "boolean",
            usePoissonSampling: "boolean",
            useBlurExponentialShadowMap: "boolean",
            useCloseExponentialShadowMap: "boolean",
            useBlurCloseExponentialShadowMap: "boolean",
            usePCSShadowMap: "boolean",
            useVSM: "boolean",
            bias: "number",
            normalBias: "number",
        },
    },

    NodeRenderGraphCascadedShadowGeneratorBlock: {
        className: "NodeRenderGraphCascadedShadowGeneratorBlock",
        category: "Rendering",
        description:
            "Generates a Cascaded Shadow Map (CSM) for a directional light. " +
            "CSM provides better quality close-up shadows with a smooth fade to lower quality at distance. " +
            "Connect its `output` (ShadowGenerator) to the `shadowGenerators` port of an ObjectRendererBlock.",
        inputs: [
            { name: "light", type: "ShadowLight" },
            { name: "objects", type: "ObjectList" },
            { name: "camera", type: "Camera" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "ShadowGenerator" }],
        properties: {
            mapSize: "number – shadow map resolution per cascade (default: 1024)",
            numCascades: "number – number of cascades (default: 4; must be 2–4)",
            lambda: "number – 0 = uniform, 1 = logarithmic split (default: 0.5)",
            shadowMaxZ: "number – maximum shadow distance",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Object culling
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphCullObjectsBlock: {
        className: "NodeRenderGraphCullObjectsBlock",
        category: "Culling",
        description:
            "Culls an ObjectList using a camera frustum and returns a reduced ObjectList " +
            "containing only the visible objects. " +
            "Use this before passing objects to an ObjectRendererBlock for better performance.",
        inputs: [
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "ObjectList" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Post Processes
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphBloomPostProcessBlock: {
        className: "NodeRenderGraphBloomPostProcessBlock",
        category: "PostProcess",
        description:
            "Adds a bloom glow effect to bright areas of the source texture. " +
            "Connect a rendered colour texture to `source`. " +
            "Use additionalConstructionParameters=[hdr, bloomScale] to set HDR mode and scale at creation; " +
            "threshold, weight, and kernel can be set via set_block_properties.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            hdr: "boolean – use HDR textures (default: false) — set via additionalConstructionParameters[0]",
            bloomScale: "number – scale factor (default: 0.5) — set via additionalConstructionParameters[1]",
            threshold: "number – brightness threshold to bloom (default: 0.9)",
            weight: "number – bloom intensity (default: 0.15)",
            kernel: "number – blur kernel size (default: 64)",
        },
        defaultAdditionalConstructionParameters: [false, 0.5],
    },

    NodeRenderGraphBlurPostProcessBlock: {
        className: "NodeRenderGraphBlurPostProcessBlock",
        category: "PostProcess",
        description: "Applies a Gaussian blur to a texture. additionalConstructionParameters=[direction {x,y}, blockSize] control the blur direction and radius.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            kernel: "number – blur kernel size / radius",
        },
        defaultAdditionalConstructionParameters: [{ x: 1, y: 0 }, 1],
    },

    NodeRenderGraphFXAAPostProcessBlock: {
        className: "NodeRenderGraphFXAAPostProcessBlock",
        category: "PostProcess",
        description: "Applies Fast Approximate Anti-Aliasing (FXAA) to reduce jagged edges on the texture.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphSharpenPostProcessBlock: {
        className: "NodeRenderGraphSharpenPostProcessBlock",
        category: "PostProcess",
        description: "Sharpens the image to enhance detail clarity.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            colorAmount: "number – amount of colour sharpening (0–1, default: 0.8)",
            edgeAmount: "number – edge detection strength (0–2, default: 0.3)",
        },
    },

    NodeRenderGraphChromaticAberrationPostProcessBlock: {
        className: "NodeRenderGraphChromaticAberrationPostProcessBlock",
        category: "PostProcess",
        description: "Simulates lens chromatic aberration by separating the colour channels slightly.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            aberrationAmount: "number – strength of aberration (default: 30)",
            radialIntensity: "number – how the effect grows from centre outwards (default: 1)",
            direction: "{x,y} – direction of channel shift (default: {x:0.707,y:0.707})",
            centerPosition: "{x,y} – centre of effect (default: {x:0.5,y:0.5})",
        },
    },

    NodeRenderGraphGrainPostProcessBlock: {
        className: "NodeRenderGraphGrainPostProcessBlock",
        category: "PostProcess",
        description: "Overlays animated film-grain noise on the image.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            intensity: "number – grain intensity (default: 30)",
            animated: "boolean – animate noise each frame (default: true)",
        },
    },

    NodeRenderGraphBlackAndWhitePostProcessBlock: {
        className: "NodeRenderGraphBlackAndWhitePostProcessBlock",
        category: "PostProcess",
        description: "Converts the image to greyscale.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            degree: "number – 0 = no change, 1 = fully greyscale (default: 1)",
        },
    },

    NodeRenderGraphTonemapPostProcessBlock: {
        className: "NodeRenderGraphTonemapPostProcessBlock",
        category: "PostProcess",
        description: "Applies tone-mapping to convert HDR values to LDR for display.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operator: "number – tone-mapping operator: Hable=0, Reinhard=1, HejiDawson=2, Photographic=3, DX11DSK=4, Linear=5, ACES=6 (default: Hable=0)",
            exposureAdjustment: "number – exposure multiplier (default: 1)",
        },
    },

    NodeRenderGraphDepthOfFieldPostProcessBlock: {
        className: "NodeRenderGraphDepthOfFieldPostProcessBlock",
        category: "PostProcess",
        description:
            "Simulates camera depth-of-field blur. " +
            "Requires a `geomViewDepth` texture (from a GeometryRenderer) and a Camera. " +
            "additionalConstructionParameters=[blurLevel, hdr]: blurLevel values: Low=0, Medium=1, High=2.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "geomViewDepth", type: "TextureViewDepth" },
            { name: "camera", type: "Camera" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            blurLevel: "number – blur quality (0=Low, 1=Medium, 2=High) — set via additionalConstructionParameters[0]",
            hdr: "boolean – use HDR — set via additionalConstructionParameters[1]",
            focalLength: "number – focal length in mm (default: 150)",
            fStop: "number – f-stop / aperture (default: 1.4)",
            focusDistance: "number – focus distance in mm (default: 2000)",
            lensSize: "number – lens size (default: 50)",
        },
        defaultAdditionalConstructionParameters: [0, false],
    },

    NodeRenderGraphSSRPostProcessBlock: {
        className: "NodeRenderGraphSSRPostProcessBlock",
        category: "PostProcess",
        description:
            "Screen-Space Reflections (SSR). " +
            "Requires geometry buffers from GeometryRendererBlock: geomDepth (ScreenDepth or ViewDepth), " +
            "geomNormal (WorldNormal or ViewNormal), geomReflectivity, and a Camera. " +
            "Optional geomBackDepth provides better occlusion accuracy.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "geomDepth", type: "AutoDetect" },
            { name: "geomNormal", type: "AutoDetect" },
            { name: "geomReflectivity", type: "TextureReflectivity" },
            { name: "geomBackDepth", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            maxDistance: "number – max reflection ray distance (default: 1000)",
            step: "number – ray marching step size (default: 1)",
            thickness: "number – thickness tolerance (default: 0.5)",
            strength: "number – reflection strength (default: 1)",
            maxSteps: "number – maximum ray march iterations (default: 1000)",
            roughnessFactor: "number",
            selfCollisionNumSkip: "number – steps to skip for self-collision avoidance (default: 1)",
        },
    },

    NodeRenderGraphSSAO2PostProcessBlock: {
        className: "NodeRenderGraphSSAO2PostProcessBlock",
        category: "PostProcess",
        description:
            "Screen-Space Ambient Occlusion v2 (SSAO2). " +
            "Requires `geomViewDepth` (TextureViewDepth) and optionally `geomViewNormal` (TextureViewNormal) " +
            "from a GeometryRendererBlock. additionalConstructionParameters=[ratio (number)].",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "geomViewDepth", type: "TextureViewDepth" },
            { name: "geomViewNormal", type: "TextureViewNormal", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            ratio: "number – render ratio (default: 0.5) — set via additionalConstructionParameters[0]",
            maxZ: "number – max distance for AO sampling (default: 100)",
            minZAspect: "number",
            radius: "number – sampling radius (default: 2)",
            totalStrength: "number – AO intensity (default: 1)",
            base: "number – ambient baseline (default: 0)",
            samples: "number – sample count (default: 8)",
        },
        defaultAdditionalConstructionParameters: [0.5],
    },

    NodeRenderGraphTAAPostProcessBlock: {
        className: "NodeRenderGraphTAAPostProcessBlock",
        category: "PostProcess",
        description:
            "Temporal Anti-Aliasing (TAA). Accumulates samples across frames for smooth anti-aliasing. " +
            "Requires a Camera. additionalConstructionParameters=[samples (number), factor (number)].",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            samples: "number – number of accumulated samples (default: 8) — additionalConstructionParameters[0]",
            factor: "number – blend factor between current & accumulated (default: 0.05) — additionalConstructionParameters[1]",
        },
        defaultAdditionalConstructionParameters: [8, 0.05],
    },

    NodeRenderGraphMotionBlurPostProcessBlock: {
        className: "NodeRenderGraphMotionBlurPostProcessBlock",
        category: "PostProcess",
        description: "Applies motion blur based on per-pixel motion vectors. Requires `geomViewDepth` and `geomViewNormal`. Camera is also required.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "geomViewDepth", type: "TextureViewDepth" },
            { name: "geomViewNormal", type: "TextureViewNormal" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            motionBlurSamples: "number – number of samples (default: 32)",
            motionStrength: "number – overall blur strength (default: 1)",
        },
    },

    NodeRenderGraphImageProcessingPostProcessBlock: {
        className: "NodeRenderGraphImageProcessingPostProcessBlock",
        category: "PostProcess",
        description:
            "Applies the scene's ImageProcessingConfiguration (tone-mapping, exposure, contrast, saturation, " +
            "colour grading LUT, etc.). This is the standard post-process used by the default rendering pipeline.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphColorCorrectionPostProcessBlock: {
        className: "NodeRenderGraphColorCorrectionPostProcessBlock",
        category: "PostProcess",
        description: "Applies colour correction using a colour-lookup table (LUT) texture.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            colorTableUrl: "string – URL/path to the colour lookup table texture",
        },
    },

    NodeRenderGraphConvolutionPostProcessBlock: {
        className: "NodeRenderGraphConvolutionPostProcessBlock",
        category: "PostProcess",
        description: "Applies a convolution kernel (e.g. edge detection, emboss, sharpen) to the image.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            kernel: "number[] – flat 3×3 convolution kernel values (9 numbers)",
        },
    },

    NodeRenderGraphFilterPostProcessBlock: {
        className: "NodeRenderGraphFilterPostProcessBlock",
        category: "PostProcess",
        description: "Applies a colour matrix filter to transform colours. " + "Each row of the 4×4 matrix maps an output RGBA channel from input RGBA.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            kernelMatrix: "Matrix (16 numbers) – 4×4 colour transformation matrix",
        },
    },

    NodeRenderGraphAnaglyphPostProcessBlock: {
        className: "NodeRenderGraphAnaglyphPostProcessBlock",
        category: "PostProcess",
        description: "Produces an anaglyph 3D effect (red-cyan glasses). Requires two texture views (left/right eye).",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphScreenSpaceCurvaturePostProcessBlock: {
        className: "NodeRenderGraphScreenSpaceCurvaturePostProcessBlock",
        category: "PostProcess",
        description: "Highlights surface curvature based on screen-space derivatives of normals.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            ridge: "number – ridge curvature strength (default: 1)",
            valley: "number – valley curvature strength (default: 1)",
        },
    },

    NodeRenderGraphExtractHighlightsPostProcessBlock: {
        className: "NodeRenderGraphExtractHighlightsPostProcessBlock",
        category: "PostProcess",
        description: "Extracts pixels above a luminance threshold. Used as an intermediate step in bloom pipelines.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            threshold: "number – luminance threshold (default: 0.9)",
        },
    },

    NodeRenderGraphPassPostProcessBlock: {
        className: "NodeRenderGraphPassPostProcessBlock",
        category: "PostProcess",
        description: "A no-op pass-through post process. Useful for routing texture connections without modification.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphPassCubePostProcessBlock: {
        className: "NodeRenderGraphPassCubePostProcessBlock",
        category: "PostProcess",
        description: "A no-op pass-through post process for cube textures. Similar to PassPostProcessBlock but for cube map sources.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphCircleOfConfusionPostProcessBlock: {
        className: "NodeRenderGraphCircleOfConfusionPostProcessBlock",
        category: "PostProcess",
        description: "Computes per-pixel circle-of-confusion values from depth. Used as an input to more manual depth-of-field setups. Requires `geomViewDepth` and a Camera.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "geomViewDepth", type: "TextureViewDepth" },
            { name: "camera", type: "Camera" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphVolumetricLightingBlock: {
        className: "NodeRenderGraphVolumetricLightingBlock",
        category: "PostProcess",
        description: "Renders volumetric light shafts (god rays) emanating from a single light source.",
        inputs: [
            { name: "source", type: "AutoDetect" },
            { name: "target", type: "AutoDetect", isOptional: true },
            { name: "geomViewDepth", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            density: "number – ray density (default: 0.7)",
            weight: "number – light weight per step (default: 1)",
            decay: "number – falloff per step (default: 0.99)",
            exposure: "number – final exposure (default: 1)",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Layers
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphGlowLayerBlock: {
        className: "NodeRenderGraphGlowLayerBlock",
        category: "Layers",
        description:
            "Adds a glow effect to meshes whose emissive colour is above zero. " +
            "Connect the `objectRenderer` output of an ObjectRendererBlock to this block's `objectRenderer` input. " +
            "additionalConstructionParameters=[ldrMerge, layerTextureRatio, layerTextureFixedSize|undefined, layerTextureType].",
        inputs: [
            { name: "target", type: "AutoDetect" },
            { name: "layer", type: "AutoDetect", isOptional: true },
            { name: "objectRenderer", type: "Object" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            ldrMerge: "boolean – clamp values > 1 in merge step (default: false) — additionalConstructionParameters[0]",
            layerTextureRatio: "number – glow texture size relative to main (default: 0.5) — additionalConstructionParameters[1]",
            layerTextureFixedSize: "number|undefined – fixed pixel size override — additionalConstructionParameters[2]",
            blurKernelSize: "number – blur spread (default: 32)",
            intensity: "number – glow intensity (default: 1)",
        },
        defaultAdditionalConstructionParameters: [false, 0.5, undefined, 0],
    },

    NodeRenderGraphHighlightLayerBlock: {
        className: "NodeRenderGraphHighlightLayerBlock",
        category: "Layers",
        description:
            "Draws a coloured outline / highlight on specific meshes. Connect the `objectRenderer` output of an ObjectRendererBlock to this block's `objectRenderer` input.",
        inputs: [
            { name: "target", type: "AutoDetect" },
            { name: "layer", type: "AutoDetect", isOptional: true },
            { name: "objectRenderer", type: "Object" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            blurHorizontalSize: "number – horizontal blur (default: 1)",
            blurVerticalSize: "number – vertical blur (default: 1)",
            isStroke: "boolean – render as stroke/outline instead of fill (default: false)",
        },
    },

    NodeRenderGraphSelectionOutlineLayerBlock: {
        className: "NodeRenderGraphSelectionOutlineLayerBlock",
        category: "Layers",
        description: "Draws a selection outline around the highlighted mesh. Typically used by the Babylon.js Inspector / gizmo system.",
        inputs: [
            { name: "target", type: "AutoDetect" },
            { name: "depth", type: "AutoDetect", isOptional: true },
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Compute
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphComputeShaderBlock: {
        className: "NodeRenderGraphComputeShaderBlock",
        category: "Compute",
        description:
            "Executes a custom compute shader within the frame graph. " +
            "Accepts camera, shadow light, and object list dependencies. " +
            "Outputs a ResourceContainer for downstream ordering.",
        inputs: [{ name: "dependencies", type: "AutoDetect", isOptional: true }],
        outputs: [{ name: "output", type: "ResourceContainer" }],
        properties: {
            shaderPath: "string | IComputeShaderPath – path or inline WGSL source of the compute shader",
            shaderOptions: "IComputeShaderOptions – binding mappings and compile options",
        },
        defaultAdditionalConstructionParameters: ["@compute @workgroup_size(1, 1, 1)\nfn main() {}", { bindingsMapping: {} }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  IBL Shadows
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphIblShadowsRendererBlock: {
        className: "NodeRenderGraphIblShadowsRendererBlock",
        category: "Rendering",
        description:
            "Computes image-based lighting (IBL) shadows using voxel tracing. " +
            "Requires depth, normal, position, and velocity geometry textures plus a camera and object list. " +
            "Produces a shadow texture output.",
        inputs: [
            { name: "depth", type: "TextureScreenDepth" },
            { name: "normal", type: "TextureWorldNormal" },
            { name: "position", type: "TextureWorldPosition" },
            { name: "velocity", type: "TextureLinearVelocity" },
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Texture" }],
        properties: {
            sampleDirections: "number – tracing sample directions (1–16, default: varies)",
            coloredShadows: "boolean – whether traced shadows preserve environment color",
            voxelShadowOpacity: "number – opacity of voxel-traced shadows (0–1)",
            ssShadowOpacity: "number – opacity of screen-space shadows (0–1)",
            ssShadowSampleCount: "number – screen-space shadow samples (1–64)",
            ssShadowStride: "number – screen-space shadow stride (1–32)",
            ssShadowDistanceScale: "number – screen-space shadow distance scale",
            ssShadowThicknessScale: "number – screen-space shadow thickness scale",
            voxelNormalBias: "number – voxel tracing normal bias",
            voxelDirectionBias: "number – voxel tracing direction bias",
            envRotation: "number – environment rotation in radians",
            shadowRemanence: "number – temporal shadow remanence (0–1)",
            shadowOpacity: "number – final shadow opacity (0–1)",
            resolutionExp: "number – voxelization resolution exponent (1–8, resolution = 2^value)",
            refreshRate: "number – voxelization refresh rate (-1: manual, 0: every frame, N: skip N frames)",
            triPlanarVoxelization: "boolean – whether to use tri-planar voxelization",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Utilities / Routing
    // ═══════════════════════════════════════════════════════════════════════

    NodeRenderGraphResourceContainerBlock: {
        className: "NodeRenderGraphResourceContainerBlock",
        category: "Utility",
        description:
            "Groups multiple texture handles (or shadow generators) into one `ResourceContainer` output. " +
            "Use its output as the `dependencies` input of other blocks to express execution ordering " +
            "without a direct data-flow connection.",
        inputs: [
            { name: "input0", type: "AutoDetect", isOptional: true },
            { name: "input1", type: "AutoDetect", isOptional: true },
            { name: "input2", type: "AutoDetect", isOptional: true },
            { name: "input3", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "ResourceContainer" }],
    },

    NodeRenderGraphElbowBlock: {
        className: "NodeRenderGraphElbowBlock",
        category: "Utility",
        description: "A routing (elbow / pass-through) block that lets you organise connections visually. The output type mirrors whatever is connected to the input.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    NodeRenderGraphTeleportInBlock: {
        className: "NodeRenderGraphTeleportInBlock",
        category: "Utility",
        description:
            "Teleport entry-point. Connects to one or more TeleportOutBlocks to route a signal across the graph " +
            "without drawing long connection wires. Must be paired with at least one TeleportOutBlock of the same name.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [],
    },

    NodeRenderGraphTeleportOutBlock: {
        className: "NodeRenderGraphTeleportOutBlock",
        category: "Utility",
        description:
            "Teleport exit-point. Receives the value wired into its matching TeleportInBlock. " +
            "Multiple TeleportOut blocks can share the same TeleportIn, distributing one signal to many consumers.",
        inputs: [],
        outputs: [{ name: "output", type: "AutoDetect" }],
    },

    NodeRenderGraphExecuteBlock: {
        className: "NodeRenderGraphExecuteBlock",
        category: "Utility",
        description: "Runs a custom JavaScript callback within the frame-graph execution order. This block is for advanced use — the callback must be set at runtime in code.",
        inputs: [{ name: "dependencies", type: "AutoDetect", isOptional: true }],
        outputs: [{ name: "output", type: "AutoDetect" }],
    },

    NodeRenderGraphLightingVolumeBlock: {
        className: "NodeRenderGraphLightingVolumeBlock",
        category: "Utility",
        description: "Computes a lighting volume used by the volumetric lighting block for light contribution slicing.",
        inputs: [
            { name: "camera", type: "Camera" },
            { name: "objects", type: "ObjectList" },
            { name: "dependencies", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "AutoDetect" }],
    },
};

// ─── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Returns a compact markdown summary of all block types, grouped by category.
 * Suitable for injecting into agent context windows.
 * @returns Markdown string with one entry per block type, grouped by category.
 */
export function GetBlockCatalogSummary(): string {
    const byCategory: Record<string, string[]> = {};

    for (const [key, info] of Object.entries(BlockRegistry)) {
        const cat = info.category;
        byCategory[cat] = byCategory[cat] || [];
        byCategory[cat].push(`- **${key}**: ${info.description.split(".")[0]}`);
    }

    const lines: string[] = [];
    for (const [cat, entries] of Object.entries(byCategory)) {
        lines.push(`\n### ${cat}`);
        lines.push(...entries);
    }
    return lines.join("\n");
}

/**
 * Returns detailed markdown documentation for a single block type.
 * @param blockType - Block class name WITHOUT the "BABYLON." prefix.
 * @returns Markdown string describing the block's ports, properties, and construction parameters.
 */
export function GetBlockTypeDetails(blockType: string): string {
    const info = BlockRegistry[blockType];
    if (!info) {
        return `Unknown block type "${blockType}". Use list_block_types to see available types.`;
    }

    const lines: string[] = [`## ${blockType}`, `**Category**: ${info.category}`, `**Description**: ${info.description}`, "", "### Inputs"];

    if (info.inputs.length === 0) {
        lines.push("_(none)_");
    } else {
        for (const p of info.inputs) {
            lines.push(`- \`${p.name}\` — **${p.type}**${p.isOptional ? " _(optional)_" : ""}`);
        }
    }

    lines.push("", "### Outputs");
    if (info.outputs.length === 0) {
        lines.push("_(none)_");
    } else {
        for (const p of info.outputs) {
            lines.push(`- \`${p.name}\` — **${p.type}**`);
        }
    }

    if (info.properties && Object.keys(info.properties).length > 0) {
        lines.push("", "### Configurable Properties");
        for (const [name, desc] of Object.entries(info.properties)) {
            lines.push(`- \`${name}\`: ${desc}`);
        }
    }

    if (info.defaultAdditionalConstructionParameters !== undefined) {
        lines.push(
            "",
            "### additionalConstructionParameters",
            `Default: \`${JSON.stringify(info.defaultAdditionalConstructionParameters)}\``,
            "These are embedded in the serialised block. Override them when calling add_block if needed."
        );
    }

    return lines.join("\n");
}
