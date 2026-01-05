import type {
    Scene,
    FrameGraph,
    NodeRenderGraphConnectionPoint,
    NodeRenderGraphBuildState,
    FrameGraphTextureHandle,
    Camera,
    NodeRenderGraphGeometryRendererBlock,
} from "core/index";
import { Constants } from "core/Engines/constants";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphSSRRenderingPipelineTask } from "../../../Tasks/PostProcesses/ssrRenderingPipelineTask";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the SSR post process
 */
export class NodeRenderGraphSSRPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphSSRRenderingPipelineTask;

    public override _additionalConstructionParameters: [number];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphSSRPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param textureType The texture type used by the different post processes created by SSR (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [textureType];

        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("geomDepth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("geomNormal", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("geomReflectivity", NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity);
        this.registerInput("geomBackDepth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);

        this.geomNormal.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal | NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal
        );
        this.geomDepth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth | NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth
        );
        this.geomBackDepth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth | NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth
        );

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphSSRRenderingPipelineTask(this.name, frameGraph, textureType);
    }

    private _createTask(textureType: number) {
        const sourceSamplingMode = this.sourceSamplingMode;
        const maxDistance = this.maxDistance;
        const step = this.step;
        const thickness = this.thickness;
        const strength = this.strength;
        const reflectionSpecularFalloffExponent = this.reflectionSpecularFalloffExponent;
        const maxSteps = this.maxSteps;
        const roughnessFactor = this.roughnessFactor;
        const selfCollisionNumSkip = this.selfCollisionNumSkip;
        const reflectivityThreshold = this.reflectivityThreshold;
        const ssrDownsample = this.ssrDownsample;
        const blurDispersionStrength = this.blurDispersionStrength;
        const blurDownsample = this.blurDownsample;
        const enableSmoothReflections = this.enableSmoothReflections;
        const attenuateScreenBorders = this.attenuateScreenBorders;
        const attenuateIntersectionDistance = this.attenuateIntersectionDistance;
        const attenuateIntersectionIterations = this.attenuateIntersectionIterations;
        const attenuateFacingCamera = this.attenuateFacingCamera;
        const attenuateBackfaceReflection = this.attenuateBackfaceReflection;
        const clipToFrustum = this.clipToFrustum;
        const enableAutomaticThicknessComputation = this.enableAutomaticThicknessComputation;
        const useFresnel = this.useFresnel;
        const inputTextureColorIsInGammaSpace = this.inputTextureColorIsInGammaSpace;
        const generateOutputInGammaSpace = this.generateOutputInGammaSpace;
        const debug = this.debug;

        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphSSRRenderingPipelineTask(this.name, this._frameGraph, textureType);

        this.sourceSamplingMode = sourceSamplingMode;
        this.maxDistance = maxDistance;
        this.step = step;
        this.thickness = thickness;
        this.strength = strength;
        this.reflectionSpecularFalloffExponent = reflectionSpecularFalloffExponent;
        this.maxSteps = maxSteps;
        this.roughnessFactor = roughnessFactor;
        this.selfCollisionNumSkip = selfCollisionNumSkip;
        this.reflectivityThreshold = reflectivityThreshold;
        this.ssrDownsample = ssrDownsample;
        this.blurDispersionStrength = blurDispersionStrength;
        this.blurDownsample = blurDownsample;
        this.enableSmoothReflections = enableSmoothReflections;
        this.attenuateScreenBorders = attenuateScreenBorders;
        this.attenuateIntersectionDistance = attenuateIntersectionDistance;
        this.attenuateIntersectionIterations = attenuateIntersectionIterations;
        this.attenuateFacingCamera = attenuateFacingCamera;
        this.attenuateBackfaceReflection = attenuateBackfaceReflection;
        this.clipToFrustum = clipToFrustum;
        this.useFresnel = useFresnel;
        this.enableAutomaticThicknessComputation = enableAutomaticThicknessComputation;
        this.inputTextureColorIsInGammaSpace = inputTextureColorIsInGammaSpace;
        this.generateOutputInGammaSpace = generateOutputInGammaSpace;
        this.debug = debug;

        this._additionalConstructionParameters = [textureType];
    }

    /** The texture type used by the different post processes created by SSR */
    @editableInPropertyPage("Texture type", PropertyTypeForEdition.TextureType, "SSR")
    public get textureType() {
        return this._frameGraphTask.textureType;
    }

    public set textureType(value: number) {
        this._createTask(value);
    }

    /** Gets or sets a boolean indicating if the effect should be rendered in debug mode */
    @editableInPropertyPage("Debug", PropertyTypeForEdition.Boolean, "SSR")
    public get debug() {
        return this._frameGraphTask.ssr.debug;
    }

    public set debug(value: boolean) {
        this._frameGraphTask.ssr.debug = value;
    }

    /** Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results */
    @editableInPropertyPage("Strength", PropertyTypeForEdition.Float, "SSR", { min: 0, max: 5 })
    public get strength() {
        return this._frameGraphTask.ssr.strength;
    }

    public set strength(value: number) {
        this._frameGraphTask.ssr.strength = value;
    }

    /** Gets or sets the falloff exponent used to compute the reflection strength. Higher values lead to fainter reflections */
    @editableInPropertyPage("Reflection exponent", PropertyTypeForEdition.Float, "SSR", { min: 0, max: 5 })
    public get reflectionSpecularFalloffExponent() {
        return this._frameGraphTask.ssr.reflectionSpecularFalloffExponent;
    }

    public set reflectionSpecularFalloffExponent(value: number) {
        this._frameGraphTask.ssr.reflectionSpecularFalloffExponent = value;
    }

    /** Gets or sets the minimum value for one of the reflectivity component of the material to consider it for SSR */
    @editableInPropertyPage("Reflectivity threshold", PropertyTypeForEdition.Float, "SSR", { min: 0, max: 1 })
    public get reflectivityThreshold() {
        return this._frameGraphTask.ssr.reflectivityThreshold;
    }

    public set reflectivityThreshold(value: number) {
        this._frameGraphTask.ssr.reflectivityThreshold = value;
    }

    /** Gets or sets the thickness value used as tolerance when computing the intersection between the reflected ray and the scene */
    @editableInPropertyPage("Thickness", PropertyTypeForEdition.Float, "SSR", { min: 0, max: 10 })
    public get thickness() {
        return this._frameGraphTask.ssr.thickness;
    }

    public set thickness(value: number) {
        this._frameGraphTask.ssr.thickness = value;
    }

    /** Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel */
    @editableInPropertyPage("Step", PropertyTypeForEdition.Int, "SSR", { min: 1, max: 50 })
    public get step() {
        return this._frameGraphTask.ssr.step;
    }

    public set step(value: number) {
        this._frameGraphTask.ssr.step = value;
    }

    /** Gets or sets whether or not smoothing reflections is enabled */
    @editableInPropertyPage("Smooth reflections", PropertyTypeForEdition.Boolean, "SSR")
    public get enableSmoothReflections() {
        return this._frameGraphTask.ssr.enableSmoothReflections;
    }

    public set enableSmoothReflections(value: boolean) {
        this._frameGraphTask.ssr.enableSmoothReflections = value;
    }

    /** Maximum number of steps during the ray marching process after which we consider an intersection could not be found */
    @editableInPropertyPage("Max steps", PropertyTypeForEdition.Int, "SSR", { min: 1, max: 3000 })
    public get maxSteps() {
        return this._frameGraphTask.ssr.maxSteps;
    }

    public set maxSteps(value: number) {
        this._frameGraphTask.ssr.maxSteps = value;
    }

    /** Gets or sets the max distance used to define how far we look for reflection during the ray-marching on the reflected ray */
    @editableInPropertyPage("Max distance", PropertyTypeForEdition.Float, "SSR", { min: 1, max: 3000 })
    public get maxDistance() {
        return this._frameGraphTask.ssr.maxDistance;
    }

    public set maxDistance(value: number) {
        this._frameGraphTask.ssr.maxDistance = value;
    }

    /** Gets or sets the factor applied when computing roughness */
    @editableInPropertyPage("Roughness factor", PropertyTypeForEdition.Float, "SSR", { min: 0, max: 1 })
    public get roughnessFactor() {
        return this._frameGraphTask.ssr.roughnessFactor;
    }

    public set roughnessFactor(value: number) {
        this._frameGraphTask.ssr.roughnessFactor = value;
    }

    /** Number of steps to skip at start when marching the ray to avoid self collisions */
    @editableInPropertyPage("Self collision skips", PropertyTypeForEdition.Int, "SSR", { min: 1, max: 10 })
    public get selfCollisionNumSkip() {
        return this._frameGraphTask.ssr.selfCollisionNumSkip;
    }

    public set selfCollisionNumSkip(value: number) {
        this._frameGraphTask.ssr.selfCollisionNumSkip = value;
    }

    /** Gets or sets the downsample factor used to reduce the size of the texture used to compute the SSR contribution */
    @editableInPropertyPage("SSR downsample", PropertyTypeForEdition.Int, "SSR", { min: 0, max: 5 })
    public get ssrDownsample() {
        return this._frameGraphTask.ssr.ssrDownsample;
    }

    public set ssrDownsample(value: number) {
        this._frameGraphTask.ssr.ssrDownsample = value;
    }

    /** Gets or sets a boolean indicating if the ray should be clipped to the frustum */
    @editableInPropertyPage("Clip to frustum", PropertyTypeForEdition.Boolean, "SSR")
    public get clipToFrustum() {
        return this._frameGraphTask.ssr.clipToFrustum;
    }

    public set clipToFrustum(value: boolean) {
        this._frameGraphTask.ssr.clipToFrustum = value;
    }

    /** Gets or sets a boolean defining if geometry thickness should be computed automatically */
    @editableInPropertyPage("Automatic thickness computation", PropertyTypeForEdition.Boolean, "SSR")
    public get enableAutomaticThicknessComputation() {
        return this._frameGraphTask.ssr.enableAutomaticThicknessComputation;
    }

    public set enableAutomaticThicknessComputation(value: boolean) {
        this._frameGraphTask.ssr.enableAutomaticThicknessComputation = value;
    }

    /** Gets or sets a boolean indicating whether the blending between the current color pixel and the reflection color should be done with a Fresnel coefficient */
    @editableInPropertyPage("Use Fresnel", PropertyTypeForEdition.Boolean, "SSR")
    public get useFresnel() {
        return this._frameGraphTask.ssr.useFresnel;
    }

    public set useFresnel(value: boolean) {
        this._frameGraphTask.ssr.useFresnel = value;
    }

    /** Gets or sets the blur dispersion strength. Set this value to 0 to disable blurring */
    @editableInPropertyPage("Strength", PropertyTypeForEdition.Float, "Blur", { min: 0, max: 0.15 })
    public get blurDispersionStrength() {
        return this._frameGraphTask.ssr.blurDispersionStrength;
    }

    public set blurDispersionStrength(value: number) {
        this._frameGraphTask.ssr.blurDispersionStrength = value;
    }

    /** Gets or sets the downsample factor used to reduce the size of the textures used to blur the reflection effect */
    @editableInPropertyPage("Blur downsample", PropertyTypeForEdition.Int, "Blur", { min: 0, max: 5 })
    public get blurDownsample() {
        return this._frameGraphTask.ssr.blurDownsample;
    }

    public set blurDownsample(value: number) {
        this._frameGraphTask.ssr.blurDownsample = value;
    }

    /** Gets or sets a boolean indicating if the reflections should be attenuated at the screen borders */
    @editableInPropertyPage("Screen borders", PropertyTypeForEdition.Boolean, "Attenuations")
    public get attenuateScreenBorders() {
        return this._frameGraphTask.ssr.attenuateScreenBorders;
    }

    public set attenuateScreenBorders(value: boolean) {
        this._frameGraphTask.ssr.attenuateScreenBorders = value;
    }

    /** Gets or sets a boolean indicating if the reflections should be attenuated according to the distance of the intersection */
    @editableInPropertyPage("Distance", PropertyTypeForEdition.Boolean, "Attenuations")
    public get attenuateIntersectionDistance() {
        return this._frameGraphTask.ssr.attenuateIntersectionDistance;
    }

    public set attenuateIntersectionDistance(value: boolean) {
        this._frameGraphTask.ssr.attenuateIntersectionDistance = value;
    }

    /** Gets or sets a boolean indicating if the reflections should be attenuated according to the number of iterations performed to find the intersection */
    @editableInPropertyPage("Step iterations", PropertyTypeForEdition.Boolean, "Attenuations")
    public get attenuateIntersectionIterations() {
        return this._frameGraphTask.ssr.attenuateIntersectionIterations;
    }

    public set attenuateIntersectionIterations(value: boolean) {
        this._frameGraphTask.ssr.attenuateIntersectionIterations = value;
    }

    /** Gets or sets a boolean indicating if the reflections should be attenuated when the reflection ray is facing the camera (the view direction) */
    @editableInPropertyPage("Facing camera", PropertyTypeForEdition.Boolean, "Attenuations")
    public get attenuateFacingCamera() {
        return this._frameGraphTask.ssr.attenuateFacingCamera;
    }

    public set attenuateFacingCamera(value: boolean) {
        this._frameGraphTask.ssr.attenuateFacingCamera = value;
    }

    /** Gets or sets a boolean indicating if the backface reflections should be attenuated */
    @editableInPropertyPage("Backface reflections", PropertyTypeForEdition.Boolean, "Attenuations")
    public get attenuateBackfaceReflection() {
        return this._frameGraphTask.ssr.attenuateBackfaceReflection;
    }

    public set attenuateBackfaceReflection(value: boolean) {
        this._frameGraphTask.ssr.attenuateBackfaceReflection = value;
    }

    /** Gets or sets a boolean defining if the input color texture is in gamma space */
    @editableInPropertyPage("Input is in gamma space", PropertyTypeForEdition.Boolean, "Color space")
    public get inputTextureColorIsInGammaSpace() {
        return this._frameGraphTask.ssr.inputTextureColorIsInGammaSpace;
    }

    public set inputTextureColorIsInGammaSpace(value: boolean) {
        this._frameGraphTask.ssr.inputTextureColorIsInGammaSpace = value;
    }

    /** Gets or sets a boolean defining if the output color texture generated by the SSR pipeline should be in gamma space */
    @editableInPropertyPage("Output to gamma space", PropertyTypeForEdition.Boolean, "Color space")
    public get generateOutputInGammaSpace() {
        return this._frameGraphTask.ssr.generateOutputInGammaSpace;
    }

    public set generateOutputInGammaSpace(value: boolean) {
        this._frameGraphTask.ssr.generateOutputInGammaSpace = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphSSRPostProcessBlock";
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry depth input component
     */
    public get geomDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry normal input component
     */
    public get geomNormal(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the geometry reflectivity input component
     */
    public get geomReflectivity(): NodeRenderGraphConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the geometry back depth input component
     */
    public get geomBackDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[6];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.normalTexture = this.geomNormal.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.depthTexture = this.geomDepth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.reflectivityTexture = this.geomReflectivity.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.backDepthTexture = this.geomBackDepth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;

        if (this.enableAutomaticThicknessComputation) {
            if (!this._frameGraphTask.backDepthTexture) {
                throw new Error(`SSR post process "${this.name}": Automatic thickness computation requires a back depth texture to be connected!`);
            }

            const geomBackDepthOwnerBlock = this.geomBackDepth.connectedPoint!.ownerBlock;
            if (geomBackDepthOwnerBlock.getClassName() === "NodeRenderGraphGeometryRendererBlock") {
                const geometryBackFaceRendererBlock = geomBackDepthOwnerBlock as NodeRenderGraphGeometryRendererBlock;
                if (!geometryBackFaceRendererBlock.reverseCulling) {
                    throw new Error(
                        `SSR post process "${this.name}": Automatic thickness computation requires the geometry renderer block for the back depth texture to have reverse culling enabled!`
                    );
                }

                if (this._frameGraphTask.depthTexture) {
                    const geomDepthOwnerBlock = this.geomDepth.connectedPoint!.ownerBlock;
                    if (geomDepthOwnerBlock.getClassName() === "NodeRenderGraphGeometryRendererBlock") {
                        const geomDepthConnectionPointType = this.geomDepth.connectedPoint!.type;
                        const geomBackDepthConnectionPointType = this.geomBackDepth.connectedPoint!.type;

                        if (geomDepthConnectionPointType !== geomBackDepthConnectionPointType) {
                            throw new Error(
                                `SSR post process "${this.name}": Automatic thickness computation requires that geomDepth and geomBackDepth have the same type (view or screen space depth)!`
                            );
                        }
                    }
                }
            }
        }

        if (this.geomNormal.connectedPoint) {
            if (this.geomNormal.connectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal) {
                this._frameGraphTask.ssr.normalsAreInWorldSpace = true;
                this._frameGraphTask.ssr.normalsAreUnsigned = true;
            }
        }
        if (this.geomDepth.connectedPoint) {
            if (this.geomDepth.connectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth) {
                this._frameGraphTask.ssr.useScreenspaceDepth = true;
            }
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.debug = ${this.debug};`);
        codes.push(`${this._codeVariableName}.strength = ${this.strength};`);
        codes.push(`${this._codeVariableName}.reflectionSpecularFalloffExponent = ${this.reflectionSpecularFalloffExponent};`);
        codes.push(`${this._codeVariableName}.reflectivityThreshold = ${this.reflectivityThreshold};`);
        codes.push(`${this._codeVariableName}.thickness = ${this.thickness};`);
        codes.push(`${this._codeVariableName}.step = ${this.step};`);
        codes.push(`${this._codeVariableName}.enableSmoothReflections = ${this.enableSmoothReflections};`);
        codes.push(`${this._codeVariableName}.maxSteps = ${this.maxSteps};`);
        codes.push(`${this._codeVariableName}.maxDistance = ${this.maxDistance};`);
        codes.push(`${this._codeVariableName}.roughnessFactor = ${this.roughnessFactor};`);
        codes.push(`${this._codeVariableName}.selfCollisionNumSkip = ${this.selfCollisionNumSkip};`);
        codes.push(`${this._codeVariableName}.ssrDownsample = ${this.ssrDownsample};`);
        codes.push(`${this._codeVariableName}.clipToFrustum = ${this.clipToFrustum};`);
        codes.push(`${this._codeVariableName}.useFresnel = ${this.useFresnel};`);
        codes.push(`${this._codeVariableName}.enableAutomaticThicknessComputation = ${this.enableAutomaticThicknessComputation};`);
        codes.push(`${this._codeVariableName}.blurDispersionStrength = ${this.blurDispersionStrength};`);
        codes.push(`${this._codeVariableName}.blurDownsample = ${this.blurDownsample};`);
        codes.push(`${this._codeVariableName}.attenuateScreenBorders = ${this.attenuateScreenBorders};`);
        codes.push(`${this._codeVariableName}.attenuateIntersectionDistance = ${this.attenuateIntersectionDistance};`);
        codes.push(`${this._codeVariableName}.attenuateIntersectionIterations = ${this.attenuateIntersectionIterations};`);
        codes.push(`${this._codeVariableName}.attenuateFacingCamera = ${this.attenuateFacingCamera};`);
        codes.push(`${this._codeVariableName}.attenuateBackfaceReflection = ${this.attenuateBackfaceReflection};`);
        codes.push(`${this._codeVariableName}.inputTextureColorIsInGammaSpace = ${this.inputTextureColorIsInGammaSpace};`);
        codes.push(`${this._codeVariableName}.generateOutputInGammaSpace = ${this.generateOutputInGammaSpace};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.debug = this.debug;
        serializationObject.strength = this.strength;
        serializationObject.reflectionSpecularFalloffExponent = this.reflectionSpecularFalloffExponent;
        serializationObject.reflectivityThreshold = this.reflectivityThreshold;
        serializationObject.thickness = this.thickness;
        serializationObject.step = this.step;
        serializationObject.enableSmoothReflections = this.enableSmoothReflections;
        serializationObject.maxSteps = this.maxSteps;
        serializationObject.maxDistance = this.maxDistance;
        serializationObject.roughnessFactor = this.roughnessFactor;
        serializationObject.selfCollisionNumSkip = this.selfCollisionNumSkip;
        serializationObject.ssrDownsample = this.ssrDownsample;
        serializationObject.clipToFrustum = this.clipToFrustum;
        serializationObject.useFresnel = this.useFresnel;
        serializationObject.enableAutomaticThicknessComputation = this.enableAutomaticThicknessComputation;
        serializationObject.blurDispersionStrength = this.blurDispersionStrength;
        serializationObject.blurDownsample = this.blurDownsample;
        serializationObject.attenuateScreenBorders = this.attenuateScreenBorders;
        serializationObject.attenuateIntersectionDistance = this.attenuateIntersectionDistance;
        serializationObject.attenuateIntersectionIterations = this.attenuateIntersectionIterations;
        serializationObject.attenuateFacingCamera = this.attenuateFacingCamera;
        serializationObject.attenuateBackfaceReflection = this.attenuateBackfaceReflection;
        serializationObject.inputTextureColorIsInGammaSpace = this.inputTextureColorIsInGammaSpace;
        serializationObject.generateOutputInGammaSpace = this.generateOutputInGammaSpace;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.debug = serializationObject.debug;
        this.strength = serializationObject.strength;
        this.reflectionSpecularFalloffExponent = serializationObject.reflectionSpecularFalloffExponent;
        this.reflectivityThreshold = serializationObject.reflectivityThreshold;
        this.thickness = serializationObject.thickness;
        this.step = serializationObject.step;
        this.enableSmoothReflections = serializationObject.enableSmoothReflections;
        this.maxSteps = serializationObject.maxSteps;
        this.maxDistance = serializationObject.maxDistance;
        this.roughnessFactor = serializationObject.roughnessFactor;
        this.selfCollisionNumSkip = serializationObject.selfCollisionNumSkip;
        this.ssrDownsample = serializationObject.ssrDownsample;
        this.clipToFrustum = serializationObject.clipToFrustum;
        this.useFresnel = serializationObject.useFresnel;
        this.enableAutomaticThicknessComputation = serializationObject.enableAutomaticThicknessComputation;
        this.blurDispersionStrength = serializationObject.blurDispersionStrength;
        this.blurDownsample = serializationObject.blurDownsample;
        this.attenuateScreenBorders = serializationObject.attenuateScreenBorders;
        this.attenuateIntersectionDistance = serializationObject.attenuateIntersectionDistance;
        this.attenuateIntersectionIterations = serializationObject.attenuateIntersectionIterations;
        this.attenuateFacingCamera = serializationObject.attenuateFacingCamera;
        this.attenuateBackfaceReflection = serializationObject.attenuateBackfaceReflection;
        this.inputTextureColorIsInGammaSpace = serializationObject.inputTextureColorIsInGammaSpace;
        this.generateOutputInGammaSpace = serializationObject.generateOutputInGammaSpace;
    }
}

RegisterClass("BABYLON.NodeRenderGraphSSRPostProcessBlock", NodeRenderGraphSSRPostProcessBlock);
