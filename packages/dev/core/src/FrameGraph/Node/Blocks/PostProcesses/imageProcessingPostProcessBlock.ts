import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphImageProcessingTask } from "core/FrameGraph/Tasks/PostProcesses/imageProcessingTask";
import { ThinImageProcessingPostProcess } from "core/PostProcesses/thinImageProcessingPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { Color4 } from "../../../../Maths/math.color";

/**
 * Block that implements the image processing post process
 */
export class NodeRenderGraphImageProcessingPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphImageProcessingTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new image processing post process block
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphImageProcessingTask(
            this.name,
            frameGraph,
            new ThinImageProcessingPostProcess(name, scene.getEngine(), {
                scene,
                imageProcessingConfiguration: new ImageProcessingConfiguration(),
            })
        );
    }

    /** Contrast used in the effect */
    @editableInPropertyPage("Contrast", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 4 })
    public get contrast(): number {
        return this._frameGraphTask.postProcess.contrast;
    }

    public set contrast(value: number) {
        this._frameGraphTask.postProcess.contrast = value;
    }

    /** Exposure used in the effect */
    @editableInPropertyPage("Exposure", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 4 })
    public get exposure(): number {
        return this._frameGraphTask.postProcess.exposure;
    }

    public set exposure(value: number) {
        this._frameGraphTask.postProcess.exposure = value;
    }

    /** Whether the tone mapping effect is enabled. */
    @editableInPropertyPage("Enabled", PropertyTypeForEdition.Boolean, "TONE MAPPING")
    public get toneMappingEnabled(): boolean {
        return this._frameGraphTask.postProcess.toneMappingEnabled;
    }

    public set toneMappingEnabled(value: boolean) {
        this._frameGraphTask.postProcess.toneMappingEnabled = value;
    }

    /** Type of tone mapping effect. */
    @editableInPropertyPage("Type", PropertyTypeForEdition.List, "TONE MAPPING", {
        options: [
            { value: ImageProcessingConfiguration.TONEMAPPING_STANDARD, label: "Standard" },
            { value: ImageProcessingConfiguration.TONEMAPPING_ACES, label: "ACES" },
            { value: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL, label: "KHR PBR Neutral" },
        ],
    })
    public get toneMappingType(): number {
        return this._frameGraphTask.postProcess.toneMappingType;
    }

    public set toneMappingType(value: number) {
        this._frameGraphTask.postProcess.toneMappingType = value;
    }

    /** Whether the vignette effect is enabled. */
    @editableInPropertyPage("Enabled", PropertyTypeForEdition.Boolean, "VIGNETTE")
    public get vignetteEnabled(): boolean {
        return this._frameGraphTask.postProcess.vignetteEnabled;
    }

    public set vignetteEnabled(value: boolean) {
        this._frameGraphTask.postProcess.vignetteEnabled = value;
    }

    /** Vignette weight or intensity of the vignette effect. */
    @editableInPropertyPage("Weight", PropertyTypeForEdition.Float, "VIGNETTE", { min: 0, max: 4 })
    public get vignetteWeight(): number {
        return this._frameGraphTask.postProcess.vignetteWeight;
    }

    public set vignetteWeight(value: number) {
        this._frameGraphTask.postProcess.vignetteWeight = value;
    }

    /** Vignette stretch size. */
    @editableInPropertyPage("Stretch", PropertyTypeForEdition.Float, "VIGNETTE", { min: 0, max: 1 })
    public get vignetteStretch(): number {
        return this._frameGraphTask.postProcess.vignetteStretch;
    }

    public set vignetteStretch(value: number) {
        this._frameGraphTask.postProcess.vignetteStretch = value;
    }

    /** Camera field of view used by the Vignette effect. */
    @editableInPropertyPage("FOV", PropertyTypeForEdition.Float, "VIGNETTE", { min: 0, max: 3.14159 })
    public get vignetteCameraFov(): number {
        return this._frameGraphTask.postProcess.vignetteCameraFov;
    }

    public set vignetteCameraFov(value: number) {
        this._frameGraphTask.postProcess.vignetteCameraFov = value;
    }

    /** Vignette center X Offset. */
    @editableInPropertyPage("Center X", PropertyTypeForEdition.Float, "VIGNETTE", { min: 0, max: 1 })
    public get vignetteCenterX(): number {
        return this._frameGraphTask.postProcess.vignetteCenterX;
    }

    public set vignetteCenterX(value: number) {
        this._frameGraphTask.postProcess.vignetteCenterX = value;
    }

    /** Vignette center Y Offset. */
    @editableInPropertyPage("Center Y", PropertyTypeForEdition.Float, "VIGNETTE", { min: 0, max: 1 })
    public get vignetteCenterY(): number {
        return this._frameGraphTask.postProcess.vignetteCenterY;
    }

    public set vignetteCenterY(value: number) {
        this._frameGraphTask.postProcess.vignetteCenterY = value;
    }

    /** Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode) */
    @editableInPropertyPage("Color", PropertyTypeForEdition.Color4, "VIGNETTE")
    public get vignetteColor(): Color4 {
        return this._frameGraphTask.postProcess.vignetteColor;
    }

    public set vignetteColor(value: Color4) {
        this._frameGraphTask.postProcess.vignetteColor = value;
    }

    /** Vignette blend mode allowing different kind of effect. */
    @editableInPropertyPage("Blend mode", PropertyTypeForEdition.List, "VIGNETTE", {
        options: [
            { value: ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY, label: "Multiply" },
            { value: ImageProcessingConfiguration.VIGNETTEMODE_OPAQUE, label: "Opaque" },
        ],
    })
    public get vignetteBlendMode(): number {
        return this._frameGraphTask.postProcess.vignetteBlendMode;
    }

    public set vignetteBlendMode(value: number) {
        this._frameGraphTask.postProcess.vignetteBlendMode = value;
    }

    /** Whether the dithering effect is enabled. */
    @editableInPropertyPage("Enabed", PropertyTypeForEdition.Boolean, "DITHERING")
    public get ditheringEnabled(): boolean {
        return this._frameGraphTask.postProcess.ditheringEnabled;
    }

    public set ditheringEnabled(value: boolean) {
        this._frameGraphTask.postProcess.ditheringEnabled = value;
    }

    /** Sets whether the dithering effect is enabled. */
    @editableInPropertyPage("Intensity", PropertyTypeForEdition.Float, "DITHERING", { min: 0, max: 1 })
    public get ditheringIntensity(): number {
        return this._frameGraphTask.postProcess.ditheringIntensity;
    }

    public set ditheringIntensity(value: number) {
        this._frameGraphTask.postProcess.ditheringIntensity = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphImageProcessingPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.contrast = ${this.contrast};`);
        codes.push(`${this._codeVariableName}.exposure = ${this.exposure};`);
        codes.push(`${this._codeVariableName}.toneMappingEnabled = ${this.toneMappingEnabled};`);
        codes.push(`${this._codeVariableName}.toneMappingType = ${this.toneMappingType};`);
        codes.push(`${this._codeVariableName}.vignetteEnabled = ${this.vignetteEnabled};`);
        codes.push(`${this._codeVariableName}.vignetteWeight = ${this.vignetteWeight};`);
        codes.push(`${this._codeVariableName}.vignetteStretch = ${this.vignetteStretch};`);
        codes.push(`${this._codeVariableName}.vignetteCameraFov = ${this.vignetteCameraFov};`);
        codes.push(`${this._codeVariableName}.vignetteCenterX = ${this.vignetteCenterX};`);
        codes.push(`${this._codeVariableName}.vignetteCenterY = ${this.vignetteCenterY};`);
        codes.push(`${this._codeVariableName}.vignetteColor = new BABYLON.Color4(${this.vignetteColor.r}, ${this.vignetteColor.g}, ${this.vignetteColor.b}, 1);`);
        codes.push(`${this._codeVariableName}.vignetteBlendMode = ${this.vignetteBlendMode};`);
        codes.push(`${this._codeVariableName}.ditheringEnabled = ${this.ditheringEnabled};`);
        codes.push(`${this._codeVariableName}.ditheringIntensity = ${this.ditheringIntensity};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.contrast = this.contrast;
        serializationObject.exposure = this.exposure;
        serializationObject.toneMappingEnabled = this.toneMappingEnabled;
        serializationObject.toneMappingType = this.toneMappingType;
        serializationObject.vignetteEnabled = this.vignetteEnabled;
        serializationObject.vignetteWeight = this.vignetteWeight;
        serializationObject.vignetteStretch = this.vignetteStretch;
        serializationObject.vignetteCameraFov = this.vignetteCameraFov;
        serializationObject.vignetteCenterX = this.vignetteCenterX;
        serializationObject.vignetteCenterY = this.vignetteCenterY;
        serializationObject.vignetteColor = this.vignetteColor.asArray();
        serializationObject.vignetteBlendMode = this.vignetteBlendMode;
        serializationObject.ditheringEnabled = this.ditheringEnabled;
        serializationObject.ditheringIntensity = this.ditheringIntensity;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.contrast = serializationObject.contrast;
        this.exposure = serializationObject.exposure;
        this.toneMappingEnabled = serializationObject.toneMappingEnabled;
        this.toneMappingType = serializationObject.toneMappingType;
        this.vignetteEnabled = serializationObject.vignetteEnabled;
        this.vignetteWeight = serializationObject.vignetteWeight;
        this.vignetteStretch = serializationObject.vignetteStretch;
        this.vignetteCameraFov = serializationObject.vignetteCameraFov;
        this.vignetteCenterX = serializationObject.vignetteCenterX;
        this.vignetteCenterY = serializationObject.vignetteCenterY;
        this.vignetteColor = Color4.FromArray(serializationObject.vignetteColor);
        this.vignetteBlendMode = serializationObject.vignetteBlendMode;
        this.ditheringEnabled = serializationObject.ditheringEnabled;
        this.ditheringIntensity = serializationObject.ditheringIntensity;
    }
}

RegisterClass("BABYLON.NodeRenderGraphImageProcessingPostProcessBlock", NodeRenderGraphImageProcessingPostProcessBlock);
