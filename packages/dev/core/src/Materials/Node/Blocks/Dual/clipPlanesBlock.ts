import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Effect } from "../../../effect";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { Mesh } from "../../../../Meshes/mesh";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import { BindClipPlane } from "../../../../Materials/clipPlaneMaterialHelper";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
/**
 * Block used to implement clip planes
 */
export class ClipPlanesBlock extends NodeMaterialBlock {
    /**
     * Create a new ClipPlanesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment, true);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ClipPlanesBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vClipPlane");
        state._excludeVariableName("fClipDistance");
        state._excludeVariableName("vClipPlane2");
        state._excludeVariableName("fClipDistance2");
        state._excludeVariableName("vClipPlane3");
        state._excludeVariableName("fClipDistance3");
        state._excludeVariableName("vClipPlane4");
        state._excludeVariableName("fClipDistance4");
        state._excludeVariableName("vClipPlane5");
        state._excludeVariableName("fClipDistance5");
        state._excludeVariableName("vClipPlane6");
        state._excludeVariableName("fClipDistance6");

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneFragment"),
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneFragmentDeclaration"),
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneVertex"),
                import("../../../../ShadersWGSL/ShadersInclude/clipPlaneVertexDeclaration"),
            ]);
        } else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/clipPlaneFragment"),
                import("../../../../Shaders/ShadersInclude/clipPlaneFragmentDeclaration"),
                import("../../../../Shaders/ShadersInclude/clipPlaneVertex"),
                import("../../../../Shaders/ShadersInclude/clipPlaneVertexDeclaration"),
            ]);
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    /**
     * Gets the worldPosition input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public override get target() {
        return NodeMaterialBlockTargets.VertexAndFragment;
    }

    public override set target(value: NodeMaterialBlockTargets) {}

    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial, mesh?: AbstractMesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();

        const useClipPlane1 = (nodeMaterial.clipPlane ?? scene.clipPlane) ? true : false;
        const useClipPlane2 = (nodeMaterial.clipPlane2 ?? scene.clipPlane2) ? true : false;
        const useClipPlane3 = (nodeMaterial.clipPlane3 ?? scene.clipPlane3) ? true : false;
        const useClipPlane4 = (nodeMaterial.clipPlane4 ?? scene.clipPlane4) ? true : false;
        const useClipPlane5 = (nodeMaterial.clipPlane5 ?? scene.clipPlane5) ? true : false;
        const useClipPlane6 = (nodeMaterial.clipPlane6 ?? scene.clipPlane6) ? true : false;

        defines.setValue("CLIPPLANE", useClipPlane1, true);
        defines.setValue("CLIPPLANE2", useClipPlane2, true);
        defines.setValue("CLIPPLANE3", useClipPlane3, true);
        defines.setValue("CLIPPLANE4", useClipPlane4, true);
        defines.setValue("CLIPPLANE5", useClipPlane5, true);
        defines.setValue("CLIPPLANE6", useClipPlane6, true);
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();

        BindClipPlane(effect, nodeMaterial, scene);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const comments = `//${this.name}`;
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            const worldPos = this.worldPosition;

            state._emitFunctionFromInclude("clipPlaneVertexDeclaration", comments, {
                replaceStrings: [{ search: /uniform vec4 vClipPlane\d*;/g, replace: "" }],
            });
            state.compilationString += state._emitCodeFromInclude("clipPlaneVertex", comments, {
                replaceStrings: [{ search: /worldPos/g, replace: worldPos.associatedVariableName }],
            });

            state._emitUniformFromString("vClipPlane", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane2", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane3", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane4", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane5", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClipPlane6", NodeMaterialBlockConnectionPointTypes.Vector4);

            return;
        }

        // Fragment
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        state._emitFunctionFromInclude("clipPlaneFragmentDeclaration", comments);
        state.compilationString += state._emitCodeFromInclude("clipPlaneFragment", comments);

        return this;
    }
}

RegisterClass("BABYLON.ClipPlanesBlock", ClipPlanesBlock);
