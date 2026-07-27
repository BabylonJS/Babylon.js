import { describe, expect, it } from "vitest";
import { ComposeLayerStack } from "loaders/USD/resolution/composition/composeLayerStack";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";
import { UsdConfigurationError, UsdResourceLimitError } from "loaders/USD/usdErrors";
import { type ISdfLayer, type ISdfPrimSpec } from "loaders/USD/resolution/sdf";

// Composition of untrusted USD must be bounded on three axes: recursion depth (so deep arc chains
// cannot overflow the native call stack), output node count, and actual prim-level work (so
// super-linear merging/cloning is rejected even when the output is small). Invalid limit options are
// rejected up front with a typed configuration error.

type Resolve = (assetPath: string) => ISdfLayer | undefined;

function createLayer(identifier: string, rootPrims: ISdfPrimSpec[], subLayers: ISdfLayer["subLayers"] = []): ISdfLayer {
    return { identifier, subLayers, rootPrims };
}

function createPrim(path: string, overrides: Partial<ISdfPrimSpec> = {}): ISdfPrimSpec {
    return {
        name: path.slice(path.lastIndexOf("/") + 1),
        path,
        specifier: "def",
        typeName: "Xform",
        properties: {},
        children: [],
        ...overrides,
    };
}

function expectResourceLimitError(fn: () => unknown, kind: UsdResourceLimitError["kind"]): UsdResourceLimitError {
    let caught: unknown;
    try {
        fn();
    } catch (error) {
        caught = error;
    }
    expect(caught).toBeInstanceOf(UsdResourceLimitError);
    const limitError = caught as UsdResourceLimitError;
    expect(limitError.kind).toBe(kind);
    return limitError;
}

// Builds a chain of external layers L0 -> L1 -> ... each referencing (or paying-load-ing) the next, so
// composing L0 recurses one prim per layer (node count is linear in the depth).
function buildExternalChain(kind: "reference" | "payload", depth: number): { root: ISdfLayer; resolve: Resolve } {
    const layers = new Map<string, ISdfLayer>();
    for (let index = 0; index < depth; index++) {
        const overrides: Partial<ISdfPrimSpec> = {};
        if (index < depth - 1) {
            const listOp = { isExplicit: true as const, explicit: [{ assetPath: `L${index + 1}.usd`, primPath: `/P${index + 1}` }] };
            if (kind === "reference") {
                overrides.references = listOp;
            } else {
                overrides.payloads = listOp;
            }
        }
        layers.set(`L${index}.usd`, createLayer(`L${index}.usd`, [createPrim(`/P${index}`, overrides)]));
    }
    return { root: layers.get("L0.usd")!, resolve: (assetPath) => layers.get(assetPath) };
}

// Builds a single layer whose root prims form an internal path-arc chain P0 -> P1 -> ... via inherits
// or specializes, so composing P0 recurses one prim per link.
function buildInternalChain(kind: "inherits" | "specializes", depth: number): ISdfLayer {
    const prims: ISdfPrimSpec[] = [];
    for (let index = 0; index < depth; index++) {
        const overrides: Partial<ISdfPrimSpec> = {};
        if (index < depth - 1) {
            const listOp = { isExplicit: true as const, explicit: [`/P${index + 1}`] };
            if (kind === "inherits") {
                overrides.inherits = listOp;
            } else {
                overrides.specializes = listOp;
            }
        }
        prims.push(createPrim(`/P${index}`, overrides));
    }
    return createLayer("root.usd", prims);
}

// Builds a stage whose root sublayers all define the same prim subtree, so composition merges the same
// subtree once per sublayer: the work grows with sublayerCount * childCount while the output stays tiny.
function buildMergeHeavyStage(sublayerCount: number, childCount: number): { root: ISdfLayer; resolve: Resolve } {
    const layers = new Map<string, ISdfLayer>();
    const subLayers: ISdfLayer["subLayers"] = [];
    for (let index = 0; index < sublayerCount; index++) {
        const children = Array.from({ length: childCount }, (_, childIndex) => createPrim(`/World/C${childIndex}`));
        layers.set(`sub${index}.usd`, createLayer(`sub${index}.usd`, [createPrim("/World", { children })]));
        subLayers.push({ assetPath: `sub${index}.usd` });
    }
    return { root: createLayer("root.usd", [], subLayers), resolve: (assetPath) => layers.get(assetPath) };
}

// Builds a stage that references prims out of a single large shared library layer many times. When
// primPath selects one small prim, the real output is tiny; when it is omitted, each reference grafts
// the whole library subtree.
function buildLibraryReferenceStage(libraryChildCount: number, referenceCount: number, primPath?: string): { root: ISdfLayer; resolve: Resolve } {
    const children = Array.from({ length: libraryChildCount }, (_, index) => createPrim(`/Lib/C${index}`));
    const library = createLayer("lib.usd", [createPrim("/Lib", { children })]);
    const roots = Array.from({ length: referenceCount }, (_, index) =>
        createPrim(`/R${index}`, {
            references: { isExplicit: true, explicit: [primPath ? { assetPath: "lib.usd", primPath } : { assetPath: "lib.usd" }] },
        })
    );
    return { root: createLayer("root.usd", roots), resolve: (assetPath) => (assetPath === "lib.usd" ? library : undefined) };
}

describe("USD composition node budget accounts for grafted output, not cloned scratch", () => {
    it("does not over-count the node budget when referencing a small prim from a large shared library many times", () => {
        const { root, resolve } = buildLibraryReferenceStage(50, 10, "/Lib/C0");
        // The real output is tiny (10 referencing prims + 10 one-prim grafts), so a 100-node budget is ample.
        expect(() => ComposeLayerStack(root, resolve, { maxCompositionNodes: 100 })).not.toThrow();
    });

    it("still rejects whole-library reference amplification on the node budget", () => {
        const { root, resolve } = buildLibraryReferenceStage(50, 10);
        const error = expectResourceLimitError(() => ComposeLayerStack(root, resolve, { maxCompositionNodes: 100 }), "composition-nodes");
        expect(error.limit).toBe(100);
    });

    it("does not double-count the ambiguous multi-root default-prim graft", () => {
        const libraryRoots = [createPrim("/Lib0"), createPrim("/Lib1")];
        const library: ISdfLayer = { identifier: "lib.usd", subLayers: [], rootPrims: libraryRoots };
        const root = createLayer("root.usd", [createPrim("/R0", { references: { isExplicit: true, explicit: [{ assetPath: "lib.usd" }] } })]);
        const resolve: Resolve = (assetPath) => (assetPath === "lib.usd" ? library : undefined);
        // Output is 1 referencing prim + a synthetic wrapper + 2 grafted roots; the grafted children must
        // be counted once, not once per graft site.
        expect(() => ComposeLayerStack(root, resolve, { maxCompositionNodes: 7 })).not.toThrow();
    });
});

describe("USD composition depth budget", () => {
    it.each(["reference", "payload"] as const)("bounds a deep external %s chain with a typed depth error, below the node cap", (kind) => {
        const { root, resolve } = buildExternalChain(kind, 40);
        const error = expectResourceLimitError(() => ComposeLayerStack(root, resolve, { maxCompositionDepth: 16 }), "composition-depth");
        expect(error.limit).toBe(16);
        expect(error.actual).toBe(17);
    });

    it.each(["inherits", "specializes"] as const)("bounds a deep internal %s chain with a typed depth error, below the node cap", (kind) => {
        const layer = buildInternalChain(kind, 40);
        const error = expectResourceLimitError(() => ComposeLayerStack(layer, () => undefined, { maxCompositionDepth: 16 }), "composition-depth");
        expect(error.limit).toBe(16);
    });

    it("rejects a pathologically deep chain with a typed error under the default depth, not a native RangeError", () => {
        const { root, resolve } = buildExternalChain("reference", 5000);
        expectResourceLimitError(() => ComposeLayerStack(root, resolve), "composition-depth");
        expect(() => ComposeLayerStack(root, resolve)).not.toThrow(RangeError);
    });

    it("composes an ordinary moderately-deep chain under the default depth", () => {
        const { root, resolve } = buildExternalChain("reference", 50);
        expect(() => ComposeLayerStack(root, resolve)).not.toThrow();
    });
});

describe("USD composition work budget", () => {
    it("bounds super-linear merge work even when the output stays small", () => {
        const { root, resolve } = buildMergeHeavyStage(200, 50);
        const error = expectResourceLimitError(() => ComposeLayerStack(root, resolve, { maxCompositionWork: 500 }), "composition-work");
        expect(error.limit).toBe(500);
    });

    it("charges work independently of the node budget", () => {
        const { root, resolve } = buildMergeHeavyStage(200, 50);
        // Node budget is ample (the flattened output is ~51 prims) yet the work budget still trips.
        const error = expectResourceLimitError(() => ComposeLayerStack(root, resolve, { maxCompositionNodes: 1_000_000, maxCompositionWork: 100 }), "composition-work");
        expect(error.limit).toBe(100);
    });

    it("composes the same merge-heavy stage under the default work budget", () => {
        const { root, resolve } = buildMergeHeavyStage(200, 50);
        expect(() => ComposeLayerStack(root, resolve)).not.toThrow();
    });
});

describe("USD composition option validation", () => {
    const emptyStage = () => createLayer("root.usd", []);

    it.each([
        ["NaN", Number.NaN],
        ["Infinity", Number.POSITIVE_INFINITY],
        ["-Infinity", Number.NEGATIVE_INFINITY],
        ["negative", -1],
        ["fractional", 1.5],
        ["unsafe integer", Number.MAX_SAFE_INTEGER + 2],
    ])("rejects a %s maxCompositionNodes with a UsdConfigurationError", (_label, value) => {
        expect(() => ComposeLayerStack(emptyStage(), () => undefined, { maxCompositionNodes: value })).toThrow(UsdConfigurationError);
    });

    it("rejects a non-number limit with a UsdConfigurationError", () => {
        expect(() => ComposeLayerStack(emptyStage(), () => undefined, { maxCompositionDepth: "16" as unknown as number })).toThrow(UsdConfigurationError);
    });

    it("validates every limit option, not only the first", () => {
        expect(() => ComposeLayerStack(emptyStage(), () => undefined, { maxCompositionWork: -5 })).toThrow(UsdConfigurationError);
        expect(() => ComposeLayerStack(emptyStage(), () => undefined, { maxCompositionDepth: Number.NaN })).toThrow(UsdConfigurationError);
    });

    it("accepts a limit of exactly zero and composes an empty stage, but rejects the first composed prim", () => {
        expect(() => ComposeLayerStack(emptyStage(), () => undefined, { maxCompositionNodes: 0 })).not.toThrow();
        const error = expectResourceLimitError(
            () => ComposeLayerStack(createLayer("root.usd", [createPrim("/P")]), () => undefined, { maxCompositionNodes: 0 }),
            "composition-nodes"
        );
        expect(error.limit).toBe(0);
        expect(error.actual).toBe(1);
    });
});

describe("USD composition limits propagate through the public loader options", () => {
    const usda = `#usda 1.0\ndef Xform "A" {\n    def Xform "B" {}\n    def Xform "C" {}\n}\n`;
    const noExternalFetch = async (): Promise<ArrayBuffer> => {
        throw new Error("no external assets");
    };

    it("applies maxCompositionNodes from USDLoadingOptions end to end", async () => {
        await expect(ResolveUsdStageWithFetcherAsync(usda, "", "stage.usda", { maxCompositionNodes: 1 }, noExternalFetch)).rejects.toBeInstanceOf(UsdResourceLimitError);
    });

    it("validates composition options at the public boundary before parsing", async () => {
        await expect(ResolveUsdStageWithFetcherAsync(usda, "", "stage.usda", { maxCompositionDepth: Number.NaN }, noExternalFetch)).rejects.toBeInstanceOf(UsdConfigurationError);
    });

    it("composes normally when the configured limits are ample", async () => {
        await expect(ResolveUsdStageWithFetcherAsync(usda, "", "stage.usda", {}, noExternalFetch)).resolves.toBeDefined();
    });
});
