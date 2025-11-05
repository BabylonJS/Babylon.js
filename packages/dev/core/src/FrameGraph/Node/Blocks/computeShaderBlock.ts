import type { NodeRenderGraphConnectionPoint, Scene, FrameGraph, IComputeShaderPath, IComputeShaderOptions } from "core/index";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import { FrameGraphComputeShaderTask } from "../../Tasks/Misc/computeShaderTask";

/**
 * Block used to execute a compute shader in the frame graph
 */
export class NodeRenderGraphComputeShaderBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphComputeShaderTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Creates a new NodeRenderGraphComputeShaderBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param computeShaderPath defines the compute shader path or source
     * @param computeShaderOptions defines the compute shader options
     */
    public constructor(
        name: string,
        frameGraph: FrameGraph,
        scene: Scene,
        computeShaderPath: string | IComputeShaderPath = "@compute @workgroup_size(1, 1, 1)\nfn main() {}",
        computeShaderOptions: IComputeShaderOptions = { bindingsMapping: {} }
    ) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [computeShaderPath, computeShaderOptions];

        this._addDependenciesInput(
            NodeRenderGraphBlockConnectionPointTypes.Camera | NodeRenderGraphBlockConnectionPointTypes.ShadowLight | NodeRenderGraphBlockConnectionPointTypes.ObjectList
        );

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ResourceContainer);

        this._frameGraphTask = new FrameGraphComputeShaderTask(name, frameGraph, computeShaderPath, computeShaderOptions);
    }

    private _createTask(shaderPath: string | IComputeShaderPath, shaderOptions?: IComputeShaderOptions) {
        const dispatchSize = this._frameGraphTask.dispatchSize;
        const indirectDispatch = this._frameGraphTask.indirectDispatch;
        const execute = this._frameGraphTask.execute;

        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphComputeShaderTask(this.name, this._frameGraph, shaderPath, shaderOptions);

        this._frameGraphTask.dispatchSize = dispatchSize;
        this._frameGraphTask.indirectDispatch = indirectDispatch;
        this._frameGraphTask.execute = execute;

        this._additionalConstructionParameters = [shaderPath, shaderOptions];
    }

    /**
     * Gets or sets the execute function
     */
    public get shaderPath(): string | IComputeShaderPath {
        return this._frameGraphTask.computeShader.shaderPath;
    }

    public set shaderPath(path: string | IComputeShaderPath) {
        this._createTask(path, this.shaderOptions);
    }

    /**
     * Gets or sets the execute when task disabled function
     */
    public get shaderOptions(): IComputeShaderOptions {
        return this._frameGraphTask.computeShader.options;
    }

    public set shaderOptions(options: IComputeShaderOptions) {
        this._createTask(this.shaderPath, options);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphComputeShaderBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }
}

RegisterClass("BABYLON.NodeRenderGraphComputeShaderBlock", NodeRenderGraphComputeShaderBlock);
