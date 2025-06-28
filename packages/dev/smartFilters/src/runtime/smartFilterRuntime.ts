import { EffectRenderer } from "core/Materials/effectRenderer.js";
import type { ThinEngine } from "core/Engines/thinEngine.js";
import { CommandBuffer } from "../command/commandBuffer.js";
import type { IDisposable } from "../IDisposable.js";
import type { Command } from "../command/command.js";

/**
 * A runtime is a snapshot of a smart filter containing all the
 * required data to render it as well as the entire command buffer.
 */
export type SmartFilterRuntime = {
    /**
     * The command buffer containing all the commands to execute during a frame.
     */
    readonly commandBuffer: Readonly<CommandBuffer>;

    /**
     * Renders one frame of the smart filter.
     */
    render(): void;

    /**
     * Dispose the runtime and all its associated resources
     */
    dispose(): void;
};

/**
 * The internal runtime implementation exposing more information than @see SmartFilterRuntime.
 * This is used internally to render the smart filter.
 *
 * It is not fully exposed publicly to prevent any misuse of the runtime.
 */
export class InternalSmartFilterRuntime implements SmartFilterRuntime {
    /**
     * The engine used by the smart filter.
     */
    public readonly engine: ThinEngine;

    /**
     * The effect renderer used by the smart filter.
     */
    public readonly effectRenderer: EffectRenderer;

    /**
     * The command buffer containing all the commands to execute during a frame.
     */
    public readonly commandBuffer: CommandBuffer;

    private readonly _resources: IDisposable[];

    /**
     * Instantiates a new smart filter runtime for one given engine.
     * @param engine - the engine to use to render the smart filter
     */
    constructor(engine: ThinEngine) {
        this.engine = engine;

        this._resources = [];

        this.commandBuffer = new CommandBuffer();

        this.effectRenderer = new EffectRenderer(engine);
        this.registerResource(this.effectRenderer);
    }

    /**
     * Register a resource to be disposed when the runtime is disposed.
     * @param resource - defines the resource to dispose once the runtime is disposed
     */
    public registerResource(resource: IDisposable): void {
        this._resources.push(resource);
    }

    /**
     * Registers a command to be executed during the render loop.
     * @param command - defines the command to execute
     */
    public registerCommand(command: Command): void {
        this.commandBuffer.push(command);
    }

    /**
     * Renders the smart filter.
     * This function will execute all the commands contained int the command buffer.
     */
    public render(): void {
        try {
            const depthTest = this.engine.depthCullingState.depthTest;
            const stencilTest = this.engine.stencilState.stencilTest;

            this.commandBuffer.execute();

            // EffectRenderer.applyEffectWrapper(), which is called by ShaderRuntime._draw(),
            // sets the depth/stencil state, so we need to restore it.
            this.engine.depthCullingState.depthTest = depthTest;
            this.engine.stencilState.stencilTest = stencilTest;
        } catch (e) {
            // eslint-disable-next-line no-debugger
            debugger;
        }
    }

    /**
     * Dispose the runtime and all its associated resources
     */
    public dispose(): void {
        for (const resource of this._resources) {
            resource.dispose();
        }
    }
}
