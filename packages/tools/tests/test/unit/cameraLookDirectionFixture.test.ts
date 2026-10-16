import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "core/Maths/math.vector.pure";

const config: { tests: { title: string; playgroundId?: string; replace?: string }[] } = JSON.parse(readFileSync(new URL("../visualization/config.json", import.meta.url), "utf8"));

const modelSetup = `
let roundtripCount = 0;
let srcRH = false;
let destRH = false;
//options//
const root = { rotationQuaternion: BABYLON.Quaternion.Identity() };
if (srcRH) {
    root.rotationQuaternion = BABYLON.Quaternion.FromLookDirectionRH(BABYLON.Vector3.Forward(srcRH), BABYLON.Vector3.Up());
} else {
    root.rotationQuaternion = BABYLON.Quaternion.FromLookDirectionLH(BABYLON.Vector3.Forward(srcRH), BABYLON.Vector3.Up());
}
({ roundtripCount, srcRH, destRH, rotation: root.rotationQuaternion });
`;

describe.each([
    [true, false],
    [true, true],
    [false, true],
    [false, false],
])("camera rotation fixture (srcRH=%s, destRH=%s)", (srcRH, destRH) => {
    it("preserves the reference model's facing while retaining the camera roundtrip options", () => {
        const title = `GLTF Serializer camera rotation animation, ${srcRH ? "RH" : "LH"} -> ${destRH ? "RH" : "LH"}`;
        const fixture = config.tests.find((test) => test.title === title);
        if (!fixture?.replace) {
            throw new Error(`Missing camera rotation fixture replacements: ${title}`);
        }
        expect(fixture.playgroundId).toBe("#3A00GJ#42");

        let code = modelSetup;
        const replacements = fixture.replace.split(",");
        expect(replacements).toHaveLength(2);
        for (let i = 0; i < replacements.length; i += 2) {
            const source = replacements[i].trim();
            const destination = replacements[i + 1].trim();
            expect(code).toContain(source);
            code = code.replace(source, destination);
        }
        expect(code).toContain("if (srcRH) {");
        expect(code).toContain("FromLookDirectionLH(BABYLON.Vector3.Forward(srcRH)");
        expect(code).toContain("FromLookDirectionRH(BABYLON.Vector3.Forward(srcRH)");

        const result: { roundtripCount: number; srcRH: boolean; destRH: boolean; rotation: Quaternion } = runInNewContext(code, {
            BABYLON: { Quaternion, Vector3 },
        });
        expect(result.roundtripCount).toBe(1);
        expect(result.srcRH).toBe(srcRH);
        expect(result.destRH).toBe(destRH);

        const front = Vector3.Forward().rotateByQuaternionToRef(result.rotation, new Vector3());
        const right = Vector3.Right().rotateByQuaternionToRef(result.rotation, new Vector3());
        const up = Vector3.Up().rotateByQuaternionToRef(result.rotation, new Vector3());
        expect(Vector3.Distance(front, Vector3.Backward())).toBeCloseTo(0, 6);
        expect(Vector3.Distance(right, Vector3.Left())).toBeCloseTo(0, 6);
        expect(Vector3.Distance(up, Vector3.Up())).toBeCloseTo(0, 6);
    });
});
