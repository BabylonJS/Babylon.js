import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { _TypeStore } from '../../../../../Misc/typeStore';
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";
import { ReflectionTextureBaseBlock } from '../../Dual/reflectionTextureBaseBlock';
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { Engine } from '../../../../../Engines/engine';

export class ReflectionBlock extends ReflectionTextureBaseBlock {

    private _defineLODReflectionAlpha: string;
    private _defineLinearSpecularReflection: string;
    private _defineLODBasedMicroSurface: string;

    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    public worldNormalConnectionPoint: NodeMaterialConnectionPoint;
    public cameraPositionConnectionPoint: NodeMaterialConnectionPoint;

    public constructor(name: string) {
        super(name);

        this._isUnique = true;

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("reflection", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Output, ReflectionBlock, "ReflectionBlock"));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectionBlock";
    }

    /**
     * Gets the world position input component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this.worldPositionConnectionPoint;
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this.worldNormalConnectionPoint;
    }

    /**
     * Gets the world input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this.cameraPositionConnectionPoint;
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    public get reflection(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        const reflection = this.texture && this.texture.getTextureMatrix;

        defines.setValue("REFLECTION", reflection);

        if (!reflection) {
            return;
        }

        defines.setValue(this._defineLODReflectionAlpha, this.texture!.lodLevelInAlpha);
        defines.setValue(this._defineLinearSpecularReflection, this.texture!.linearSpecularLOD);
        defines.setValue(this._defineLODBasedMicroSurface, Engine.LastCreatedScene?.getEngine()?.getCaps().textureLOD ?? false);
    }

    private _formatNumberForGLSL(val: number): string {
        let s = val.toString();

        if (s.indexOf('.') === -1) {
            s += ".";
        }

        return s;
    }

    public getCode(state: NodeMaterialBuildState, normalVarName: string, finalColorVarName: string): string {
        let code = "";

        this.handleFragmentSideInits(state);

        code += this.handleFragmentSideCodeReflectionCoords(normalVarName);

        const varLOD = state._getFreeVariableName("reflectionLOD");
        const varRequestedLOD = state._getFreeVariableName("requestedReflectionLOD");
        const varAutomaticLOD = state._getFreeVariableName("automaticReflectionLOD");
        const varInfos = state._getFreeVariableName("vReflectionMicrosurfaceInfos");

        code += `
            vec4 ${finalColorVarName} = vec4(0.);

            vec3 ${varInfos} = vec3(${this.texture!.getSize().width}., ${this._formatNumberForGLSL(this.texture!.lodGenerationScale)}, ${this._formatNumberForGLSL(this.texture!.lodGenerationScale)});

            #if defined(${this._defineLODReflectionAlpha}) && !defined(${this._defineSkyboxName})
                float ${varLOD} = getLodFromAlphaG(${varInfos}.x, alphaG, NdotVUnclamped);
            #elif defined(${this._defineLinearSpecularReflection})
                float ${varLOD} = getLinearLodFromRoughness(${varInfos}.x, roughness);
            #else
                float ${varLOD} = getLodFromAlphaG(${varInfos}.x, alphaG);
            #endif

            #ifdef ${this._defineLODBasedMicroSurface}
                ${varLOD} = ${varLOD} * ${varInfos}.y + ${varInfos}.z;

                #ifdef ${this._defineLODReflectionAlpha}
                    #ifdef ${this._define3DName}
                        float ${varAutomaticLOD} = UNPACK_LOD(textureCube(${this._cubeSamplerName}, ${this._reflectionCoordsName}).a);
                    #else
                        float ${varAutomaticLOD} = UNPACK_LOD(texture2D(${this._2DSamplerName}, ${this._reflectionCoordsName}).a);
                    #endif
                    float ${varRequestedLOD} = max(${varAutomaticLOD}, ${varLOD});
                #else
                    float ${varRequestedLOD} = ${varLOD};
                #endif\r\n`;

        code += this.handleFragmentSideCodeReflectionColor(varRequestedLOD, "");

        code += `
                ${finalColorVarName} = ${this._reflectionColorName}${this.color.isConnected ? " * vec4(" + this.color.associatedVariableName + ", 1.)" : ""};
            #else
                // ***not handled***
            #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            this._defineLODReflectionAlpha = state._getFreeDefineName("LODINREFLECTIONALPHA");
            this._defineLinearSpecularReflection = state._getFreeDefineName("LINEARSPECULARREFLECTION");
            this._defineLODBasedMicroSurface = state._getFreeDefineName("LODBASEDMICROSFURACE");
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectionBlock"] = ReflectionBlock;