#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Node Particle MCP Server (babylonjs-node-particle)
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Node Particle System Sets programmatically.  An AI agent (or any MCP client) can:
 *
 *   • Create / manage particle system graphs
 *   • Add blocks from the full NPE block catalog
 *   • Connect blocks together
 *   • Set block properties (contextual sources, system sources, operations, etc.)
 *   • Validate the graph
 *   • Export the final particle JSON (loadable by NPE / NodeParticleSystemSet.Parse)
 *   • Import existing NPE JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio  (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import {
    CreateInlineJsonSchema,
    CreateJsonFileSchema,
    CreateJsonImportResponse,
    CreateOutputFileSchema,
    CreateSnippetIdSchema,
    CreateTypedSnippetImportResponse,
    McpEditorSessionController,
    ParseJsonText,
    RunSnippetResponse,
    WriteTextFileEnsuringDirectory,
} from "@tools/mcp-server-core";

import { BlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { ParticleGraphManager } from "./particleGraph.js";
import { LoadSnippet, SaveSnippet, type IDataSnippetResult } from "@tools/snippet-loader";

// ─── Singleton graph manager ──────────────────────────────────────────────
const manager = new ParticleGraphManager();
const sessionController = new McpEditorSessionController<ParticleGraphManager>(
    {
        serverName: "NPE MCP Session Server",
        documentKind: "node-particle",
        managerUnavailableMessage: "Particle graph manager is not available",
        getDocument: (manager, session) => manager.exportJSON(session.name),
        setDocument: (manager, session, document) => {
            const result = manager.importJSON(session.name, document);
            return result && result !== "OK" ? result : undefined;
        },
    },
    {
        defaultPort: 3001,
        statusTitle: "NPE MCP Session Server",
    }
);

/**
 * Notify SSE subscribers if a session exists for the given particle system set.
 * @param particleSystemName - The particle system set name to check for active sessions.
 */
function _notifyIfSession(particleSystemName: string): void {
    const sessionId = sessionController.getSessionIdForName(particleSystemName);
    if (sessionId) {
        sessionController.notifySessionUpdate(sessionId);
    }
}

/**
 * Import particle system JSON and notify a matching live session on success.
 * @param particleSystemName - The particle system set name to import into.
 * @param jsonText - Serialized NPE JSON.
 * @returns "OK" on success, or an error string.
 */
function _importParticleSystemJson(particleSystemName: string, jsonText: string): string {
    const result = manager.importJSON(particleSystemName, jsonText);
    if (result === "OK") {
        _notifyIfSession(particleSystemName);
    }
    return result;
}

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-node-particle",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build Babylon.js Node Particle System Sets via particle graphs. Workflow: create_particle_system → add blocks (ParticleInputBlock sources, shape blocks, CreateParticleBlock, update blocks, SystemBlock) → connect ports → validate_particle_system → export_particle_system_json.",
            "Every particle graph needs at least one SystemBlock. Use get_block_type_info to discover ports before connecting.",
            "Output JSON can be consumed by the Scene MCP to add particle effects.",
        ].join(" "),
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("block-catalog", "npe://block-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# NPE Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.registerResource("enums", "npe://enums", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# NPE Enumerations Reference",
                "",
                "## NodeParticleBlockConnectionPointTypes",
                "Int (0x01), Float (0x02), Vector2 (0x04), Vector3 (0x08), Matrix (0x10), " +
                    "Particle (0x20), Texture (0x40), Color4 (0x80), FloatGradient (0x100), " +
                    "Vector2Gradient (0x200), Vector3Gradient (0x400), Color4Gradient (0x800), " +
                    "System (0x1000), AutoDetect (0x2000), BasedOnInput (0x4000), Undefined (0x8000)",
                "",
                "## NodeParticleContextualSources (for ParticleInputBlock)",
                "None (0x0000), Position (0x0001), Direction (0x0002), Age (0x0003), Lifetime (0x0004), " +
                    "Color (0x0005), ScaledDirection (0x0006), Scale (0x0007), AgeGradient (0x0008), " +
                    "Angle (0x0009), SpriteCellIndex (0x0010), SpriteCellStart (0x0011), " +
                    "SpriteCellEnd (0x0012), InitialColor (0x0013), ColorDead (0x0014), " +
                    "InitialDirection (0x0015), ColorStep (0x0016), ScaledColorStep (0x0017), " +
                    "LocalPositionUpdated (0x0018), Size (0x0019), DirectionScale (0x0020)",
                "",
                "## NodeParticleSystemSources (for ParticleInputBlock)",
                "None (0), Time (1), Delta (2), Emitter (3), CameraPosition (4)",
                "",
                "## ParticleMathBlockOperations (for ParticleMathBlock)",
                "Add (0), Subtract (1), Multiply (2), Divide (3), Max (4), Min (5)",
                "",
                "## ParticleTrigonometryBlockOperations (for ParticleTrigonometryBlock)",
                "Cos (0), Sin (1), Abs (2), Exp (3), Exp2 (4), Round (5), Floor (6), Ceiling (7), " +
                    "Sqrt (8), Log (9), Tan (10), ArcTan (11), ArcCos (12), ArcSin (13), Sign (14), " +
                    "Negate (15), OneMinus (16), Reciprocal (17), ToDegrees (18), ToRadians (19), Fract (20)",
                "",
                "## ParticleConditionBlockTests (for ParticleConditionBlock)",
                "Equal (0), NotEqual (1), LessThan (2), GreaterThan (3), LessOrEqual (4), " + "GreaterOrEqual (5), Xor (6), Or (7), And (8)",
                "",
                "## ParticleNumberMathBlockOperations (for ParticleNumberMathBlock)",
                "Modulo (0), Pow (1)",
                "",
                "## ParticleVectorMathBlockOperations (for ParticleVectorMathBlock)",
                "Dot (0), Distance (1)",
                "",
                "## ParticleFloatToIntBlockOperations (for ParticleFloatToIntBlock)",
                "Round (0), Ceil (1), Floor (2), Truncate (3)",
                "",
                "## ParticleRandomBlockLocks (for ParticleRandomBlock)",
                "None (0), PerParticle (1), PerSystem (2), OncePerParticle (3)",
                "",
                "## ParticleLocalVariableBlockScope (for ParticleLocalVariableBlock)",
                "Particle (0), Loop (1)",
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "npe://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Node Particle System Concepts",
                "",
                "## What is a Node Particle System Set?",
                "A Node Particle System Set is a visual, graph-based particle effect builder in Babylon.js.",
                "Instead of configuring particle systems from code, you connect typed blocks that represent",
                "particle operations. The graph evaluates at runtime to produce one or more ParticleSystems.",
                "",
                "## Graph Structure — SystemBlock (One or More)",
                "Every Node Particle graph MUST have at least one SystemBlock.",
                "  • **SystemBlock** — receives the final System connection and produces a particle system",
                "Unlike NGE (which has a single GeometryOutputBlock), NPE supports MULTIPLE SystemBlocks,",
                "each producing a separate particle system in the set.",
                "",
                "## ParticleInputBlock — Contextual Sources, System Sources & Constants",
                "ParticleInputBlock is the source of all external data entering the graph. It has three modes:",
                "",
                "### Mode 1: Contextual Source (per-particle data)",
                "Reads per-particle attributes from the active particle system.",
                "  • Set `contextualValue` to one of: Position, Direction, Age, Lifetime, Color,",
                "    ScaledDirection, Scale, AgeGradient, Angle, SpriteCellIndex, SpriteCellStart,",
                "    SpriteCellEnd, InitialColor, ColorDead, InitialDirection, ColorStep,",
                "    ScaledColorStep, LocalPositionUpdated, Size, DirectionScale",
                "  • The `type` is automatically derived from the contextual source:",
                "    - Position/Direction/ScaledDirection/InitialDirection/LocalPositionUpdated → Vector3",
                "    - Scale → Vector2",
                "    - Color/InitialColor/ColorDead/ColorStep/ScaledColorStep → Color4",
                "    - Age/Lifetime/Angle/AgeGradient/Size/DirectionScale → Float",
                "    - SpriteCellIndex/SpriteCellStart/SpriteCellEnd → Int",
                "",
                "### Mode 2: System Source (per-system data)",
                "Reads system-level attributes.",
                "  • Set `systemSource` to one of: Time, Delta, Emitter, CameraPosition",
                "  • The `type` is automatically derived from the system source:",
                "    - Time/Delta → Float",
                "    - Emitter/CameraPosition → Vector3",
                "",
                "### Mode 3: Constant Value",
                "Provides a fixed value of a specific type.",
                "  • Set `type` to: Int, Float, Vector2, Vector3, Color4, Matrix",
                "  • Set `value` to the constant (number, or {x,y}, {x,y,z}, {r,g,b,a}, or flat array)",
                "",
                "## Particle Lifecycle",
                "",
                "### 1. Shape — Where particles spawn",
                "Shape blocks define the emission volume: BoxShapeBlock, SphereShapeBlock, ConeShapeBlock,",
                "CylinderShapeBlock, PointShapeBlock, CustomShapeBlock, MeshShapeBlock.",
                "Connect CreateParticleBlock.particle output to a shape block's 'particle' input.",
                "The shape block positions the particle and outputs it on 'output'.",
                "",
                "### 2. Create — Birth a particle",
                "CreateParticleBlock receives optional initial parameters (emitPower, lifeTime, color, colorDead, scale, angle, size).",
                "It outputs a newly born Particle that flows into a shape block, then update blocks.",
                "",
                "### 3. Update — Per-frame particle mutation",
                "Update blocks modify particle properties each frame:",
                "  • UpdatePositionBlock, UpdateDirectionBlock, UpdateColorBlock, UpdateScaleBlock,",
                "    UpdateSizeBlock, UpdateAngleBlock, UpdateAgeBlock",
                "  • BasicPositionUpdateBlock, BasicColorUpdateBlock, BasicSpriteUpdateBlock",
                "  • UpdateFlowMapBlock, UpdateNoiseBlock, UpdateAttractorBlock, AlignAngleBlock",
                "Each update block takes a Particle in and outputs a Particle out.",
                "Chain them: Shape.output → UpdateAge.particle → UpdateAge.output → UpdatePosition → ... → SystemBlock.particle",
                "",
                "### 4. System — Output",
                "SystemBlock receives the final Particle stream and produces a ParticleSystem.",
                "",
                "## The Simplest Particle Graph",
                "```",
                "ParticleInputBlock(type:'Float', value:2) \u2192 CreateParticleBlock.lifeTime",
                "CreateParticleBlock.particle \u2192 BoxShapeBlock.particle",
                "BoxShapeBlock.output \u2192 UpdateAgeBlock.particle",
                "ParticleInputBlock(contextualValue:'Age') → UpdateAgeBlock.age",
                "UpdateAgeBlock.output → SystemBlock.particle",
                "ParticleTextureSourceBlock.texture → SystemBlock.texture",
                "```",
                "",
                "## ParticleTextureSourceBlock — Must Set url Property",
                "A ParticleTextureSourceBlock MUST have a `url` property set, otherwise the particle system renders empty.",
                "Use add_block with properties: { url: 'https://assets.babylonjs.com/textures/flare.png' } (default particle sprite).",
                "",
                "## ParticleConverterBlock — Important: Trailing-Space Input Names",
                "ParticleConverterBlock input port names have a TRAILING SPACE to disambiguate from outputs:",
                "  Inputs:  'color ' (Color4), 'xyz ' (Vector3), 'xy ' (Vector2),",
                "           'x ' (Float), 'y ' (Float), 'z ' (Float), 'w ' (Float)",
                "  Outputs: 'color'  (Color4), 'xyz'   (Vector3), 'xy'   (Vector2),",
                "           'x'    (Float),  'y'    (Float),  'z'    (Float),  'w'    (Float)",
                "When calling connect_blocks to a ParticleConverterBlock INPUT, you MUST include the trailing space.",
                "",
                "## Gravity / Deceleration Pattern",
                "BasicPositionUpdateBlock does NOT apply gravity or drag — it simply adds scaledDirection to position.",
                "To make particles decelerate or fall, wire a gravity vector into the direction update chain:",
                "```",
                "ParticleInputBlock(type:'Vector3', value:{x:0,y:-9.81,z:0})  [Gravity]",
                "ParticleInputBlock(systemSource:'Delta')                     [DeltaTime]",
                "ParticleMathBlock(operation:'Multiply') ← Gravity + DeltaTime  → gravityDelta",
                "ParticleInputBlock(contextualValue:'Direction')              [CurrentDir]",
                "ParticleMathBlock(operation:'Add') ← CurrentDir + gravityDelta → newDir",
                "UpdateDirectionBlock ← particle + newDir",
                "BasicPositionUpdateBlock ← UpdateDirectionBlock.output",
                "```",
                "This modifies the particle's direction each frame so it arcs downward (or in any direction).",
                "For drag/damping, multiply direction by a factor < 1 each frame instead of adding gravity.",
                "",
                "## Runtime Usage — buildAsync & Manual Emit",
                "After designing a graph with the NPE MCP and exporting JSON, load it at runtime like this:",
                "```typescript",
                "const set = NodeParticleSystemSet.Parse(jsonObject);",
                "const result: ParticleSystemSet = await set.buildAsync(scene);",
                "// result.systems is an IParticleSystem[] — each system is named from its SystemBlock",
                "const sparks = result.systems.find(s => s.name === 'SparkSystem');",
                "sparks.manualEmitCount = 10;  // triggers a burst of 10 particles",
                "```",
                "- Setting `doNoStart: true` on a SystemBlock makes `system.canStart()` return false",
                "  (the system won't auto-start on build). Call `system.start()` manually when ready.",
                "- `manualEmitCount` is a write-on-demand property: set it to N > 0, and the next update",
                "  frame emits exactly N particles, then resets to 0.",
                "- To modify colors/values at runtime, access input blocks BEFORE building:",
                "  `set.getBlockByName('MyColor').value = new Color4(1,0,0,1);` then rebuild.",
                "",
                "## Common Mistakes",
                "1. Forgetting SystemBlock → no particle system is produced",
                "2. Creating ParticleInputBlock without contextualValue, systemSource, or value → no data",
                "3. Not connecting CreateParticleBlock.particle to a shape block → particles have nowhere to spawn",
                "4. Not chaining update blocks → particles don't age or move",
                "5. Omitting trailing space on ParticleConverterBlock inputs",
                "6. Not connecting a ParticleInputBlock(contextualValue:'Age') to UpdateAgeBlock.age → REQUIRED input",
                "7. Not connecting a ParticleTextureSourceBlock to SystemBlock.texture → REQUIRED input",
                "8. UpdateAgeBlock.age and SystemBlock.texture are REQUIRED — the graph will fail to build without them",
                "9. Using BasicPositionUpdateBlock expecting gravity — it has none; use the gravity pattern above",
                "10. Trying to change colors on built systems won't work — modify input blocks before buildAsync()",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("create-basic-particle-system", { description: "Step-by-step instructions for building a simple box-shaped particle system" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a simple particle system that emits from a box shape. Steps:",
                    "1. create_particle_system with name 'BasicParticles'",
                    "2. Add CreateParticleBlock named 'create'",
                    "3. Add BoxShapeBlock named 'shape'",
                    "4. Add ParticleInputBlock named 'lifetime' with type 'Float', value 2",
                    "5. Connect lifetime.output → create.lifeTime",
                    "6. Connect create.particle → shape.particle",
                    "7. Add UpdateAgeBlock named 'updateAge'",
                    "8. Connect shape.output → updateAge.particle",
                    "9. Add ParticleInputBlock named 'ageInput' with contextualValue 'Age'",
                    "10. Connect ageInput.output → updateAge.age",
                    "11. Add BasicPositionUpdateBlock named 'updatePos'",
                    "12. Connect updateAge.output → updatePos.particle",
                    "13. Add ParticleTextureSourceBlock named 'texture' with url 'https://assets.babylonjs.com/textures/flare.png'",
                    "14. Add SystemBlock named 'system'",
                    "15. Connect texture.texture → system.texture",
                    "16. Connect updatePos.output → system.particle",
                    "17. validate_particle_system, then export_particle_system_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-colored-particle-system", { description: "Step-by-step instructions for creating a particle system with color fading" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a particle system with color that fades from white to transparent. Steps:",
                    "1. create_particle_system with name 'ColoredParticles'",
                    "2. Add CreateParticleBlock named 'create'",
                    "3. Add SphereShapeBlock named 'shape'",
                    "4. Add ParticleInputBlock named 'lifetime' with type 'Float', value 3",
                    "5. Connect lifetime.output → create.lifeTime",
                    "6. Add ParticleInputBlock named 'startColor' with type 'Color4', value {r:1,g:1,b:1,a:1}",
                    "7. Connect startColor.output → create.color",
                    "8. Connect create.particle → shape.particle",
                    "9. Add UpdateAgeBlock named 'updateAge'",
                    "10. Connect shape.output → updateAge.particle",
                    "11. Add ParticleInputBlock named 'ageInput' with contextualValue 'Age'",
                    "12. Connect ageInput.output → updateAge.age",
                    "13. Add BasicPositionUpdateBlock named 'updatePos'",
                    "14. Connect updateAge.output → updatePos.particle",
                    "15. Add UpdateColorBlock named 'updateColor'",
                    "16. Connect updatePos.output → updateColor.particle",
                    "17. Add ParticleInputBlock named 'endColor' with type 'Color4', value {r:1,g:1,b:1,a:0}",
                    "18. Connect endColor.output → updateColor.color",
                    "19. Add ParticleTextureSourceBlock named 'texture' with url 'https://assets.babylonjs.com/textures/flare.png'",
                    "20. Add SystemBlock named 'system'",
                    "21. Connect texture.texture → system.texture",
                    "22. Connect updateColor.output → system.particle",
                    "23. validate_particle_system, then export_particle_system_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-cone-fountain", { description: "Step-by-step instructions for creating a fountain effect with a cone emitter" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a fountain-like particle effect using a cone emitter. Steps:",
                    "1. create_particle_system with name 'Fountain'",
                    "2. Add CreateParticleBlock named 'create'",
                    "3. Add ConeShapeBlock named 'cone'",
                    "4. Add ParticleInputBlock named 'lifetime' with type 'Float', value 4",
                    "5. Connect lifetime.output → create.lifeTime",
                    "6. Add ParticleInputBlock named 'scale' with type 'Vector2', value {x:0.1,y:0.1}",
                    "7. Connect scale.output → create.scale",
                    "8. Connect create.particle → cone.particle",
                    "9. Add UpdateAgeBlock named 'updateAge'",
                    "10. Connect cone.output → updateAge.particle",
                    "11. Add ParticleInputBlock named 'ageInput' with contextualValue 'Age'",
                    "12. Connect ageInput.output → updateAge.age",
                    "13. Add BasicPositionUpdateBlock named 'updatePos'",
                    "14. Connect updateAge.output → updatePos.particle",
                    "15. Add ParticleTextureSourceBlock named 'texture' with url 'https://assets.babylonjs.com/textures/flare.png'",
                    "16. Add SystemBlock named 'system'",
                    "17. Connect texture.texture → system.texture",
                    "18. Connect updatePos.output → system.particle",
                    "19. validate_particle_system, then export_particle_system_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-gravity-fountain", { description: "Step-by-step instructions for creating a fountain with gravity (particles shoot up and fall back down)" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a fountain that shoots particles upward and lets gravity pull them down. Steps:",
                    "1. create_particle_system with name 'GravityFountain'",
                    "2. Add CreateParticleBlock named 'create'",
                    "3. Add ParticleInputBlock named 'lifetime' with type 'Float', value 3",
                    "4. Connect lifetime.output → create.lifeTime",
                    "5. Add ParticleInputBlock named 'emitPower' with type 'Float', value 8",
                    "6. Connect emitPower.output → create.emitPower",
                    "7. Add ConeShapeBlock named 'cone'",
                    "8. Connect create.particle → cone.particle",
                    "9. Add UpdateAgeBlock named 'updateAge'",
                    "10. Connect cone.output → updateAge.particle",
                    "11. Add ParticleInputBlock named 'ageInput' with contextualValue 'Age'",
                    "12. Connect ageInput.output → updateAge.age",
                    "--- Gravity direction update ---",
                    "13. Add ParticleInputBlock named 'gravity' with type 'Vector3', value {x:0,y:-9.81,z:0}",
                    "14. Add ParticleInputBlock named 'deltaTime' with systemSource 'Delta'",
                    "15. Add ParticleMathBlock named 'gravityDelta' with operation 'Multiply'",
                    "16. Connect gravity.output → gravityDelta.left",
                    "17. Connect deltaTime.output → gravityDelta.right",
                    "18. Add ParticleInputBlock named 'currentDir' with contextualValue 'Direction'",
                    "19. Add ParticleMathBlock named 'addGravity' with operation 'Add'",
                    "20. Connect currentDir.output → addGravity.left",
                    "21. Connect gravityDelta.output → addGravity.right",
                    "22. Add UpdateDirectionBlock named 'updateDir'",
                    "23. Connect updateAge.output → updateDir.particle",
                    "24. Connect addGravity.output → updateDir.direction",
                    "--- Position update ---",
                    "25. Add BasicPositionUpdateBlock named 'updatePos'",
                    "26. Connect updateDir.output → updatePos.particle",
                    "--- System ---",
                    "27. Add ParticleTextureSourceBlock named 'texture' with url 'https://assets.babylonjs.com/textures/flare.png'",
                    "28. Add SystemBlock named 'system'",
                    "29. Connect texture.texture → system.texture",
                    "30. Connect updatePos.output → system.particle",
                    "31. validate_particle_system, then export_particle_system_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-burst-system", { description: "Step-by-step instructions for creating a burst particle system with doNoStart and manualEmitCount" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a burst particle system that does NOT auto-start and is triggered manually. Steps:",
                    "1. create_particle_system with name 'BurstEffect'",
                    "2. Add CreateParticleBlock named 'create'",
                    "3. Add ParticleInputBlock named 'lifetime' with type 'Float', value 1.5",
                    "4. Connect lifetime.output → create.lifeTime",
                    "5. Add ParticleInputBlock named 'emitPower' with type 'Float', value 5",
                    "6. Connect emitPower.output → create.emitPower",
                    "7. Add SphereShapeBlock named 'shape'",
                    "8. Connect create.particle → shape.particle",
                    "9. Add UpdateAgeBlock named 'updateAge'",
                    "10. Connect shape.output → updateAge.particle",
                    "11. Add ParticleInputBlock named 'ageInput' with contextualValue 'Age'",
                    "12. Connect ageInput.output → updateAge.age",
                    "13. Add BasicPositionUpdateBlock named 'updatePos'",
                    "14. Connect updateAge.output → updatePos.particle",
                    "15. Add ParticleTextureSourceBlock named 'texture' with url 'https://assets.babylonjs.com/textures/flare.png'",
                    "16. Add SystemBlock named 'BurstSystem' with properties: { doNoStart: true, manualEmitCount: -1, capacity: 500 }",
                    "17. Connect texture.texture → BurstSystem.texture",
                    "18. Connect updatePos.output → BurstSystem.particle",
                    "19. validate_particle_system, then export_particle_system_json",
                    "",
                    "Runtime usage:",
                    "  const set = NodeParticleSystemSet.Parse(json);",
                    "  const result = await set.buildAsync(scene);",
                    "  const burst = result.systems.find(s => s.name === 'BurstSystem');",
                    "  // Trigger a burst of 20 particles on demand:",
                    "  burst.start();  // needed once since doNoStart prevents auto-start",
                    "  burst.manualEmitCount = 20;",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Particle system lifecycle ──────────────────────────────────────────

server.registerTool(
    "create_particle_system",
    {
        description: "Create a new empty Node Particle System Set graph in memory. This is always the first step.",
        inputSchema: {
            name: z.string().describe("Unique name for the particle system set (e.g. 'FireEffect', 'SnowStorm')"),
            comment: z.string().optional().describe("An optional description of what this particle system does"),
        },
    },
    async ({ name, comment }) => {
        manager.createParticleSet(name, comment);
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(name);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return {
            content: [
                {
                    type: "text",
                    text: `Created particle system set "${name}". Now add blocks with add_block, connect them with connect_blocks, then export with export_particle_system_json.\n\nMCP Session URL: ${sessionUrl}`,
                },
            ],
        };
    }
);

server.registerTool(
    "get_session_url",
    {
        description: "Get or create a live-session URL for a particle system set. The URL can be pasted into a compatible Node Particle Editor MCP session panel.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
        },
    },
    async ({ particleSystemName }) => {
        const particleSystems = manager.listParticleSets();
        if (!particleSystems.includes(particleSystemName)) {
            return { content: [{ type: "text", text: `Particle system set "${particleSystemName}" not found.` }], isError: true };
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(particleSystemName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return { content: [{ type: "text", text: `MCP Session URL: ${sessionUrl}` }] };
    }
);

server.registerTool(
    "start_session",
    {
        description: "Start a live session for an existing particle system set. If a session already exists for this particle system set, returns the existing URL.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
        },
    },
    async ({ particleSystemName }) => {
        const particleSystems = manager.listParticleSets();
        if (!particleSystems.includes(particleSystemName)) {
            return { content: [{ type: "text", text: `Particle system set "${particleSystemName}" not found.` }], isError: true };
        }
        const port = await sessionController.startAsync(manager);
        const sessionId = sessionController.createSession(particleSystemName);
        const sessionUrl = sessionController.getSessionUrl(sessionId, port);
        return { content: [{ type: "text", text: `MCP Session URL: ${sessionUrl}` }] };
    }
);

server.registerTool(
    "close_session",
    {
        description:
            "Close a live session for a particle system set. Disconnects all SSE subscribers in the editor and removes the session. The particle system set itself is NOT deleted.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set whose session to close"),
        },
    },
    async ({ particleSystemName }) => {
        const closed = sessionController.closeSessionForName(particleSystemName);
        if (!closed) {
            return { content: [{ type: "text", text: `No active session for "${particleSystemName}".` }] };
        }
        return { content: [{ type: "text", text: `Session for "${particleSystemName}" closed. The editor will disconnect.` }] };
    }
);

server.registerTool(
    "stop_session_server",
    {
        description: "Stop the live MCP editor session server started by this MCP process. This closes all active sessions, disconnects editors, and releases the port.",
    },
    async () => {
        await sessionController.stopAsync();
        return { content: [{ type: "text", text: "MCP session server stopped. Any connected editors have been disconnected." }] };
    }
);

server.registerTool(
    "delete_particle_system",
    {
        description: "Delete a particle system set graph from memory.",
        inputSchema: {
            name: z.string().describe("Name of the particle system set to delete"),
        },
    },
    async ({ name }) => {
        sessionController.closeSessionForName(name);
        const ok = manager.deleteParticleSet(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Particle system set "${name}" not found.` }],
        };
    }
);

server.registerTool("clear_all", { description: "Remove all particle system sets from memory, resetting the server to a clean state." }, async () => {
    const names = manager.listParticleSets();
    for (const name of names) {
        sessionController.closeSessionForName(name);
    }
    manager.clearAll();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Cleared ${names.length} particle system set(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty.",
            },
        ],
    };
});

server.registerTool("list_particle_systems", { description: "List all particle system set graphs currently in memory." }, async () => {
    const names = manager.listParticleSets();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Particle system sets in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No particle system sets in memory.",
            },
        ],
    };
});

// ── Block operations ────────────────────────────────────────────────────

server.registerTool(
    "add_block",
    {
        description: "Add a new block to a particle system graph. Returns the block's id for use in connect_blocks.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set to add the block to"),
            blockType: z
                .string()
                .describe(
                    "The block type from the registry (e.g. 'SystemBlock', 'ParticleInputBlock', 'CreateParticleBlock', " +
                        "'BoxShapeBlock', 'UpdateAgeBlock', etc.). Use list_block_types to see all."
                ),
            name: z.string().optional().describe("Human-friendly name for this block instance (e.g. 'mySystem', 'ageInput')"),
            properties: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Key-value properties to set on the block. For ParticleInputBlock: type (Int/Float/Vector2/Vector3/Color4/Matrix), " +
                        "contextualValue (None/Position/Direction/Age/Lifetime/Color/etc.), systemSource (None/Time/Delta/Emitter/CameraPosition), " +
                        "value (the constant value), min/max (number). " +
                        "For ParticleMathBlock: operation (Add/Subtract/Multiply/Divide/Max/Min). " +
                        "For ParticleTrigonometryBlock: operation (Cos/Sin/Abs/Exp/.../Fract). " +
                        "For ParticleConditionBlock: test (Equal/NotEqual/LessThan/.../And). " +
                        "For ParticleRandomBlock: lockMode (None/PerParticle/PerSystem/OncePerParticle)."
                ),
        },
    },
    async ({ particleSystemName, blockType, name, properties }) => {
        const result = manager.addBlock(particleSystemName, blockType, name, properties as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        _notifyIfSession(particleSystemName);
        const lines = [`Added block [${result.block.id}] "${result.block.name}" (${blockType}). Use this id (${result.block.id}) to connect it.`];
        if (result.warnings) {
            lines.push("", "Warnings:", ...result.warnings);
        }
        return {
            content: [
                {
                    type: "text",
                    text: lines.join("\n"),
                },
            ],
        };
    }
);

server.registerTool(
    "add_blocks_batch",
    {
        description: "Add multiple blocks at once. More efficient than calling add_block repeatedly. Returns all created block ids.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            blocks: z
                .array(
                    z.object({
                        blockType: z.string().describe("Block type name"),
                        blockName: z.string().optional().describe("Instance name for the block"),
                        name: z.string().optional().describe("Instance name (alias for blockName)"),
                        properties: z.record(z.string(), z.unknown()).optional().describe("Block properties"),
                    })
                )
                .describe("Array of blocks to add"),
        },
    },
    async ({ particleSystemName, blocks }) => {
        const results: string[] = [];
        let hasSuccess = false;
        for (const blockDef of blocks) {
            const bName = blockDef.blockName ?? blockDef.name;
            const result = manager.addBlock(particleSystemName, blockDef.blockType, bName, blockDef.properties as Record<string, unknown>);
            if (typeof result === "string") {
                results.push(`Error adding ${blockDef.blockType}: ${result}`);
            } else {
                hasSuccess = true;
                let line = `[${result.block.id}] ${result.block.name} (${blockDef.blockType})`;
                if (result.warnings) {
                    line += `\n  ⚠ ${result.warnings.join("\n  ⚠ ")}`;
                }
                results.push(line);
            }
        }
        if (hasSuccess) {
            _notifyIfSession(particleSystemName);
        }
        return { content: [{ type: "text", text: `Added blocks:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "remove_block",
    {
        description: "Remove a block from a particle system graph. Also removes any connections to/from it.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            blockId: z.number().describe("The block id to remove"),
        },
    },
    async ({ particleSystemName, blockId }) => {
        const result = manager.removeBlock(particleSystemName, blockId);
        if (result === "OK") {
            _notifyIfSession(particleSystemName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_block_properties",
    {
        description: "Set or update properties on an existing block (e.g. change a ParticleInputBlock value, set a ParticleMathBlock operation).",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            blockId: z.number().describe("The block id to modify"),
            properties: z.record(z.string(), z.unknown()).describe("Key-value properties to set. Same keys as add_block's properties parameter."),
        },
    },
    async ({ particleSystemName, blockId, properties }) => {
        const result = manager.setBlockProperties(particleSystemName, blockId, properties as Record<string, unknown>);
        if (result === "OK") {
            _notifyIfSession(particleSystemName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Connections ──────────────────────────────────────────────────────────

server.registerTool(
    "connect_blocks",
    {
        description: "Connect an output of one block to an input of another block. Data flows from source output → target input.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            sourceBlockId: z.number().describe("Block id to connect FROM (the one with the output)"),
            outputName: z.string().describe("Name of the output on the source block (e.g. 'output', 'shape', 'particle')"),
            targetBlockId: z.number().describe("Block id to connect TO (the one with the input)"),
            inputName: z.string().describe("Name of the input on the target block (e.g. 'particle', 'system', 'shape')"),
        },
    },
    async ({ particleSystemName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectBlocks(particleSystemName, sourceBlockId, outputName, targetBlockId, inputName);
        if (result === "OK") {
            _notifyIfSession(particleSystemName);
        }
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Connected [${sourceBlockId}].${outputName} → [${targetBlockId}].${inputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "connect_blocks_batch",
    {
        description: "Connect multiple block pairs at once. More efficient than calling connect_blocks repeatedly.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number(),
                        outputName: z.string(),
                        targetBlockId: z.number(),
                        inputName: z.string(),
                    })
                )
                .describe("Array of connections to make"),
        },
    },
    async ({ particleSystemName, connections }) => {
        const results: string[] = [];
        let hasSuccess = false;
        for (const conn of connections) {
            const result = manager.connectBlocks(particleSystemName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            if (result === "OK") {
                hasSuccess = true;
                results.push(`[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}`);
            } else {
                results.push(`Error: ${result}`);
            }
        }
        if (hasSuccess) {
            _notifyIfSession(particleSystemName);
        }
        return { content: [{ type: "text", text: `Connections:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "disconnect_input",
    {
        description: "Disconnect an input on a block (remove an existing connection).",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            blockId: z.number().describe("The block id whose input to disconnect"),
            inputName: z.string().describe("Name of the input to disconnect"),
        },
    },
    async ({ particleSystemName, blockId, inputName }) => {
        const result = manager.disconnectInput(particleSystemName, blockId, inputName);
        if (result === "OK") {
            _notifyIfSession(particleSystemName);
        }
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected [${blockId}].${inputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.registerTool(
    "describe_particle_system",
    {
        description: "Get a human-readable description of the current state of a particle system graph, " + "including all blocks and their connections.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set to describe"),
        },
    },
    async ({ particleSystemName }) => {
        const desc = manager.describeParticleSet(particleSystemName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "describe_block",
    {
        description: "Get detailed information about a specific block instance in a particle system, including its connections and properties.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
            blockId: z.number().describe("The block id to describe"),
        },
    },
    async ({ particleSystemName, blockId }) => {
        const desc = manager.describeBlock(particleSystemName, blockId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "list_block_types",
    {
        description: "List all available NPE block types, grouped by category. Use this to discover which blocks you can add.",
        inputSchema: {
            category: z
                .string()
                .optional()
                .describe(
                    "Optionally filter by category (Input, System, Texture, Shape, Setup, Update, Trigger, Math, Condition, " + "Interpolation, Misc, Converter, Utility, Teleport)"
                ),
        },
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(BlockRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key}: ${info.description.split(".")[0]}`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: matching.length > 0 ? `## ${category} Blocks\n${matching}` : `No blocks found in category "${category}".`,
                    },
                ],
            };
        }
        return { content: [{ type: "text", text: GetBlockCatalogSummary() }] };
    }
);

server.registerTool(
    "get_block_type_info",
    {
        description: "Get detailed info about a specific block type — its inputs, outputs, properties, and description.",
        inputSchema: {
            blockType: z.string().describe("The block type name (e.g. 'SystemBlock', 'ParticleInputBlock', 'CreateParticleBlock')"),
        },
    },
    async ({ blockType }) => {
        const info = GetBlockTypeDetails(blockType);
        if (!info) {
            return {
                content: [{ type: "text", text: `Block type "${blockType}" not found. Use list_block_types to see available types.` }],
                isError: true,
            };
        }

        const lines: string[] = [];
        lines.push(`## ${blockType}`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Inputs:");
        if (info.inputs.length === 0) {
            lines.push("  (none)");
        }
        for (const inp of info.inputs) {
            const opt = inp.isOptional ? " (optional)" : " (required)";
            lines.push(`  • ${inp.name}: ${inp.type}${opt}`);
        }

        lines.push("\n### Outputs:");
        if (info.outputs.length === 0) {
            lines.push("  (none)");
        }
        for (const out of info.outputs) {
            lines.push(`  • ${out.name}: ${out.type}`);
        }

        if (info.properties) {
            lines.push("\n### Configurable Properties:");
            for (const [k, v] of Object.entries(info.properties)) {
                lines.push(`  • ${k}: ${v}`);
            }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Validation ──────────────────────────────────────────────────────────

server.registerTool(
    "validate_particle_system",
    {
        description: "Run validation checks on a particle system graph. Reports missing SystemBlock, unconnected required inputs, and broken references.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set to validate"),
        },
    },
    async ({ particleSystemName }) => {
        const issues = manager.validateParticleSet(particleSystemName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ─────────────────────────────────────────────────────

server.registerTool(
    "export_particle_system_json",
    {
        description:
            "Export the particle system graph as NPE-compatible JSON. This JSON can be loaded in the Babylon.js Node Particle Editor " +
            "or via NodeParticleSystemSet.Parse() at runtime. " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned " +
            "(avoids large JSON payloads in the conversation context).",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set to export"),
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ particleSystemName, outputFile }) => {
        const json = manager.exportJSON(particleSystemName);
        if (!json) {
            return { content: [{ type: "text", text: `Particle system set "${particleSystemName}" not found.` }], isError: true };
        }
        if (outputFile) {
            try {
                WriteTextFileEnsuringDirectory(outputFile, json);
                return { content: [{ type: "text", text: `NPE JSON written to: ${outputFile}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }], isError: true };
            }
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.registerTool(
    "import_particle_system_json",
    {
        description:
            "Import an existing NPE JSON into memory for editing. You can then modify blocks, connections, etc. " +
            "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            particleSystemName: z.string().describe("Name to give the imported particle system set"),
            json: CreateInlineJsonSchema(z, "The NPE JSON string to import"),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a file containing the NPE JSON to import (alternative to inline json)"),
        },
    },
    async ({ particleSystemName, json, jsonFile }) => {
        return CreateJsonImportResponse({
            json,
            jsonFile,
            fileDescription: "NPE JSON file",
            importJson: (jsonText: string) => _importParticleSystemJson(particleSystemName, jsonText),
            describeImported: () => manager.describeParticleSet(particleSystemName),
        });
    }
);

server.registerTool(
    "import_from_snippet",
    {
        description:
            "Import a Node Particle System from the Babylon.js Snippet Server by its snippet ID. " +
            "The snippet is fetched, validated as a nodeParticle type, and loaded into memory for editing. " +
            'Snippet IDs look like "ABC123" or "ABC123#2" (with revision).',
        inputSchema: {
            particleSystemName: z.string().describe("Name to give the imported particle system set in memory"),
            snippetId: CreateSnippetIdSchema(z),
        },
    },
    async ({ particleSystemName, snippetId }) => {
        return await RunSnippetResponse({
            snippetId,
            loadSnippet: async (requestedSnippetId: string) => (await LoadSnippet(requestedSnippetId)) as IDataSnippetResult,
            createResponse: (snippetResult: IDataSnippetResult) =>
                CreateTypedSnippetImportResponse({
                    snippetId,
                    snippetResult,
                    expectedType: "nodeParticle",
                    importJson: (jsonText: string) => _importParticleSystemJson(particleSystemName, jsonText),
                    describeImported: () => manager.describeParticleSet(particleSystemName),
                    successMessage: `Imported snippet "${snippetId}" as "${particleSystemName}" successfully.`,
                }),
        });
    }
);

// ── Snippet / URL helpers ───────────────────────────────────────────────

server.registerTool(
    "get_snippet_url",
    {
        description: "Generate a URL that opens the particle system in the online Babylon.js Node Particle Editor. " + "The JSON is encoded in the URL fragment.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system set"),
        },
    },
    async ({ particleSystemName }) => {
        const json = manager.exportJSON(particleSystemName);
        if (!json) {
            return { content: [{ type: "text", text: `Particle system set "${particleSystemName}" not found.` }], isError: true };
        }
        const encoded = Buffer.from(json).toString("base64");
        const url = `https://npe.babylonjs.com/#${encoded}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Open this particle system in the NPE editor:\n${url}\n\nNote: For very large graphs, use the snippet server instead.`,
                },
            ],
        };
    }
);

// ── Snippet server ──────────────────────────────────────────────────────

server.registerTool(
    "save_snippet",
    {
        description:
            "Save the particle system to the Babylon.js Snippet Server and return the snippet ID and version. " +
            "The snippet can later be loaded in the Node Particle Editor via its snippet ID, or fetched with import_from_snippet. " +
            "To create a new revision of an existing snippet, pass the previous snippetId.",
        inputSchema: {
            particleSystemName: z.string().describe("Name of the particle system to save"),
            snippetId: z.string().optional().describe('Optional existing snippet ID to create a new revision of (e.g. "ABC123" or "ABC123#1")'),
            name: z.string().optional().describe("Optional human-readable title for the snippet"),
            description: z.string().optional().describe("Optional description"),
            tags: z.string().optional().describe("Optional comma-separated tags"),
        },
    },
    async ({ particleSystemName, snippetId, name, description, tags }) => {
        const json = manager.exportJSON(particleSystemName);
        if (!json) {
            return { content: [{ type: "text", text: `Particle system "${particleSystemName}" not found.` }], isError: true };
        }
        try {
            const result = await SaveSnippet(
                { type: "nodeParticle", data: ParseJsonText({ jsonText: json, jsonLabel: "NPE JSON" }) },
                { snippetId, metadata: { name, description, tags } }
            );
            return {
                content: [
                    {
                        type: "text",
                        text: `Saved particle system "${particleSystemName}" to snippet server.\n\nSnippet ID: ${result.id}\nVersion: ${result.version}\nFull ID: ${result.snippetId}\n\nLoad in NPE editor: https://npe.babylonjs.com/#${result.snippetId}`,
                    },
                ],
            };
        } catch (e) {
            return { content: [{ type: "text", text: `Error saving snippet: ${(e as Error).message}` }], isError: true };
        }
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js Node Particle Editor MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

const _shutdown = () => {
    void sessionController.stopAsync();
    process.exit(0);
};
process.on("SIGINT", _shutdown);
process.on("SIGTERM", _shutdown);
