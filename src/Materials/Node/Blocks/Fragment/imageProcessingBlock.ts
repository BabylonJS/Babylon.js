import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { _TypeStore } from '../../../../Misc/typeStore';

import "../../../../Shaders/ShadersInclude/helperFunctions";
import "../../../../Shaders/ShadersInclude/imageProcessingDeclaration";
import "../../../../Shaders/ShadersInclude/imageProcessingFunctions";

/**
 * Block used to add image processing support to fragment shader
 */
export class ImageProcessingBlock extends NodeMaterialBlock {
    /**
     * Create a new ImageProcessingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color4);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ImageProcessingBlock";
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("exposureLinear");
        state._excludeVariableName("contrast");
        state._excludeVariableName("vInverseScreenSize");
        state._excludeVariableName("vignetteSettings1");
        state._excludeVariableName("vignetteSettings2");
        state._excludeVariableName("vCameraColorCurveNegative");
        state._excludeVariableName("vCameraColorCurveNeutral");
        state._excludeVariableName("vCameraColorCurvePositive");
        state._excludeVariableName("txColorTransform");
        state._excludeVariableName("colorTransformSettings");
    }

    public isReady(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (defines._areImageProcessingDirty && nodeMaterial.imageProcessingConfiguration) {
            if (!nodeMaterial.imageProcessingConfiguration.isReady()) {
                return false;
            }
        }
        return true;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (defines._areImageProcessingDirty && nodeMaterial.imageProcessingConfiguration) {
            nodeMaterial.imageProcessingConfiguration.prepareDefines(defines);
        }
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        if (!nodeMaterial.imageProcessingConfiguration) {
            return;
        }

        nodeMaterial.imageProcessingConfiguration.bind(effect);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Register for blocking
        state.sharedData.blockingBlocks.push(this);

        // Register for binding
        state.sharedData.bindableBlocks.push(this);

        // Uniforms
        state.uniforms.push("exposureLinear");
        state.uniforms.push("contrast");
        state.uniforms.push("vInverseScreenSize");
        state.uniforms.push("vignetteSettings1");
        state.uniforms.push("vignetteSettings2");
        state.uniforms.push("vCameraColorCurveNegative");
        state.uniforms.push("vCameraColorCurveNeutral");
        state.uniforms.push("vCameraColorCurvePositive");
        state.uniforms.push("txColorTransform");
        state.uniforms.push("colorTransformSettings");

        // Emit code
        let color = this.color;
        let output = this._outputs[0];
        let comments = `//${this.name}`;

        state._emitFunctionFromInclude("helperFunctions", comments);
        state._emitFunctionFromInclude("imageProcessingDeclaration", comments);
        state._emitFunctionFromInclude("imageProcessingFunctions", comments);

        if (color.connectedPoint!.type === NodeMaterialBlockConnectionPointTypes.Color4 || (color.connectedPoint!.type === NodeMaterialBlockConnectionPointTypes.Vector4)) {
            state.compilationString += `${this._declareOutput(output, state)} = ${color.associatedVariableName};\r\n`;
        } else {
            state.compilationString += `${this._declareOutput(output, state)} = vec4(${color.associatedVariableName}, 1.0);\r\n`;
        }
        state.compilationString += `#ifdef IMAGEPROCESSINGPOSTPROCESS\r\n`;
        state.compilationString += `${output.associatedVariableName}.rgb = toLinearSpace(${color.associatedVariableName}.rgb);\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `#ifdef IMAGEPROCESSING\r\n`;
        state.compilationString += `${output.associatedVariableName}.rgb = toLinearSpace(${color.associatedVariableName}.rgb);\r\n`;
        state.compilationString += `${output.associatedVariableName} = applyImageProcessing(${output.associatedVariableName});\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#endif\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ImageProcessingBlock"] = ImageProcessingBlock;