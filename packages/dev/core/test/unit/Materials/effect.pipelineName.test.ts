import { describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";

describe("Effect pipeline name", () => {
    it("is the effect's key without carriage returns, its lines joined by |", async () => {
        const engine = new NullEngine();
        const effect = engine.createEffect(
            { vertexSource: "void main() {}", fragmentSource: "void main() {}" },
            { attributes: [], uniformsNames: [], samplers: [], defines: "#define A\r\n#define B\n#define C" },
            engine
        );
        await new Promise<void>((resolve) => effect.executeWhenCompiled(() => resolve()));

        expect(effect.getPipelineContext()!._name).toBe("void main() {}+void main() {}@#define A|#define B|#define C");
        engine.dispose();
    });
});
