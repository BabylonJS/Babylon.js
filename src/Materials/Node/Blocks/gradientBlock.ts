import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Color3 } from '../../../Maths/math.color';
import { Scene } from '../../../scene';
import { Observable } from '../../../Misc/observable';

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
    public colorSteps: GradientBlockColorStep[] = [
        new GradientBlockColorStep(0, Color3.Black()),
        new GradientBlockColorStep(1.0, Color3.White())
    ];

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

        this.registerInput("gradient", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector2);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
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

    private _writeColorConstant(index: number) {
        let step = this.colorSteps[index];
        return `vec3(${step.color.r}, ${step.color.g}, ${step.color.b})`;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        if (!this.colorSteps.length || !this.gradient.connectedPoint) {
            state.compilationString += this._declareOutput(output, state) + ` = vec3(0., 0., 0.);\r\n`;
            return;
        }

        let tempColor = state._getFreeVariableName("gradientTempColor");
        let tempPosition = state._getFreeVariableName("gradientTempPosition");

        state.compilationString += `vec3 ${tempColor} = ${this._writeColorConstant(0)};\r\n`;
        state.compilationString += `float ${tempPosition};\r\n`;

        let gradientSource = this.gradient.associatedVariableName;

        if (this.gradient.connectedPoint!.type !== NodeMaterialBlockConnectionPointTypes.Float) {
            gradientSource += ".x";
        }

        for (var index = 1; index < this.colorSteps.length; index++) {
            let step = this.colorSteps[index];
            let previousStep = this.colorSteps[index - 1];
            state.compilationString += `${tempPosition} = clamp((${gradientSource} - ${state._emitFloat(previousStep.step)}) / (${state._emitFloat(step.step)} -  ${state._emitFloat(previousStep.step)}), 0.0, 1.0) * step(${state._emitFloat(index)}, ${state._emitFloat(this.colorSteps.length - 1)});\r\n`;
            state.compilationString += `${tempColor} = mix(${tempColor}, ${this._writeColorConstant(index)}, ${tempPosition});\r\n`;
        }
        state.compilationString += this._declareOutput(output, state) + ` = ${tempColor};\r\n`;

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.colorSteps = [];

        for (var step of this.colorSteps) {
            serializationObject.colorSteps.push({
                step: step.step,
                color: {
                    r: step.color.r,
                    g: step.color.g,
                    b: step.color.b
                }
            });
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.colorSteps = [];

        for (var step of serializationObject.colorSteps) {
            this.colorSteps.push(new GradientBlockColorStep(step.step, new Color3(step.color.r, step.color.g, step.color.b)));
        }
    }

    protected _dumpPropertiesCode() {
        var codeString = "";

        for (var colorStep of this.colorSteps) {
            codeString += `${this._codeVariableName}.colorSteps.push(new BABYLON.GradientBlockColorStep(${colorStep.step}, new BABYLON.Color3(${colorStep.color.r}, ${colorStep.color.g}, ${colorStep.color.b})));\r\n`;
        }

        return codeString;
    }
}

_TypeStore.RegisteredTypes["BABYLON.GradientBlock"] = GradientBlock;