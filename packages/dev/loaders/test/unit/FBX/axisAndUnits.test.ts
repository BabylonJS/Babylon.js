import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { FBXFileLoader } from "loaders/FBX/fbxFileLoader";

// A single quad whose Model is translated along `translation`, under the given GlobalSettings axes.
// The loader converts the file's axis basis to Babylon's Y-up/left-handed space, so the marker's
// loaded world position reveals whether the axis conversion was applied correctly.
function axisFbx(translation: number[], axes: { up: number; upSign: number; front: number; frontSign: number; unit?: number }): string {
    const unit = axes.unit ?? 1;
    return `; FBX 7.4.0 project file
GlobalSettings:  {
    Version: 1000
    Properties70:  {
        P: "UpAxis", "int", "Integer", "",${axes.up}
        P: "UpAxisSign", "int", "Integer", "",${axes.upSign}
        P: "FrontAxis", "int", "Integer", "",${axes.front}
        P: "FrontAxisSign", "int", "Integer", "",${axes.frontSign}
        P: "CoordAxis", "int", "Integer", "",0
        P: "CoordAxisSign", "int", "Integer", "",1
        P: "UnitScaleFactor", "double", "Number", "",${unit}
    }
}
Objects:  {
    Geometry: 1, "Geometry::Marker", "Mesh" {
        Vertices: *12 {
            a: -0.1,-0.1,0,0.1,-0.1,0,0.1,0.1,0,-0.1,0.1,0
        }
        PolygonVertexIndex: *4 {
            a: 0,1,2,-4
        }
        LayerElementNormal: 0 {
            MappingInformationType: "ByControlPoint"
            ReferenceInformationType: "Direct"
            Normals: *12 {
                a: 0,0,1,0,0,1,0,0,1,0,0,1
            }
        }
    }
    Model: 2, "Model::Marker", "Mesh" {
        Properties70:  {
            P: "Lcl Translation", "Lcl Translation", "", "A",${translation.join(",")}
        }
    }
}
Connections:  {
    C: "OO", 1, 2
    C: "OO", 2, 0
}`;
}

// Y-up: UpAxis=Y(1), FrontAxis=Z(2). Z-up: UpAxis=Z(2), FrontAxis=-Y(1,-).
const Y_UP = { up: 1, upSign: 1, front: 2, frontSign: 1 };
const Z_UP = { up: 2, upSign: 1, front: 1, frontSign: -1 };

// A quad with one single-shape blend-shape channel that pushes vertex 0 by delta [0,2,0]. The morph
// target equals base + delta and must be independent of UnitScaleFactor (the delta lives in the same
// space as the unscaled base geometry).
function morphFbx(unit: number): string {
    return `; FBX 7.4.0 project file
GlobalSettings:  {
    Version: 1000
    Properties70:  {
        P: "UpAxis", "int", "Integer", "",1
        P: "UpAxisSign", "int", "Integer", "",1
        P: "FrontAxis", "int", "Integer", "",2
        P: "FrontAxisSign", "int", "Integer", "",1
        P: "CoordAxis", "int", "Integer", "",0
        P: "CoordAxisSign", "int", "Integer", "",1
        P: "UnitScaleFactor", "double", "Number", "",${unit}
    }
}
Objects:  {
    Geometry: 1, "Geometry::Base", "Mesh" {
        Vertices: *12 {
            a: -0.5,-0.5,0,0.5,-0.5,0,0.5,0.5,0,-0.5,0.5,0
        }
        PolygonVertexIndex: *4 {
            a: 0,1,2,-4
        }
        LayerElementNormal: 0 {
            MappingInformationType: "ByControlPoint"
            ReferenceInformationType: "Direct"
            Normals: *12 {
                a: 0,0,1,0,0,1,0,0,1,0,0,1
            }
        }
    }
    Model: 10, "Model::Base", "Mesh" {
    }
    Deformer: 2, "Deformer::BlendShape", "BlendShape" {
    }
    Deformer: 3, "SubDeformer::Morph", "BlendShapeChannel" {
        Properties70:  {
            P: "DeformPercent", "Number", "", "A",100
        }
    }
    Geometry: 4, "Geometry::Shape", "Shape" {
        Indexes: *1 {
            a: 0
        }
        Vertices: *3 {
            a: 0,2,0
        }
    }
}
Connections:  {
    C: "OO", 1, 10
    C: "OO", 10, 0
    C: "OO", 2, 1
    C: "OO", 3, 2
    C: "OO", 4, 3
}`;
}

async function loadMorph(unit: number): Promise<{ base: number[]; target: number[] }> {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const loader = new FBXFileLoader();
    await loader.importMeshAsync(null, scene, morphFbx(unit), "");
    const mesh = scene.meshes.find((m) => m.morphTargetManager && m.morphTargetManager.numTargets > 0)!;
    const base = Array.from(mesh.getVerticesData(VertexBuffer.PositionKind)!);
    const target = Array.from(mesh.morphTargetManager!.getTarget(0).getPositions()!);
    scene.dispose();
    engine.dispose();
    return { base, target };
}

describe("FBX global axis & unit settings", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function loadMarker(): AbstractMesh {
        return scene.meshes.find((m) => m.name.includes("Marker") && m.getTotalVertices() > 0) as AbstractMesh;
    }

    it("keeps a Y-up file's up axis as engine +Y", async () => {
        const loader = new FBXFileLoader();
        await loader.importMeshAsync(null, scene, axisFbx([0, 1, 0], Y_UP), "");
        const marker = loadMarker();
        marker.computeWorldMatrix(true);
        const p = marker.getAbsolutePosition();
        expect(p.y).toBeCloseTo(1, 4);
        expect(Math.abs(p.x)).toBeLessThan(1e-4);
        expect(Math.abs(p.z)).toBeLessThan(1e-4);
    });

    it("converts a Z-up file's up axis (+Z) to engine +Y", async () => {
        const loader = new FBXFileLoader();
        // Authored Z-up: the marker is one unit along the file's up axis (+Z).
        await loader.importMeshAsync(null, scene, axisFbx([0, 0, 1], Z_UP), "");
        const marker = loadMarker();
        marker.computeWorldMatrix(true);
        const p = marker.getAbsolutePosition();
        // After conversion the up axis must land on engine +Y, matching the Y-up file.
        expect(p.y).toBeCloseTo(1, 4);
        expect(Math.abs(p.z)).toBeLessThan(1e-4);
    });

    it("loads Y-up and Z-up authorings of the same object to the same engine orientation", async () => {
        const loaderY = new FBXFileLoader();
        await loaderY.importMeshAsync(null, scene, axisFbx([0, 1, 0], Y_UP), "");
        const yPos = loadMarker().getAbsolutePosition().clone();
        scene.meshes.slice().forEach((m) => m.dispose());

        const loaderZ = new FBXFileLoader();
        await loaderZ.importMeshAsync(null, scene, axisFbx([0, 0, 1], Z_UP), "");
        const zPos = loadMarker().getAbsolutePosition().clone();

        expect(zPos.subtract(yPos).length()).toBeLessThan(1e-4);
    });

    it("does not scale base geometry by UnitScaleFactor", async () => {
        const loaderA = new FBXFileLoader();
        await loaderA.importMeshAsync(null, scene, axisFbx([0, 1, 0], { ...Y_UP, unit: 1 }), "");
        const a = loadMarker().getAbsolutePosition().clone();
        scene.meshes.slice().forEach((m) => m.dispose());

        const loaderB = new FBXFileLoader();
        await loaderB.importMeshAsync(null, scene, axisFbx([0, 1, 0], { ...Y_UP, unit: 2.54 }), "");
        const b = loadMarker().getAbsolutePosition().clone();

        // Base geometry/transform is unaffected by UnitScaleFactor.
        expect(b.subtract(a).length()).toBeLessThan(1e-4);
    });

    it("does not scale morph-target deltas by UnitScaleFactor", async () => {
        const unit1 = await loadMorph(1);
        const unit254 = await loadMorph(2.54);

        // The morph delta lives in the same space as the (unscaled) base geometry, so the resulting
        // morph target must be identical regardless of UnitScaleFactor.
        expect(unit254.target.length).toBe(unit1.target.length);
        for (let i = 0; i < unit1.target.length; i++) {
            expect(unit254.target[i]).toBeCloseTo(unit1.target[i], 4);
        }
        // Sanity: the morph actually displaced vertex 0 by the authored delta (~2 units), not a no-op.
        let maxDisplacement = 0;
        for (let i = 0; i < unit1.target.length; i++) {
            maxDisplacement = Math.max(maxDisplacement, Math.abs(unit1.target[i] - unit1.base[i]));
        }
        expect(maxDisplacement).toBeGreaterThan(1.5);
    });
});
