import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphConvolutionTask } from "../../../Tasks/PostProcesses/convolutionTask";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";
import { ThinConvolutionPostProcess } from "../../../../PostProcesses/thinConvolutionPostProcess";

/**
 * Block that implements the convolution post process
 */
export class NodeRenderGraphConvolutionPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphConvolutionTask;

    public override _additionalConstructionParameters: [number[]];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphConvolutionPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param kernel Array of 9 values corresponding to the 3x3 kernel to be applied
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, kernel: number[] = ThinConvolutionPostProcess.EmbossKernel) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [kernel];

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphConvolutionTask(this.name, frameGraph, new ThinConvolutionPostProcess(name, frameGraph.engine, kernel));
    }

    private _createTask(kernelIndex: number) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;

        this._frameGraphTask.dispose();

        let kernel = ThinConvolutionPostProcess.EmbossKernel;
        switch (kernelIndex) {
            case 0:
                kernel = ThinConvolutionPostProcess.EdgeDetect0Kernel;
                break;
            case 1:
                kernel = ThinConvolutionPostProcess.EdgeDetect1Kernel;
                break;
            case 2:
                kernel = ThinConvolutionPostProcess.EdgeDetect2Kernel;
                break;
            case 3:
                kernel = ThinConvolutionPostProcess.SharpenKernel;
                break;
            case 4:
                kernel = ThinConvolutionPostProcess.EmbossKernel;
                break;
            case 5:
                kernel = ThinConvolutionPostProcess.GaussianKernel;
                break;
        }

        this._frameGraphTask = new FrameGraphConvolutionTask(this.name, this._frameGraph, new ThinConvolutionPostProcess(this.name, this._frameGraph.engine, kernel));
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;

        this._additionalConstructionParameters = [kernel];
    }

    /** The quality of the blur effect */
    @editableInPropertyPage("Kernel", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "EdgeDetect0", value: 0 },
            { label: "EdgeDetect1", value: 1 },
            { label: "EdgeDetect2", value: 2 },
            { label: "Sharpen", value: 3 },
            { label: "Emboss", value: 4 },
            { label: "Gaussian", value: 5 },
        ],
    })
    public get kernel(): number {
        const kernel = this._frameGraphTask.postProcess.kernel;

        if (kernel.every((value, index) => value === ThinConvolutionPostProcess.EdgeDetect0Kernel[index])) {
            return 0;
        }
        if (kernel.every((value, index) => value === ThinConvolutionPostProcess.EdgeDetect1Kernel[index])) {
            return 1;
        }
        if (kernel.every((value, index) => value === ThinConvolutionPostProcess.EdgeDetect2Kernel[index])) {
            return 2;
        }
        if (kernel.every((value, index) => value === ThinConvolutionPostProcess.SharpenKernel[index])) {
            return 3;
        }
        if (kernel.every((value, index) => value === ThinConvolutionPostProcess.EmbossKernel[index])) {
            return 4;
        }
        if (kernel.every((value, index) => value === ThinConvolutionPostProcess.GaussianKernel[index])) {
            return 5;
        }

        return 0;
    }

    public set kernel(value: number) {
        this._createTask(value);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphConvolutionPostProcessBlock";
    }
}

RegisterClass("BABYLON.NodeRenderGraphConvolutionPostProcessBlock", NodeRenderGraphConvolutionPostProcessBlock);
