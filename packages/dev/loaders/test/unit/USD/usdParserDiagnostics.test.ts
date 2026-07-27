import { describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";

// Malformed but recoverable: the prim metadata block omits the '=' after `kind`. The parser diagnoses the
// problem and recovers, still producing the `World` Xform. Before parser diagnostics were carried through
// the resolved stage, this recovered silently (the diagnostic lived only in opaque layer metadata), so the
// stage was indistinguishable from a clean parse.
const recoverableUsda = `#usda 1.0
def Xform "World" (
    kind
)
{
}
`;

// The same prim without the malformed metadata, used to show a genuinely clean source carries no
// source-located parser diagnostic.
const cleanUsda = `#usda 1.0
def Xform "World"
{
}
`;

const noFetch = () => {
    throw new Error("USDA parser-diagnostic tests must not fetch external layers.");
};

describe("USDA parser diagnostic propagation", () => {
    it("converts recoverable parser diagnostics into resolved-stage diagnostics with severity and source location", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(recoverableUsda, "", "recoverable.usda", {}, noFetch);

        // The stage still resolves the recovered prim rather than failing.
        expect(stage.root.children.map((prim) => prim.name)).toEqual(["World"]);

        const diagnostic = stage.diagnostics.find((entry) => entry.message.includes("Expected '=' after prim metadata key 'kind'"));
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("warning");
        expect(diagnostic!.sourceLocation).toBeDefined();
        expect(diagnostic!.sourceLocation!.line).toBeGreaterThan(0);
        expect(diagnostic!.sourceLocation!.column).toBeGreaterThan(0);
    });

    it("does not let malformed-but-recoverable USDA produce a silently clean stage", async () => {
        const clean = await ResolveUsdStageWithFetcherAsync(cleanUsda, "", "clean.usda", {}, noFetch);
        const recovered = await ResolveUsdStageWithFetcherAsync(recoverableUsda, "", "recoverable.usda", {}, noFetch);

        // Both sources resolve to the same World prim, but only the malformed one advertises a parser warning.
        expect(clean.root.children.map((prim) => prim.name)).toEqual(recovered.root.children.map((prim) => prim.name));
        expect(clean.diagnostics.some((entry) => entry.sourceLocation !== undefined)).toBe(false);
        expect(recovered.diagnostics.some((entry) => entry.severity === "warning" && entry.sourceLocation !== undefined)).toBe(true);
    });

    it("emits propagated parser diagnostics through the SceneLoader logger", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        try {
            await new USDFileLoader().loadAsync(scene, recoverableUsda, "", undefined, "recoverable.usda");

            const logged = warn.mock.calls.map((call) => String(call[0]));
            expect(logged.some((message) => message.includes("Expected '=' after prim metadata key 'kind'") && /line \d+, column \d+/.test(message))).toBe(true);
        } finally {
            warn.mockRestore();
            scene.dispose();
            engine.dispose();
        }
    });

    it("keeps fatal parser failures as load failures rather than success-shaped diagnostics", async () => {
        // A missing '#usda 1.0' header is a fatal parse error: it must reject the load, never resolve to a
        // stage that carries an error diagnostic in place of a real failure.
        await expect(ResolveUsdStageWithFetcherAsync("not a usd document", "", "bad.usda", {}, noFetch)).rejects.toThrow(/#usda 1\.0/);
    });
});
