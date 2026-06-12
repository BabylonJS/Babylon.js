/**
 * Node Geometry MCP Server – Example Geometry Generator
 *
 * Builds several reference Node Geometry graphs via the GeometryGraphManager API,
 * validates them, and writes them to the examples/ directory.
 *
 * Run:  npx ts-node --esm test/unit/generateExamples.ts
 * Or simply include as a test file – Jest will run it and the examples are
 * written to disk as a side effect.
 */

import * as fs from "fs";
import * as path from "path";
import { GeometryGraphManager } from "../../src/geometryGraph";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function writeExample(name: string, json: string): void {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const filePath = path.join(EXAMPLES_DIR, `${name}.json`);
    fs.writeFileSync(filePath, json, "utf-8");
}

function id(result: ReturnType<GeometryGraphManager["addBlock"]>): number {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.block.id;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 1 – Simple Box
//  A minimal geometry: BoxBlock → GeometryOutputBlock
// ═══════════════════════════════════════════════════════════════════════════

function buildSimpleBox(): string {
    const mgr = new GeometryGraphManager();
    mgr.createGeometry("SimpleBox", "Minimal box geometry – one BoxBlock piped to the output.");

    const boxId = id(mgr.addBlock("SimpleBox", "BoxBlock", "box"));
    const outId = id(mgr.addBlock("SimpleBox", "GeometryOutputBlock", "output"));

    mgr.connectBlocks("SimpleBox", boxId, "geometry", outId, "geometry");

    const issues = mgr.validateGeometry("SimpleBox");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("SimpleBox")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 2 – Scattered Instances
//  Scatter small spheres on the faces of a box using InstantiateOnFacesBlock.
// ═══════════════════════════════════════════════════════════════════════════

function buildScatteredInstances(): string {
    const mgr = new GeometryGraphManager();
    mgr.createGeometry("ScatteredInstances", "Scatter small spheres across a box's faces.");

    const boxId = id(mgr.addBlock("ScatteredInstances", "BoxBlock", "baseMesh"));
    const sphereId = id(mgr.addBlock("ScatteredInstances", "SphereBlock", "instanceMesh"));

    // Scale factor for the small spheres
    const scaleValId = id(
        mgr.addBlock("ScatteredInstances", "GeometryInputBlock", "scaleFactor", {
            type: "Float",
            value: 0.05,
        })
    );

    const scaleId = id(mgr.addBlock("ScatteredInstances", "ScalingBlock", "scale"));
    mgr.connectBlocks("ScatteredInstances", scaleValId, "output", scaleId, "x");
    mgr.connectBlocks("ScatteredInstances", scaleValId, "output", scaleId, "y");
    mgr.connectBlocks("ScatteredInstances", scaleValId, "output", scaleId, "z");

    // Instance count
    const countId = id(
        mgr.addBlock("ScatteredInstances", "GeometryInputBlock", "count", {
            type: "Int",
            value: 200,
        })
    );

    const scatterId = id(mgr.addBlock("ScatteredInstances", "InstantiateOnFacesBlock", "scatter"));
    mgr.connectBlocks("ScatteredInstances", boxId, "geometry", scatterId, "geometry");
    mgr.connectBlocks("ScatteredInstances", sphereId, "geometry", scatterId, "instance");
    mgr.connectBlocks("ScatteredInstances", scaleId, "matrix", scatterId, "matrix");
    mgr.connectBlocks("ScatteredInstances", countId, "output", scatterId, "count");

    const outId = id(mgr.addBlock("ScatteredInstances", "GeometryOutputBlock", "output"));
    mgr.connectBlocks("ScatteredInstances", scatterId, "output", outId, "geometry");

    const issues = mgr.validateGeometry("ScatteredInstances");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("ScatteredInstances")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 3 – Noise Terrain
//  Deform a plane with a noise function to create a terrain-like surface.
// ═══════════════════════════════════════════════════════════════════════════

function buildNoiseTerrain(): string {
    const mgr = new GeometryGraphManager();
    mgr.createGeometry("NoiseTerrain", "Deform a plane with Perlin noise to create terrain.");

    // GridBlock acts as a subdivided plane
    const gridId = id(mgr.addBlock("NoiseTerrain", "GridBlock", "plane"));

    // Read positions
    const posId = id(
        mgr.addBlock("NoiseTerrain", "GeometryInputBlock", "positions", {
            contextualValue: "Positions",
        })
    );

    // Noise block
    const noiseId = id(mgr.addBlock("NoiseTerrain", "NoiseBlock", "noise"));
    mgr.connectBlocks("NoiseTerrain", posId, "output", noiseId, "input");

    // Multiply noise by height scale
    const heightId = id(
        mgr.addBlock("NoiseTerrain", "GeometryInputBlock", "heightScale", {
            type: "Float",
            value: 2.0,
        })
    );
    const mulId = id(mgr.addBlock("NoiseTerrain", "MathBlock", "heightMul", { operation: "Multiply" }));
    mgr.connectBlocks("NoiseTerrain", noiseId, "output", mulId, "left");
    mgr.connectBlocks("NoiseTerrain", heightId, "output", mulId, "right");

    // SetPositions block
    const setPosId = id(mgr.addBlock("NoiseTerrain", "SetPositionsBlock", "setPositions"));
    mgr.connectBlocks("NoiseTerrain", gridId, "geometry", setPosId, "geometry");
    mgr.connectBlocks("NoiseTerrain", mulId, "output", setPosId, "positions");

    // Recompute normals
    const normalsId = id(mgr.addBlock("NoiseTerrain", "ComputeNormalsBlock", "normals"));
    mgr.connectBlocks("NoiseTerrain", setPosId, "output", normalsId, "geometry");

    const outId = id(mgr.addBlock("NoiseTerrain", "GeometryOutputBlock", "output"));
    mgr.connectBlocks("NoiseTerrain", normalsId, "output", outId, "geometry");

    const issues = mgr.validateGeometry("NoiseTerrain");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("NoiseTerrain")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 4 – Boolean CSG
//  Subtract a sphere from a box to create a hollowed cube.
// ═══════════════════════════════════════════════════════════════════════════

function buildBooleanCSG(): string {
    const mgr = new GeometryGraphManager();
    mgr.createGeometry("BooleanCSG", "Subtract a sphere from a box (CSG operation).");

    const boxId = id(mgr.addBlock("BooleanCSG", "BoxBlock", "box"));
    const sphereId = id(mgr.addBlock("BooleanCSG", "SphereBlock", "sphere"));

    const boolId = id(mgr.addBlock("BooleanCSG", "BooleanGeometryBlock", "csg", { operation: "Subtract" }));
    mgr.connectBlocks("BooleanCSG", boxId, "geometry", boolId, "geometry0");
    mgr.connectBlocks("BooleanCSG", sphereId, "geometry", boolId, "geometry1");

    const outId = id(mgr.addBlock("BooleanCSG", "GeometryOutputBlock", "output"));
    mgr.connectBlocks("BooleanCSG", boolId, "output", outId, "geometry");

    const issues = mgr.validateGeometry("BooleanCSG");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("BooleanCSG")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Example 5 – Math Pipeline
//  Demonstrate a computational graph: sin wave deformation along Y axis.
// ═══════════════════════════════════════════════════════════════════════════

function buildMathPipeline(): string {
    const mgr = new GeometryGraphManager();
    mgr.createGeometry("MathPipeline", "Sin-wave deformation along the Y axis of a grid.");

    const gridId = id(mgr.addBlock("MathPipeline", "GridBlock", "grid"));

    // Read positions
    const posId = id(
        mgr.addBlock("MathPipeline", "GeometryInputBlock", "positions", {
            contextualValue: "Positions",
        })
    );

    // Extract X component using VectorConverterBlock
    const decomposeId = id(mgr.addBlock("MathPipeline", "VectorConverterBlock", "decompose"));
    mgr.connectBlocks("MathPipeline", posId, "output", decomposeId, "xyzIn");

    // Frequency
    const freqId = id(
        mgr.addBlock("MathPipeline", "GeometryInputBlock", "frequency", {
            type: "Float",
            value: 5.0,
        })
    );

    // Multiply x by frequency
    const mulFreqId = id(mgr.addBlock("MathPipeline", "MathBlock", "xTimesFreq", { operation: "Multiply" }));
    mgr.connectBlocks("MathPipeline", decomposeId, "x", mulFreqId, "left");
    mgr.connectBlocks("MathPipeline", freqId, "output", mulFreqId, "right");

    // Sin of (x * frequency)
    const sinId = id(mgr.addBlock("MathPipeline", "GeometryTrigonometryBlock", "sin", { operation: "Sin" }));
    mgr.connectBlocks("MathPipeline", mulFreqId, "output", sinId, "input");

    // Amplitude
    const ampId = id(
        mgr.addBlock("MathPipeline", "GeometryInputBlock", "amplitude", {
            type: "Float",
            value: 0.3,
        })
    );

    // Multiply sin by amplitude
    const mulAmpId = id(mgr.addBlock("MathPipeline", "MathBlock", "sinTimesAmp", { operation: "Multiply" }));
    mgr.connectBlocks("MathPipeline", sinId, "output", mulAmpId, "left");
    mgr.connectBlocks("MathPipeline", ampId, "output", mulAmpId, "right");

    // SetPositions to apply the Y offset
    const setPosId = id(mgr.addBlock("MathPipeline", "SetPositionsBlock", "deform"));
    mgr.connectBlocks("MathPipeline", gridId, "geometry", setPosId, "geometry");
    mgr.connectBlocks("MathPipeline", mulAmpId, "output", setPosId, "positions");

    // Recompute normals
    const normalsId = id(mgr.addBlock("MathPipeline", "ComputeNormalsBlock", "normals"));
    mgr.connectBlocks("MathPipeline", setPosId, "output", normalsId, "geometry");

    const outId = id(mgr.addBlock("MathPipeline", "GeometryOutputBlock", "output"));
    mgr.connectBlocks("MathPipeline", normalsId, "output", outId, "geometry");

    const issues = mgr.validateGeometry("MathPipeline");
    expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

    return mgr.exportJSON("MathPipeline")!;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Jest Test Wrapper
// ═══════════════════════════════════════════════════════════════════════════

describe("Node Geometry MCP Server – Example Generation", () => {
    it("generates SimpleBox example", () => {
        const json = buildSimpleBox();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBe(2);
        writeExample("SimpleBox", json);
    });

    it("generates ScatteredInstances example", () => {
        const json = buildScatteredInstances();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(6);
        writeExample("ScatteredInstances", json);
    });

    it("generates NoiseTerrain example", () => {
        const json = buildNoiseTerrain();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(6);
        writeExample("NoiseTerrain", json);
    });

    it("generates BooleanCSG example", () => {
        const json = buildBooleanCSG();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBe(4);
        writeExample("BooleanCSG", json);
    });

    it("generates MathPipeline example", () => {
        const json = buildMathPipeline();
        const parsed = JSON.parse(json);
        expect(parsed.blocks.length).toBeGreaterThanOrEqual(9);
        writeExample("MathPipeline", json);
    });
});
