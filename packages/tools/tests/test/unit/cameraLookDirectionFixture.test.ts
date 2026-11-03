import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "core/Maths/math.vector.pure";

const config: { tests: { title: string; playgroundId?: string; replace?: string; referenceImage?: string }[] } = JSON.parse(
    readFileSync(new URL("../visualization/config.json", import.meta.url), "utf8")
);

describe.each([
    { srcRH: true, destRH: false, playgroundId: "#DM9YI8#0" },
    { srcRH: true, destRH: true, playgroundId: "#9Y82AK#0" },
    { srcRH: false, destRH: true, playgroundId: "#ZZQCYZ#0" },
    { srcRH: false, destRH: false, playgroundId: "#UUOR2W#0" },
])("camera rotation fixture (srcRH=$srcRH, destRH=$destRH)", ({ srcRH, destRH, playgroundId }) => {
    it("uses a standalone playground without changing the reference model's facing", () => {
        const title = `GLTF Serializer camera rotation animation, ${srcRH ? "RH" : "LH"} -> ${destRH ? "RH" : "LH"}`;
        const fixture = config.tests.find((test) => test.title === title);
        if (!fixture) {
            throw new Error(`Missing camera rotation fixture: ${title}`);
        }
        expect(fixture.playgroundId).toBe(playgroundId);
        expect(fixture.replace).toBeUndefined();
        expect(fixture.referenceImage).toBe("glTFSerializerCameraRotationAnimation.png");

        const rotation = srcRH ? Quaternion.FromLookDirectionRH(Vector3.Forward(srcRH), Vector3.Up()) : Quaternion.FromLookDirectionLH(Vector3.Forward(srcRH), Vector3.Up());

        const front = Vector3.Forward().rotateByQuaternionToRef(rotation, new Vector3());
        const right = Vector3.Right().rotateByQuaternionToRef(rotation, new Vector3());
        const up = Vector3.Up().rotateByQuaternionToRef(rotation, new Vector3());
        expect(Vector3.Distance(front, Vector3.Backward())).toBeCloseTo(0, 6);
        expect(Vector3.Distance(right, Vector3.Left())).toBeCloseTo(0, 6);
        expect(Vector3.Distance(up, Vector3.Up())).toBeCloseTo(0, 6);
    });
});
