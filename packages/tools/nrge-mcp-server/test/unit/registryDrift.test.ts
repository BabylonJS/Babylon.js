/**
 * Node Render Graph MCP Server – Registry Drift Guard
 *
 * Constructs every real Babylon.js block referenced by the MCP block registry and
 * verifies that the registry's declared input/output port NAMES match the block's
 * actual ports. Port names are the wiring contract the AI agent relies on
 * (connect_blocks matches by name), so any drift here means the agent cannot wire a
 * real port — or worse, produces a dangling connection that silently drops.
 *
 * NodeRenderGraph blocks require a FrameGraph + Scene to construct, and some need
 * additional construction parameters (mirrored by defaultAdditionalConstructionParameters
 * in the registry), so this guard builds a NullEngine-backed harness.
 */
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { GetClass } from "core/Misc/typeStore";
import { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";

// Side-effect import: register ALL NRGE block types via RegisterClass
import "core/FrameGraph/Node/Blocks/index";
// Side-effect import: FrameGraph loads this lazily (async); import it statically so
// engine methods such as buildTextureLayout exist synchronously for block construction.
import "core/Engines/Extensions/engine.multiRender";

import { BlockRegistry } from "../../src/blockRegistry";

/**
 * Renderer/layer/post-process blocks create GPU FrameGraph tasks in their constructor
 * (e.g. via _createFrameGraphObject / _createTask, or an inline `new FrameGraph*Task(...)`).
 * Those tasks need a real GL context and throw under NullEngine. Port registration always
 * happens BEFORE task creation, so to read the full port set headlessly we:
 *   1. Capture every registerInput/registerOutput name (works even if the constructor throws
 *      later at the inline task-creation call), and
 *   2. No-op the task-creation methods on the constructor prototype so a task creation reached
 *      during super() does not throw before the subclass registers its own ports.
 * Any residual throw at an inline task creation is caught — all ports are already captured by then.
 */
const TASK_CREATION_METHODS = ["_createFrameGraphObject", "_createTask"] as const;

describe("Node Render Graph MCP Server – Registry Drift", () => {
    let engine: NullEngine;
    let scene: Scene;
    let frameGraph: FrameGraph;

    let capturedInputs: string[];
    let capturedOutputs: string[];
    let originalRegisterInput: typeof NodeRenderGraphBlock.prototype.registerInput;
    let originalRegisterOutput: typeof NodeRenderGraphBlock.prototype.registerOutput;

    beforeEach(() => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        scene = new Scene(engine);
        frameGraph = new FrameGraph(scene);

        capturedInputs = [];
        capturedOutputs = [];
        originalRegisterInput = NodeRenderGraphBlock.prototype.registerInput;
        originalRegisterOutput = NodeRenderGraphBlock.prototype.registerOutput;
        NodeRenderGraphBlock.prototype.registerInput = function (this: NodeRenderGraphBlock, name: string, ...rest: any[]) {
            capturedInputs.push(name);
            return (originalRegisterInput as any).call(this, name, ...rest);
        } as any;
        NodeRenderGraphBlock.prototype.registerOutput = function (this: NodeRenderGraphBlock, name: string, ...rest: any[]) {
            capturedOutputs.push(name);
            return (originalRegisterOutput as any).call(this, name, ...rest);
        } as any;
    });

    afterEach(() => {
        NodeRenderGraphBlock.prototype.registerInput = originalRegisterInput;
        NodeRenderGraphBlock.prototype.registerOutput = originalRegisterOutput;
        frameGraph.dispose();
        scene.dispose();
        engine.dispose();
    });

    // Construct a block, capturing its registered port names. Task-creation methods are
    // temporarily neutralized so a task creation reached during super() cannot throw before
    // the subclass finishes registering its ports.
    const collectPorts = (ctor: any, extra: any[]): { inputs: string[]; outputs: string[] } => {
        capturedInputs = [];
        capturedOutputs = [];

        const savedDescriptors = new Map<string, PropertyDescriptor | undefined>();
        for (const method of TASK_CREATION_METHODS) {
            savedDescriptors.set(method, Object.getOwnPropertyDescriptor(ctor.prototype, method));
            Object.defineProperty(ctor.prototype, method, { value: () => {}, configurable: true, writable: true });
        }

        try {
            // eslint-disable-next-line no-new
            new ctor(`${ctor.name}_drift`, frameGraph, scene, ...extra);
        } catch {
            // Inline task creation may still throw after all ports are registered; ports are already captured.
        } finally {
            for (const method of TASK_CREATION_METHODS) {
                const descriptor = savedDescriptors.get(method);
                if (descriptor) {
                    Object.defineProperty(ctor.prototype, method, descriptor);
                } else {
                    delete ctor.prototype[method];
                }
            }
        }

        return { inputs: [...new Set(capturedInputs)], outputs: [...new Set(capturedOutputs)] };
    };

    it("registry input/output port names match the real Babylon blocks", () => {
        const problems: string[] = [];

        for (const [key, info] of Object.entries(BlockRegistry)) {
            const ctor = GetClass(`BABYLON.${info.className}`);
            if (!ctor) {
                problems.push(`${key}: no class registered as "BABYLON.${info.className}"`);
                continue;
            }

            const extra = info.defaultAdditionalConstructionParameters ?? [];
            const { inputs: realInputs, outputs: realOutputs } = collectPorts(ctor, extra);
            const regInputs = info.inputs.map((i) => i.name);
            const regOutputs = info.outputs.map((o) => o.name);

            const missingInputs = realInputs.filter((n) => !regInputs.includes(n));
            const extraInputs = regInputs.filter((n) => !realInputs.includes(n));
            const missingOutputs = realOutputs.filter((n) => !regOutputs.includes(n));
            const extraOutputs = regOutputs.filter((n) => !realOutputs.includes(n));

            const details: string[] = [];
            if (missingInputs.length) {
                details.push(`inputs missing from registry: [${missingInputs.join(", ")}]`);
            }
            if (extraInputs.length) {
                details.push(`inputs in registry but not on block: [${extraInputs.join(", ")}]`);
            }
            if (missingOutputs.length) {
                details.push(`outputs missing from registry: [${missingOutputs.join(", ")}]`);
            }
            if (extraOutputs.length) {
                details.push(`outputs in registry but not on block: [${extraOutputs.join(", ")}]`);
            }
            if (details.length) {
                problems.push(`${info.className}: ${details.join("; ")}`);
            }
        }

        expect(problems, `Registry drift detected:\n${problems.join("\n")}`).toEqual([]);
    });
});
