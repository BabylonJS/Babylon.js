import type { ThinEngine } from "core/Engines/thinEngine.js";
import type { Nullable } from "core/types.js";
import type { SmartFilterRuntime } from "./runtime/smartFilterRuntime.js";
import type { BaseBlock } from "./blockFoundation/baseBlock.js";
import type { ConnectionPointType } from "./connection/connectionPointType.js";
import type { ConnectionPoint } from "./connection/connectionPoint.js";
import { OutputBlock } from "./blockFoundation/outputBlock.js";
import { InternalSmartFilterRuntime } from "./runtime/smartFilterRuntime.js";
import { RenderTargetGenerator } from "./runtime/renderTargetGenerator.js";
import { AggregateBlock } from "./blockFoundation/aggregateBlock.js";
import type { IEditorData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo.js";
import type { IDisposable } from "./IDisposable.js";
import { ShaderBlock } from "./blockFoundation/shaderBlock.js";
import type { ThinRenderTargetTexture } from "core/Materials/Textures/thinRenderTargetTexture.js";
import { GetBlockOutputTextureSize } from "./utils/textureUtils.js";

/**
 * How long to wait for shader compilation and texture loading to complete before erroring out.
 */
const InitializationTimeout = 10000;

/**
 * Data passed to the initialize function of the blocks.
 */
export type InitializationData = {
    /**
     * The current smart filter runtime the block is being initialized for.
     */
    readonly runtime: InternalSmartFilterRuntime;

    /**
     * The output block of the smart filter.
     * This is used to determine if a block is linked to the output block so that we can prevent an
     * extra render pass.
     */
    readonly outputBlock: OutputBlock;

    /**
     * The list of promises to wait for during the initialization step.
     */
    readonly initializationPromises: Promise<void>[];

    /**
     * Resources that need to be disposed when the runtime is disposed.
     */
    readonly disposableResources: IDisposable[];
};

/**
 * The smart filter class is the main class of the smart filter module.
 *
 * It is responsible for managing a graph of smart filter blocks.
 *
 * It is also responsible for creating the runtime associated to the current state of the filter.
 */
export class SmartFilter {
    /**
     * The friendly name of the smart filter.
     */
    public readonly name: string;

    /**
     * The namespace of the smart filter.
     */
    public readonly namespace: Nullable<string>;

    /**
     * The smart filter output (input connection point of the output block...).
     *
     * This is where the smart filter final block should be connected to in order to be visible on screen.
     */
    public readonly output: ConnectionPoint<ConnectionPointType.Texture>;

    /**
     * The output block of the smart filter.
     */
    public readonly outputBlock: OutputBlock;

    /**
     * User defined comments to describe the current smart filter.
     */
    public comments: Nullable<string> = null;

    /**
     * Data used by the smart filter editor.
     */
    public editorData: Nullable<IEditorData> = null;

    private readonly _attachedBlocks: Array<BaseBlock>;
    /**
     * Creates a new instance of a @see SmartFilter.
     * @param name - The friendly name of the smart filter
     * @param namespace - The namespace of the smart filter
     */
    constructor(name: string, namespace: Nullable<string> = null) {
        this.name = name;
        this.namespace = namespace;

        this._attachedBlocks = new Array<BaseBlock>();
        this.outputBlock = new OutputBlock(this);
        this.output = this.outputBlock.input;
    }

    /**
     * @returns the list of blocks attached to the smart filter.
     */
    public get attachedBlocks(): ReadonlyArray<BaseBlock> {
        return this._attachedBlocks;
    }

    /**
     * @returns The current class name of the smart filter.
     */
    public getClassName(): string {
        return "SmartFilter";
    }

    /**
     * Registers a block to be part of this smart filter.
     * @param block - The block to register on the smart filter
     * @throws if the block is already registered on another smart filter
     * @remarks This function will not register the block if it is already registered on the smart filter.
     */
    public registerBlock(block: BaseBlock): void {
        // It is impossible to attach a block from another filter
        if (block.smartFilter !== this) {
            throw new Error("Block is not part of this smart filter");
        }

        // No need to attach a block several times
        if (this._attachedBlocks.indexOf(block) !== -1) {
            return;
        }

        // Add the block to the list of attached blocks
        this._attachedBlocks.push(block);
    }

    /**
     * Removes the block from the smart filter.
     * @param block - The block to remove from the smart filter
     * @remarks This function will disconnect the block on removal.
     * This Output block cannot be removed.
     */
    public removeBlock(block: BaseBlock): void {
        const attachedBlockIndex = this._attachedBlocks.indexOf(block);

        // The block can only be removed if it is not the output block
        // and if it is attached to the smart filter
        if (attachedBlockIndex > -1 && !block.isOutput) {
            // Disconnects all the connections of the block
            block.disconnect();

            // Removes the block from the list of attached blocks
            this._attachedBlocks.splice(attachedBlockIndex, 1);
        }
    }

    private _generateCommandsAndGatherInitPromises(initializationData: InitializationData): void {
        const outputBlock = this.outputBlock;

        outputBlock.visit(initializationData, (block: BaseBlock, initializationData: InitializationData) => {
            block.generateCommandsAndGatherInitPromises(initializationData, outputBlock.input.connectedTo?.ownerBlock === block);
        });
    }

    /**
     * Create a new runtime for the current state of the smart filter.
     * @param engine - The Babylon.js engine to use for the runtime
     * @param renderTargetGenerator - The render target generator to use to generate the RTTs for the shader blocks. If not provided, a default one will be created.
     * @returns the runtime that can be used to render the smart filter
     */
    public async createRuntimeAsync(engine: ThinEngine, renderTargetGenerator?: RenderTargetGenerator): Promise<SmartFilterRuntime> {
        const runtime = new InternalSmartFilterRuntime(engine);

        const initializationData: InitializationData = {
            runtime,
            outputBlock: this.outputBlock,
            initializationPromises: [],
            disposableResources: [],
        };

        this._workWithAggregateFreeGraph(() => {
            this.outputBlock.prepareForRuntime();

            renderTargetGenerator = renderTargetGenerator ?? new RenderTargetGenerator(false);
            renderTargetGenerator.setOutputTextures(this, initializationData);

            this.outputBlock.propagateRuntimeData();

            this._generateCommandsAndGatherInitPromises(initializationData);
        });

        // Wait for all the blocks to be initialized
        if (initializationData.initializationPromises.length > 0) {
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, InitializationTimeout, true));
            // eslint-disable-next-line github/no-then
            const initializationPromises = Promise.all(initializationData.initializationPromises).then(() => false);
            const timedOut = await Promise.race([initializationPromises, timeoutPromise]);
            if (timedOut) {
                throw new Error("Initialization promises timed out");
            }
        }

        // Register the resources to dispose when the runtime is disposed
        initializationData.disposableResources.forEach((resource) => runtime.registerResource(resource));

        return runtime;
    }

    /**
     * Resizes any intermediate textures according to the new size of the render target
     * @param engine - The engine used to render the smart filter
     */
    public resize(engine: ThinEngine): void {
        this._workWithAggregateFreeGraph(() => {
            this.outputBlock.visit({}, (block: BaseBlock) => {
                if (!(block instanceof ShaderBlock)) {
                    return;
                }

                if (block.output.runtimeData?.value) {
                    const size = GetBlockOutputTextureSize(this, engine, block.outputTextureOptions);
                    (block.output.runtimeData.value as ThinRenderTargetTexture).resize(size);
                }
            });
        });
    }

    /**
     * @internal
     * Merges all aggregate blocks into the smart filter graph, executes the passed-in work, then restores the aggregate blocks.
     * @param work - The work to execute with the aggregate blocks merged
     */
    public _workWithAggregateFreeGraph(work: () => void): void {
        const mergedAggregateBlocks: AggregateBlock[] = [];

        // Merge all aggregate blocks
        this.outputBlock.visit({}, (block: BaseBlock, _extraData: object) => {
            if (block instanceof AggregateBlock) {
                block._mergeIntoSmartFilter(mergedAggregateBlocks);
            }
        });

        try {
            // Do the passed in work
            work();
        } finally {
            // Restore all aggregate blocks, even if work throws
            for (const block of mergedAggregateBlocks) {
                block._unmergeFromSmartFilter();
            }
        }
    }
}
