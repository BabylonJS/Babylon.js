/**
 * Node Particle MCP Server – Example Particle System Generator
 *
 * Builds several reference Node Particle System Set graphs via the
 * ParticleGraphManager API, validates them, and writes them to the examples/
 * directory.
 *
 * Run:  npx ts-node --esm test/unit/generateExamples.ts
 * Or simply include as a test file – Jest will run it and the examples are
 * written to disk as a side effect.
 */

import * as fs from "fs";
import * as path from "path";
import { ParticleGraphManager } from "../../src/particleGraph";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function writeExample(name: string, json: string): void {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const filePath = path.join(EXAMPLES_DIR, `${name}.json`);
    fs.writeFileSync(filePath, json, "utf-8");
}

function id(result: ReturnType<ParticleGraphManager["addBlock"]>): number {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.block.id;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 1 – Basic Particles
//  A minimal particle system: BoxShape → CreateParticle → UpdateAge → System
// ═══════════════════════════════════════════════════════════════════════════

function buildBasicParticles(): string {
    const mgr = new ParticleGraphManager();
    mgr.createParticleSet("BasicParticles", "Minimal box-emitting particle system.");

    const shapeId = id(mgr.addBlock("BasicParticles", "BoxShapeBlock", "shape"));
    const createId = id(mgr.addBlock("BasicParticles", "CreateParticleBlock", "create"));

    const lifetimeId = id(
        mgr.addBlock("BasicParticles", "ParticleInputBlock", "lifetime", {
            type: "Float",
            value: 2,
        })
    );
    mgr.connectBlocks("BasicParticles", lifetimeId, "output", createId, "lifeTime");

    mgr.connectBlocks("BasicParticles", createId, "particle", shapeId, "particle");

    const updateAgeId = id(mgr.addBlock("BasicParticles", "UpdateAgeBlock", "updateAge"));
    mgr.connectBlocks("BasicParticles", shapeId, "output", updateAgeId, "particle");

    const ageInputId = id(
        mgr.addBlock("BasicParticles", "ParticleInputBlock", "ageInput", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("BasicParticles", ageInputId, "output", updateAgeId, "age");

    const updatePosId = id(mgr.addBlock("BasicParticles", "BasicPositionUpdateBlock", "updatePos"));
    mgr.connectBlocks("BasicParticles", updateAgeId, "output", updatePosId, "particle");

    const textureId = id(mgr.addBlock("BasicParticles", "ParticleTextureSourceBlock", "texture", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const systemId = id(mgr.addBlock("BasicParticles", "SystemBlock", "system"));
    mgr.connectBlocks("BasicParticles", textureId, "texture", systemId, "texture");
    mgr.connectBlocks("BasicParticles", updatePosId, "output", systemId, "particle");

    const issues = mgr.validateParticleSet("BasicParticles");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("BasicParticles")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 2 – Colored Particles
//  Particles with initial color and color update via gradient.
// ═══════════════════════════════════════════════════════════════════════════

function buildColoredParticles(): string {
    const mgr = new ParticleGraphManager();
    mgr.createParticleSet("ColoredParticles", "Sphere-emitting particles with color fade.");

    const shapeId = id(mgr.addBlock("ColoredParticles", "SphereShapeBlock", "shape"));
    const createId = id(mgr.addBlock("ColoredParticles", "CreateParticleBlock", "create"));

    const lifetimeId = id(
        mgr.addBlock("ColoredParticles", "ParticleInputBlock", "lifetime", {
            type: "Float",
            value: 3,
        })
    );
    mgr.connectBlocks("ColoredParticles", lifetimeId, "output", createId, "lifeTime");

    const startColorId = id(
        mgr.addBlock("ColoredParticles", "ParticleInputBlock", "startColor", {
            type: "Color4",
            value: { r: 1, g: 0.8, b: 0, a: 1 },
        })
    );
    mgr.connectBlocks("ColoredParticles", startColorId, "output", createId, "color");

    mgr.connectBlocks("ColoredParticles", createId, "particle", shapeId, "particle");

    const updateAgeId = id(mgr.addBlock("ColoredParticles", "UpdateAgeBlock", "updateAge"));
    mgr.connectBlocks("ColoredParticles", shapeId, "output", updateAgeId, "particle");

    const ageInputId = id(
        mgr.addBlock("ColoredParticles", "ParticleInputBlock", "ageInput", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("ColoredParticles", ageInputId, "output", updateAgeId, "age");

    const updatePosId = id(mgr.addBlock("ColoredParticles", "BasicPositionUpdateBlock", "updatePos"));
    mgr.connectBlocks("ColoredParticles", updateAgeId, "output", updatePosId, "particle");

    const updateColorId = id(mgr.addBlock("ColoredParticles", "UpdateColorBlock", "updateColor"));
    mgr.connectBlocks("ColoredParticles", updatePosId, "output", updateColorId, "particle");

    const endColorId = id(
        mgr.addBlock("ColoredParticles", "ParticleInputBlock", "endColor", {
            type: "Color4",
            value: { r: 1, g: 0, b: 0, a: 0 },
        })
    );
    mgr.connectBlocks("ColoredParticles", endColorId, "output", updateColorId, "color");

    const textureId = id(mgr.addBlock("ColoredParticles", "ParticleTextureSourceBlock", "texture", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const systemId = id(mgr.addBlock("ColoredParticles", "SystemBlock", "system"));
    mgr.connectBlocks("ColoredParticles", textureId, "texture", systemId, "texture");
    mgr.connectBlocks("ColoredParticles", updateColorId, "output", systemId, "particle");

    const issues = mgr.validateParticleSet("ColoredParticles");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("ColoredParticles")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 3 – Cone Fountain
//  Fountain-like effect with a cone emitter and direction update.
// ═══════════════════════════════════════════════════════════════════════════

function buildConeFountain(): string {
    const mgr = new ParticleGraphManager();
    mgr.createParticleSet("ConeFountain", "Fountain effect using a cone shape.");

    const shapeId = id(mgr.addBlock("ConeFountain", "ConeShapeBlock", "cone"));
    const createId = id(mgr.addBlock("ConeFountain", "CreateParticleBlock", "create"));

    const lifetimeId = id(
        mgr.addBlock("ConeFountain", "ParticleInputBlock", "lifetime", {
            type: "Float",
            value: 4,
        })
    );
    mgr.connectBlocks("ConeFountain", lifetimeId, "output", createId, "lifeTime");

    const scaleId = id(
        mgr.addBlock("ConeFountain", "ParticleInputBlock", "scale", {
            type: "Vector2",
            value: { x: 0.1, y: 0.1 },
        })
    );
    mgr.connectBlocks("ConeFountain", scaleId, "output", createId, "scale");

    mgr.connectBlocks("ConeFountain", createId, "particle", shapeId, "particle");

    const updateAgeId = id(mgr.addBlock("ConeFountain", "UpdateAgeBlock", "updateAge"));
    mgr.connectBlocks("ConeFountain", shapeId, "output", updateAgeId, "particle");

    const ageInputId = id(
        mgr.addBlock("ConeFountain", "ParticleInputBlock", "ageInput", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("ConeFountain", ageInputId, "output", updateAgeId, "age");

    const updateDirId = id(mgr.addBlock("ConeFountain", "UpdateDirectionBlock", "updateDir"));
    mgr.connectBlocks("ConeFountain", updateAgeId, "output", updateDirId, "particle");

    const dirInputId = id(
        mgr.addBlock("ConeFountain", "ParticleInputBlock", "dirInput", {
            contextualValue: "Direction",
        })
    );
    mgr.connectBlocks("ConeFountain", dirInputId, "output", updateDirId, "direction");

    const updatePosId = id(mgr.addBlock("ConeFountain", "BasicPositionUpdateBlock", "updatePos"));
    mgr.connectBlocks("ConeFountain", updateDirId, "output", updatePosId, "particle");

    const textureId = id(mgr.addBlock("ConeFountain", "ParticleTextureSourceBlock", "texture", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const systemId = id(mgr.addBlock("ConeFountain", "SystemBlock", "system"));
    mgr.connectBlocks("ConeFountain", textureId, "texture", systemId, "texture");
    mgr.connectBlocks("ConeFountain", updatePosId, "output", systemId, "particle");

    const issues = mgr.validateParticleSet("ConeFountain");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("ConeFountain")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 4 – Math Particles
//  Demonstrate math operations: multiply particle direction by time.
// ═══════════════════════════════════════════════════════════════════════════

function buildMathParticles(): string {
    const mgr = new ParticleGraphManager();
    mgr.createParticleSet("MathParticles", "Particles with math-modified direction.");

    const shapeId = id(mgr.addBlock("MathParticles", "BoxShapeBlock", "shape"));
    const createId = id(mgr.addBlock("MathParticles", "CreateParticleBlock", "create"));

    const lifetimeId = id(
        mgr.addBlock("MathParticles", "ParticleInputBlock", "lifetime", {
            type: "Float",
            value: 3,
        })
    );
    mgr.connectBlocks("MathParticles", lifetimeId, "output", createId, "lifeTime");

    mgr.connectBlocks("MathParticles", createId, "particle", shapeId, "particle");

    const updateAgeId = id(mgr.addBlock("MathParticles", "UpdateAgeBlock", "updateAge"));
    mgr.connectBlocks("MathParticles", shapeId, "output", updateAgeId, "particle");

    const ageInputId = id(
        mgr.addBlock("MathParticles", "ParticleInputBlock", "ageInput", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("MathParticles", ageInputId, "output", updateAgeId, "age");

    // Read direction and multiply by a factor using math block
    const dirId = id(
        mgr.addBlock("MathParticles", "ParticleInputBlock", "direction", {
            contextualValue: "Direction",
        })
    );
    const factorId = id(
        mgr.addBlock("MathParticles", "ParticleInputBlock", "factor", {
            type: "Float",
            value: 2.5,
        })
    );
    const mathId = id(mgr.addBlock("MathParticles", "ParticleMathBlock", "mulDir", { operation: "Multiply" }));
    mgr.connectBlocks("MathParticles", dirId, "output", mathId, "left");
    mgr.connectBlocks("MathParticles", factorId, "output", mathId, "right");

    const updateDirId = id(mgr.addBlock("MathParticles", "UpdateDirectionBlock", "updateDir"));
    mgr.connectBlocks("MathParticles", updateAgeId, "output", updateDirId, "particle");
    mgr.connectBlocks("MathParticles", mathId, "output", updateDirId, "direction");

    const updatePosId = id(mgr.addBlock("MathParticles", "BasicPositionUpdateBlock", "updatePos"));
    mgr.connectBlocks("MathParticles", updateDirId, "output", updatePosId, "particle");

    const textureId = id(mgr.addBlock("MathParticles", "ParticleTextureSourceBlock", "texture", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const systemId = id(mgr.addBlock("MathParticles", "SystemBlock", "system"));
    mgr.connectBlocks("MathParticles", textureId, "texture", systemId, "texture");
    mgr.connectBlocks("MathParticles", updatePosId, "output", systemId, "particle");

    const issues = mgr.validateParticleSet("MathParticles");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("MathParticles")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 5 – Multi-System Particles
//  Demonstrate multiple SystemBlocks in a single set.
// ═══════════════════════════════════════════════════════════════════════════

function buildMultiSystemParticles(): string {
    const mgr = new ParticleGraphManager();
    mgr.createParticleSet("MultiSystemParticles", "Two independent particle systems in a single set.");

    // System 1: Box emitter
    const shape1Id = id(mgr.addBlock("MultiSystemParticles", "BoxShapeBlock", "shape1"));
    const create1Id = id(mgr.addBlock("MultiSystemParticles", "CreateParticleBlock", "create1"));

    const lifetime1Id = id(
        mgr.addBlock("MultiSystemParticles", "ParticleInputBlock", "lifetime1", {
            type: "Float",
            value: 2,
        })
    );
    mgr.connectBlocks("MultiSystemParticles", lifetime1Id, "output", create1Id, "lifeTime");

    mgr.connectBlocks("MultiSystemParticles", create1Id, "particle", shape1Id, "particle");

    const updateAge1Id = id(mgr.addBlock("MultiSystemParticles", "UpdateAgeBlock", "updateAge1"));
    mgr.connectBlocks("MultiSystemParticles", shape1Id, "output", updateAge1Id, "particle");

    const ageInput1Id = id(
        mgr.addBlock("MultiSystemParticles", "ParticleInputBlock", "ageInput1", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("MultiSystemParticles", ageInput1Id, "output", updateAge1Id, "age");

    const texture1Id = id(mgr.addBlock("MultiSystemParticles", "ParticleTextureSourceBlock", "texture1", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const system1Id = id(mgr.addBlock("MultiSystemParticles", "SystemBlock", "system1"));
    mgr.connectBlocks("MultiSystemParticles", texture1Id, "texture", system1Id, "texture");
    mgr.connectBlocks("MultiSystemParticles", updateAge1Id, "output", system1Id, "particle");

    // System 2: Sphere emitter
    const shape2Id = id(mgr.addBlock("MultiSystemParticles", "SphereShapeBlock", "shape2"));
    const create2Id = id(mgr.addBlock("MultiSystemParticles", "CreateParticleBlock", "create2"));

    const lifetime2Id = id(
        mgr.addBlock("MultiSystemParticles", "ParticleInputBlock", "lifetime2", {
            type: "Float",
            value: 5,
        })
    );
    mgr.connectBlocks("MultiSystemParticles", lifetime2Id, "output", create2Id, "lifeTime");

    mgr.connectBlocks("MultiSystemParticles", create2Id, "particle", shape2Id, "particle");

    const updateAge2Id = id(mgr.addBlock("MultiSystemParticles", "UpdateAgeBlock", "updateAge2"));
    mgr.connectBlocks("MultiSystemParticles", shape2Id, "output", updateAge2Id, "particle");

    const ageInput2Id = id(
        mgr.addBlock("MultiSystemParticles", "ParticleInputBlock", "ageInput2", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("MultiSystemParticles", ageInput2Id, "output", updateAge2Id, "age");

    const texture2Id = id(mgr.addBlock("MultiSystemParticles", "ParticleTextureSourceBlock", "texture2", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const system2Id = id(mgr.addBlock("MultiSystemParticles", "SystemBlock", "system2"));
    mgr.connectBlocks("MultiSystemParticles", texture2Id, "texture", system2Id, "texture");
    mgr.connectBlocks("MultiSystemParticles", updateAge2Id, "output", system2Id, "particle");

    const issues = mgr.validateParticleSet("MultiSystemParticles");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("MultiSystemParticles")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 6 – Gravity Fountain
//  Particles shoot up from a cone and fall back down via gravity applied
//  to the direction each frame.
// ═══════════════════════════════════════════════════════════════════════════

function buildGravityFountain(): string {
    const mgr = new ParticleGraphManager();
    mgr.createParticleSet("GravityFountain", "Cone fountain with gravity pulling particles down.");

    const createId = id(mgr.addBlock("GravityFountain", "CreateParticleBlock", "create"));
    const lifetimeId = id(
        mgr.addBlock("GravityFountain", "ParticleInputBlock", "lifetime", {
            type: "Float",
            value: 3,
        })
    );
    mgr.connectBlocks("GravityFountain", lifetimeId, "output", createId, "lifeTime");

    const emitPowerId = id(
        mgr.addBlock("GravityFountain", "ParticleInputBlock", "emitPower", {
            type: "Float",
            value: 8,
        })
    );
    mgr.connectBlocks("GravityFountain", emitPowerId, "output", createId, "emitPower");

    const shapeId = id(mgr.addBlock("GravityFountain", "ConeShapeBlock", "cone"));
    mgr.connectBlocks("GravityFountain", createId, "particle", shapeId, "particle");

    const updateAgeId = id(mgr.addBlock("GravityFountain", "UpdateAgeBlock", "updateAge"));
    mgr.connectBlocks("GravityFountain", shapeId, "output", updateAgeId, "particle");

    const ageInputId = id(
        mgr.addBlock("GravityFountain", "ParticleInputBlock", "ageInput", {
            contextualValue: "Age",
        })
    );
    mgr.connectBlocks("GravityFountain", ageInputId, "output", updateAgeId, "age");

    // Gravity direction update: direction += gravity * deltaTime
    const gravityId = id(
        mgr.addBlock("GravityFountain", "ParticleInputBlock", "gravity", {
            type: "Vector3",
            value: { x: 0, y: -9.81, z: 0 },
        })
    );
    const deltaTimeId = id(
        mgr.addBlock("GravityFountain", "ParticleInputBlock", "deltaTime", {
            systemSource: "Delta",
        })
    );
    const gravityDeltaId = id(mgr.addBlock("GravityFountain", "ParticleMathBlock", "gravityDelta", { operation: "Multiply" }));
    mgr.connectBlocks("GravityFountain", gravityId, "output", gravityDeltaId, "left");
    mgr.connectBlocks("GravityFountain", deltaTimeId, "output", gravityDeltaId, "right");

    const currentDirId = id(
        mgr.addBlock("GravityFountain", "ParticleInputBlock", "currentDir", {
            contextualValue: "Direction",
        })
    );
    const addGravityId = id(mgr.addBlock("GravityFountain", "ParticleMathBlock", "addGravity", { operation: "Add" }));
    mgr.connectBlocks("GravityFountain", currentDirId, "output", addGravityId, "left");
    mgr.connectBlocks("GravityFountain", gravityDeltaId, "output", addGravityId, "right");

    const updateDirId = id(mgr.addBlock("GravityFountain", "UpdateDirectionBlock", "updateDir"));
    mgr.connectBlocks("GravityFountain", updateAgeId, "output", updateDirId, "particle");
    mgr.connectBlocks("GravityFountain", addGravityId, "output", updateDirId, "direction");

    // Position update
    const updatePosId = id(mgr.addBlock("GravityFountain", "BasicPositionUpdateBlock", "updatePos"));
    mgr.connectBlocks("GravityFountain", updateDirId, "output", updatePosId, "particle");

    // System
    const textureId = id(mgr.addBlock("GravityFountain", "ParticleTextureSourceBlock", "texture", { url: "https://assets.babylonjs.com/textures/flare.png" }));
    const systemId = id(mgr.addBlock("GravityFountain", "SystemBlock", "system"));
    mgr.connectBlocks("GravityFountain", textureId, "texture", systemId, "texture");
    mgr.connectBlocks("GravityFountain", updatePosId, "output", systemId, "particle");

    const issues = mgr.validateParticleSet("GravityFountain");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("GravityFountain")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Jest Test Wrapper
// ═══════════════════════════════════════════════════════════════════════════

describe("Node Particle MCP Server – Example Generation", () => {
    it("generates BasicParticles example", () => {
        const json = buildBasicParticles();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(7);
        writeExample("BasicParticles", json);
    });

    it("generates ColoredParticles example", () => {
        const json = buildColoredParticles();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(10);
        writeExample("ColoredParticles", json);
    });

    it("generates ConeFountain example", () => {
        const json = buildConeFountain();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(8);
        writeExample("ConeFountain", json);
    });

    it("generates MathParticles example", () => {
        const json = buildMathParticles();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(10);
        writeExample("MathParticles", json);
    });

    it("generates MultiSystemParticles example", () => {
        const json = buildMultiSystemParticles();
        const parsed = JSON.parse(json);
        const systemBlocks = parsed.blocks.filter((b: any) => b.customType === "BABYLON.SystemBlock");
        expect(systemBlocks.length).toBe(2);
        writeExample("MultiSystemParticles", json);
    });

    it("generates GravityFountain example", () => {
        const json = buildGravityFountain();
        const parsed = JSON.parse(json);
        // Should have gravity, deltaTime, two math blocks, updateDir, updatePos, etc.
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(13);
        writeExample("GravityFountain", json);
    });
});
