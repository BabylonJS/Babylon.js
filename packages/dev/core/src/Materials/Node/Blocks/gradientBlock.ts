import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { Color3 } from "../../../Maths/math.color";
import type { Scene } from "../../../scene";
import { Observable } from "../../../Misc/observable";

/**
 * Class used to store a color step for the GradientBlock
 */
export class GradientBlockColorStep {
    private _step: number;
    /**
     * Gets value indicating which step this color is associated with (between 0 and 1)
     */
    public get step(): number {
        return this._step;
    }

    /**
     * Sets a value indicating which step this color is associated with (between 0 and 1)
     */
    public set step(val: number) {
        this._step = val;
    }

    private _color: Color3;

    /**
     * Gets the color associated with this step
     */
    public get color(): Color3 {
        return this._color;
    }

    /**
     * Sets the color associated with this step
     */
    public set color(val: Color3) {
        this._color = val;
    }

    /**
     * Creates a new GradientBlockColorStep
     * @param step defines a value indicating which step this color is associated with (between 0 and 1)
     * @param color defines the color associated with this step
     */
    public constructor(step: number, color: Color3) {
        this.step = step;
        this.color = color;
    }
}

/**
 * Block used to return a color from a gradient based on an input value between 0 and 1
 */
export class GradientBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the list of color steps
     */
    public colorSteps: GradientBlockColorStep[] = [new GradientBlockColorStep(0, Color3.Black()), new GradientBlockColorStep(1.0, Color3.White())];

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<GradientBlock>();

    /** calls observable when the value is changed*/
    public colorStepsUpdated() {
        this.onValueChangedObservable.notifyObservers(this);
    }
    /**
     * Creates a new GradientBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("gradient", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Float |
                NodeMaterialBlockConnectionPointTypes.Vector2 |
                NodeMaterialBlockConnectionPointTypes.Vector3 |
                NodeMaterialBlockConnectionPointTypes.Vector4 |
                NodeMaterialBlockConnectionPointTypes.Color3 |
                NodeMaterialBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GradientBlock";
    }

    /**
     * Gets the gradient input component
     */
    public get gradient(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    private _writeColorConstant(index: number, vec3: string) {
        const step = this.colorSteps[index];
        return `${vec3}(${step.color.r}, ${step.color.g}, ${step.color.b})`;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);

        if (!this.colorSteps.length || !this.gradient.connectedPoint) {
            state.compilationString += state._declareOutput(output) + ` = ${vec3}(0., 0., 0.);\n`;
            return;
        }

        const tempColor = state._getFreeVariableName("gradientTempColor");
        const tempPosition = state._getFreeVariableName("gradientTempPosition");

        state.compilationString += `${state._declareLocalVar(tempColor, NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this._writeColorConstant(0, vec3)};\n`;
        state.compilationString += `${state._declareLocalVar(tempPosition, NodeMaterialBlockConnectionPointTypes.Float)};\n`;

        let gradientSource = this.gradient.associatedVariableName;

        if (this.gradient.connectedPoint!.type !== NodeMaterialBlockConnectionPointTypes.Float) {
            gradientSource += ".x";
        }

        for (let index = 1; index < this.colorSteps.length; index++) {
            const step = this.colorSteps[index];
            const previousStep = this.colorSteps[index - 1];
            state.compilationString += `${tempPosition} = clamp((${gradientSource} - ${state._emitFloat(previousStep.step)}) / (${state._emitFloat(
                step.step
            )} -  ${state._emitFloat(previousStep.step)}), 0.0, 1.0) * step(${state._emitFloat(index)}, ${state._emitFloat(this.colorSteps.length - 1)});\n`;
            state.compilationString += `${tempColor} = mix(${tempColor}, ${this._writeColorConstant(index, vec3)}, ${tempPosition});\n`;
        }
        state.compilationString += state._declareOutput(output) + ` = ${tempColor};\n`;

        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.colorSteps = [];

        for (const step of this.colorSteps) {
            serializationObject.colorSteps.push({
                step: step.step,
                color: {
                    r: step.color.r,
                    g: step.color.g,
                    b: step.color.b,
                },
            });
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.colorSteps.length = 0;

        for (const step of serializationObject.colorSteps) {
            this.colorSteps.push(new GradientBlockColorStep(step.step, new Color3(step.color.r, step.color.g, step.color.b)));
        }
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.colorSteps = [];\n`;

        for (const colorStep of this.colorSteps) {
            codeString += `${this._codeVariableName}.colorSteps.push(new BABYLON.GradientBlockColorStep(${colorStep.step}, new BABYLON.Color3(${colorStep.color.r}, ${colorStep.color.g}, ${colorStep.color.b})));\n`;
        }

        return codeString;
    }
}

RegisterClass("BABYLON.GradientBlock", GradientBlock);
