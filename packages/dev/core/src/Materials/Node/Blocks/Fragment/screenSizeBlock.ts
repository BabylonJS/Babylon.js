import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Effect } from "../../../effect";
import type { Scene } from "../../../../scene";
import { ShaderLanguage } from "../../../../Materials/shaderLanguage";

/**
 * Block used to get the screen sizes
 */
export class ScreenSizeBlock extends NodeMaterialBlock {
    private _varName: string;
    private _scene: Scene;

    /**
     * Name of the variable in the shader that holds the screen size
     */
    public get associatedVariableName(): string {
        return this._varName;
    }

    /**
     * Creates a new ScreenSizeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("xy", NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ScreenSizeBlock";
    }

    /**
     * Gets the xy component
     */
    public get xy(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the x component
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the y component
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    public override bind(effect: Effect) {
        const engine = this._scene.getEngine();

        effect.setFloat2(this._varName, engine.getRenderWidth(), engine.getRenderHeight());
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected writeOutputs(state: NodeMaterialBuildState, varName: string): string {
        let code = "";

        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                code += `${state._declareOutput(output)} = ${varName}.${output.name};\n`;
            }
        }

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        this._scene = state.sharedData.scene;

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            state.sharedData.raiseBuildError("ScreenSizeBlock must only be used in a fragment shader");
            return this;
        }

        state.sharedData.bindableBlocks.push(this);

        this._varName = state._getFreeVariableName("screenSize");
        state._emitUniformFromString(this._varName, NodeMaterialBlockConnectionPointTypes.Vector2);

        const prefix = state.shaderLanguage === ShaderLanguage.WGSL ? "uniforms." : "";
        state.compilationString += this.writeOutputs(state, prefix + this._varName);

        return this;
    }
}

RegisterClass("BABYLON.ScreenSizeBlock", ScreenSizeBlock);
