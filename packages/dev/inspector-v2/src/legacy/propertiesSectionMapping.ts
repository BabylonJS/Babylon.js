// Mappings for Inspector v1 property section names to Inspector v2 section names.
export const LegacyPropertiesSectionMapping = {
    // Common sections
    ["GENERAL"]: "General",
    ["CUSTOM"]: "Custom",
    ["COMMANDS"]: "Commands",
    ["DEBUG"]: "Debug",
    ["ADVANCED"]: "Advanced",
    ["PROPERTIES"]: "Properties",

    // Transform sections
    ["TRANSFORMATIONS"]: "Transform",
    ["TRANSFORMS"]: "Transform",
    ["TRANSFORM"]: "Transform",

    // Animation sections
    ["ANIMATION"]: "Animation",
    ["ANIMATION RANGES"]: "Animation Ranges",
    ["ANIMATIONS"]: "Animation",
    ["ANIMATION GENERAL CONTROL"]: "Animation Control",
    ["CONTROLS"]: "Control",
    ["INFOS"]: "Info",

    // Camera sections
    ["COLLISIONS"]: "Collision",
    ["LIMITS"]: "Limits",
    ["BEHAVIORS"]: "Behaviors",

    // Material sections
    ["TRANSPARENCY"]: "Transparency",
    ["STENCIL"]: "Stencil",
    ["STENCIL - FRONT"]: "Stencil Front",
    ["STENCIL - BACK"]: "Stencil Back",
    ["TEXTURES"]: "Textures",
    ["LIGHTING & COLORS"]: "Lighting & Colors",
    ["LEVELS"]: "Levels",
    ["NORMAL MAP"]: "Normal Map",
    ["RENDERING"]: "Rendering",
    ["CHANNELS"]: "Channels",

    // PBR Material sections
    ["METALLIC WORKFLOW"]: "Metallic Workflow",
    ["CLEAR COAT"]: "Clear Coat",
    ["IRIDESCENCE"]: "Iridescence",
    ["ANISOTROPIC"]: "Anisotropic",
    ["SHEEN"]: "Sheen",
    ["SUBSURFACE"]: "Subsurface",

    // OpenPBR Material sections
    ["BASE"]: "Base",
    ["SPECULAR"]: "Specular",
    ["COAT"]: "Coat",
    ["FUZZ"]: "Fuzz",
    ["EMISSION"]: "Emission",
    ["THIN FILM"]: "Thin Film",
    ["GEOMETRY"]: "Geometry",

    // Sky Material
    ["SKY"]: "Sky",

    // Multi Material
    ["CHILDREN"]: "Children",

    // Mesh sections
    ["DISPLAY"]: "Display",
    ["DISPLAY OPTIONS"]: "Display Options",
    ["NODE GEOMETRY"]: "Node Geometry",
    ["MORPH TARGETS"]: "Morph Targets",
    ["PHYSICS"]: "Physics",
    ["OCCLUSIONS"]: "Occlusions",
    ["EDGE RENDERING"]: "Edge Rendering",
    ["OUTLINE & OVERLAY"]: "Outlines & Overlays",

    // Light sections
    ["SETUP"]: "Setup",
    ["SHADOWS"]: "Shadows",
    ["SHADOW GENERATOR"]: "Shadow Generator",

    // Particle System sections
    ["NODE PARTICLE EDITOR"]: "Node Particle Editor",
    ["FILE"]: "File",
    ["SNIPPET"]: "Snippet",
    ["ATTRACTORS"]: "Attractors",
    ["IMPOSTORS"]: "Impostors",
    ["EMITTER"]: "Emitter",
    ["SIZE"]: "Size",
    ["LIFETIME"]: "Lifetime",
    ["COLORS"]: "Color",
    ["ROTATION"]: "Rotation",
    ["SPRITESHEET"]: "Spritesheet",

    // Sprite sections
    ["CELLS"]: "Cells",
    ["CELL"]: "Cell",
    ["SCALE"]: "Scale",

    // Post Process sections
    ["CONFIGURATION"]: "Configuration",
    ["BLOOM"]: "Bloom",
    ["CHROMATIC ABERRATION"]: "Chromatic Aberration",
    ["DEPTH OF FIELD"]: "Depth of Field",
    ["FXAA"]: "FXAA",
    ["GLOW LAYER"]: "Glow Layer",
    ["GRAIN"]: "Grain",
    ["IMAGE PROCESSING"]: "Image Processing",
    ["SHARPEN"]: "Sharpen",
    ["OPTIONS"]: "Options",
    ["SSAO"]: "SSAO",
    ["Denoiser"]: "Denoiser",
    ["SSR"]: "SSR",
    ["Voxel Shadows"]: "Voxel Shadows",
    ["Screenspace Shadows"]: "Screenspace Shadows",
    ["Automatic thickness computation"]: "Automatic Thickness Computation",
    ["Blur"]: "Blur",
    ["Attenuations"]: "Attenuations",
    ["Color space"]: "Color Space",

    // Scene sections
    ["RENDERING MODE"]: "Rendering",
    ["ENVIRONMENT"]: "Environment",
    ["MATERIAL IMAGE PROCESSING"]: "Material Image Processing",

    // Texture sections
    ["PREVIEW"]: "Preview",
    ["ADVANCED TEXTURE PROPERTIES"]: "Advanced Texture Properties",

    // Frame Graph sections
    ["TASKS"]: "Tasks",

    // Metadata
    ["METADATA"]: "Metadata",
    ["XMP METADATA"]: "XMP Metadata",

    // Variants
    ["VARIANTS"]: "Variants",

    // Node Material
    ["INPUTS"]: "Inputs",
} as const;
