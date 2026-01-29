/* eslint-disable @typescript-eslint/naming-convention */
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBlockConnectionPointMode } from "../../Enums/nodeMaterialBlockConnectionPointMode";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import type { Nullable } from "../../../../types";
import type { Effect } from "../../../../Materials/effect";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../../Maths/math.vector";
import type { Scene } from "../../../../scene";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { GetClass, RegisterClass } from "../../../../Misc/typeStore";
import { Color3, Color4, TmpColors, TmpVectors } from "../../../../Maths/math";
import { AnimatedInputBlockTypes } from "./animatedInputBlockTypes";
import { Observable } from "../../../../Misc/observable";
import type { NodeMaterial } from "../../nodeMaterial";
import { PrecisionDate } from "../../../../Misc/precisionDate";
import { ShaderLanguage } from "../../../../Materials/shaderLanguage";

const remapAttributeName: { [name: string]: string } = {
    position2d: "position",
    // From particle.vertex:
    particle_uv: "vUV",
    particle_color: "vColor",
    particle_texturemask: "textureMask",
    particle_positionw: "vPositionW",
    // From postprocess.vertex:
    postprocess_uv: "vUV",
};

const attributeInFragmentOnly: { [name: string]: boolean } = {
    particle_uv: true,
    particle_color: true,
    particle_texturemask: true,
    particle_positionw: true,
    postprocess_uv: true,
};

const attributeAsUniform: { [name: string]: boolean } = {
    particle_texturemask: true,
};

const attributeDefine: { [name: string]: string } = {
    normal: "NORMAL",
    tangent: "TANGENT",
    uv: "UV1",
    uv2: "UV2",
    uv3: "UV3",
    uv4: "UV4",
    uv5: "UV5",
    uv6: "UV6",
    uv7: "UV7",
    uv8: "UV8",
};

/**
 * Block used to expose an input value
 */
export class InputBlock extends NodeMaterialBlock {
    private _mode = NodeMaterialBlockConnectionPointMode.Undefined;
    private _associatedVariableName: string;
    private _storedValue: any;
    private _valueCallback: () => any;
    private _type: NodeMaterialBlockConnectionPointTypes;
    private _animationType = AnimatedInputBlockTypes.None;
    private _prefix = "";

    /** Gets or set a value used to limit the range of float values */
    public min: number = 0;

    /** Gets or set a value used to limit the range of float values */
    public max: number = 0;

    /** Gets or set a value indicating that this input can only get 0 and 1 values */
    public isBoolean: boolean = false;

    /** Gets or sets a value used by the Node Material editor to determine how to configure the current value if it is a matrix */
    public matrixMode: number = 0;

    /** @internal */
    public _systemValue: Nullable<NodeMaterialSystemValues> = null;

    /** Gets or sets a boolean indicating that the value of this input will not change after a build */
    public isConstant = false;

    /** Gets or sets the group to use to display this block in the Inspector */
    public groupInInspector = "";

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<InputBlock>();

    /** Gets or sets a boolean indicating if content needs to be converted to gamma space (for color3/4 only) */
    public convertToGammaSpace = false;

    /** Gets or sets a boolean indicating if content needs to be converted to linear space (for color3/4 only) */
    public convertToLinearSpace = false;

    /**
     * Gets or sets the connection point type (default is float)
     */
    public get type(): NodeMaterialBlockConnectionPointTypes {
        if (this._type === NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            if (this.isUniform && this.value != null) {
                if (!isNaN(this.value)) {
                    this._type = NodeMaterialBlockConnectionPointTypes.Float;
                    return this._type;
                }

                switch (this.value.getClassName()) {
                    case "Vector2":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector2;
                        return this._type;
                    case "Vector3":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case "Vector4":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector4;
                        return this._type;
                    case "Color3":
                        this._type = NodeMaterialBlockConnectionPointTypes.Color3;
                        return this._type;
                    case "Color4":
                        this._type = NodeMaterialBlockConnectionPointTypes.Color4;
                        return this._type;
                    case "Matrix":
                        this._type = NodeMaterialBlockConnectionPointTypes.Matrix;
                        return this._type;
                }
            }

            if (this.isAttribute) {
                switch (this.name) {
                    case "splatIndex":
                        this._type = NodeMaterialBlockConnectionPointTypes.Float;
                        return this._type;
                    case "position":
                    case "normal":
                    case "particle_positionw":
                    case "splatPosition":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case "uv":
                    case "uv2":
                    case "uv3":
                    case "uv4":
                    case "uv5":
                    case "uv6":
                    case "position2d":
                    case "particle_uv":
                    case "splatScale":
                    case "postprocess_uv":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector2;
                        return this._type;
                    case "matricesIndices":
                    case "matricesWeights":
                    case "matricesIndicesExtra":
                    case "matricesWeightsExtra":
                    case "world0":
                    case "world1":
                    case "world2":
                    case "world3":
                    case "tangent":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector4;
                        return this._type;
                    case "color":
                    case "instanceColor":
                    case "particle_color":
                    case "particle_texturemask":
                    case "splatColor":
                        this._type = NodeMaterialBlockConnectionPointTypes.Color4;
                        return this._type;
                }
            }

            if (this.isSystemValue) {
                switch (this._systemValue) {
                    case NodeMaterialSystemValues.World:
                    case NodeMaterialSystemValues.WorldView:
                    case NodeMaterialSystemValues.WorldViewProjection:
                    case NodeMaterialSystemValues.View:
                    case NodeMaterialSystemValues.ViewProjection:
                    case NodeMaterialSystemValues.Projection:
                    case NodeMaterialSystemValues.ProjectionInverse:
                        this._type = NodeMaterialBlockConnectionPointTypes.Matrix;
                        return this._type;
                    case NodeMaterialSystemValues.CameraPosition:
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case NodeMaterialSystemValues.CameraForward:
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case NodeMaterialSystemValues.FogColor:
                        this._type = NodeMaterialBlockConnectionPointTypes.Color3;
                        return this._type;
                    case NodeMaterialSystemValues.DeltaTime:
                    case NodeMaterialSystemValues.MaterialAlpha:
                        this._type = NodeMaterialBlockConnectionPointTypes.Float;
                        return this._type;
                    case NodeMaterialSystemValues.CameraParameters:
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector4;
                        return this._type;
                }
            }
        }

        return this._type;
    }

    /**
     * Creates a new InputBlock
     * @param name defines the block name
     * @param target defines the target of that block (Vertex by default)
     * @param type defines the type of the input (can be set to NodeMaterialBlockConnectionPointTypes.AutoDetect)
     */
    public constructor(name: string, target = NodeMaterialBlockTargets.Vertex, type: NodeMaterialBlockConnectionPointTypes = NodeMaterialBlockConnectionPointTypes.AutoDetect) {
        super(name, target, false);

        this._type = type;

        this.setDefaultValue();

        this.registerOutput("output", type);
    }

    /**
     * Validates if a name is a reserve word.
     * @param newName the new name to be given to the node.
     * @returns false if the name is a reserve word, else true.
     */
    public override validateBlockName(newName: string) {
        if (!this.isAttribute) {
            return super.validateBlockName(newName);
        }
        return true;
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Set the source of this connection point to a vertex attribute
     * @param attributeName defines the attribute name (position, uv, normal, etc...). If not specified it will take the connection point name
     * @returns the current connection point
     */
    public setAsAttribute(attributeName?: string): InputBlock {
        this._mode = NodeMaterialBlockConnectionPointMode.Attribute;
        if (attributeName) {
            this.name = attributeName;
        }
        return this;
    }

    /**
     * Set the source of this connection point to a system value
     * @param value define the system value to use (world, view, etc...) or null to switch to manual value
     * @returns the current connection point
     */
    public setAsSystemValue(value: Nullable<NodeMaterialSystemValues>): InputBlock {
        this.systemValue = value;
        return this;
    }

    /**
     * Gets or sets the value of that point.
     * Please note that this value will be ignored if valueCallback is defined
     */
    public get value(): any {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this._storedValue;
    }

    public set value(value: any) {
        if (this.type === NodeMaterialBlockConnectionPointTypes.Float) {
            if (this.isBoolean) {
                value = value ? 1 : 0;
            } else if (this.min !== this.max) {
                value = Math.max(this.min, value);
                value = Math.min(this.max, value);
            }
        }

        this._storedValue = value;
        this._mode = NodeMaterialBlockConnectionPointMode.Uniform;

        this.onValueChangedObservable.notifyObservers(this);
    }

    /**
     * Gets or sets a callback used to get the value of that point.
     * Please note that setting this value will force the connection point to ignore the value property
     */
    public get valueCallback(): () => any {
        return this._valueCallback;
    }

    public set valueCallback(value: () => any) {
        this._valueCallback = value;
        this._mode = NodeMaterialBlockConnectionPointMode.Uniform;
    }

    /**
     * Gets the declaration variable name in the shader
     */
    public get declarationVariableName(): string {
        return this._associatedVariableName;
    }

    /**
     * Gets or sets the associated variable name in the shader
     */
    public get associatedVariableName(): string {
        return this._prefix + this._associatedVariableName;
    }

    public set associatedVariableName(value: string) {
        this._associatedVariableName = value;
    }

    /** Gets or sets the type of animation applied to the input */
    public get animationType() {
        return this._animationType;
    }

    public set animationType(value: AnimatedInputBlockTypes) {
        this._animationType = value;
    }

    /**
     * Gets a boolean indicating that this connection point not defined yet
     */
    public get isUndefined(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Undefined;
    }

    /**
     * Gets or sets a boolean indicating that this connection point is coming from an uniform.
     * In this case the connection point name must be the name of the uniform to use.
     * Can only be set on inputs
     */
    public get isUniform(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Uniform;
    }

    public set isUniform(value: boolean) {
        this._mode = value ? NodeMaterialBlockConnectionPointMode.Uniform : NodeMaterialBlockConnectionPointMode.Undefined;
        this.associatedVariableName = "";
    }

    /**
     * Gets or sets a boolean indicating that this connection point is coming from an attribute.
     * In this case the connection point name must be the name of the attribute to use
     * Can only be set on inputs
     */
    public get isAttribute(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Attribute;
    }

    public set isAttribute(value: boolean) {
        this._mode = value ? NodeMaterialBlockConnectionPointMode.Attribute : NodeMaterialBlockConnectionPointMode.Undefined;
        this.associatedVariableName = "";
    }

    /**
     * Gets or sets a boolean indicating that this connection point is generating a varying variable.
     * Can only be set on exit points
     */
    public get isVarying(): boolean {
        return this._mode === NodeMaterialBlockConnectionPointMode.Varying;
    }

    public set isVarying(value: boolean) {
        this._mode = value ? NodeMaterialBlockConnectionPointMode.Varying : NodeMaterialBlockConnectionPointMode.Undefined;
        this.associatedVariableName = "";
    }

    /**
     * Gets a boolean indicating that the current connection point is a system value
     */
    public get isSystemValue(): boolean {
        return this._systemValue != null;
    }

    /**
     * Gets or sets the current well known value or null if not defined as a system value
     */
    public get systemValue(): Nullable<NodeMaterialSystemValues> {
        return this._systemValue;
    }

    public set systemValue(value: Nullable<NodeMaterialSystemValues>) {
        this._mode = NodeMaterialBlockConnectionPointMode.Uniform;
        this.associatedVariableName = "";
        this._systemValue = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "InputBlock";
    }

    /**
     * Animate the input if animationType !== None
     * @param scene defines the rendering scene
     */
    public animate(scene: Scene) {
        switch (this._animationType) {
            case AnimatedInputBlockTypes.Time: {
                if (this.type === NodeMaterialBlockConnectionPointTypes.Float) {
                    this.value += scene.getAnimationRatio() * 0.01;
                }
                break;
            }
            case AnimatedInputBlockTypes.RealTime: {
                if (this.type === NodeMaterialBlockConnectionPointTypes.Float) {
                    this.value = (PrecisionDate.Now - scene.getEngine().startTime) / 1000;
                }
                break;
            }
            case AnimatedInputBlockTypes.MouseInfo: {
                if (this.type === NodeMaterialBlockConnectionPointTypes.Vector4) {
                    const event = scene._inputManager._originMouseEvent;
                    if (event) {
                        const x = event.offsetX;
                        const y = event.offsetY;
                        const z = (event.buttons & 1) != 0 ? 1 : 0;
                        const w = (event.buttons & 2) != 0 ? 1 : 0;
                        this.value = new Vector4(x, y, z, w);
                    } else {
                        this.value = new Vector4(0, 0, 0, 0);
                    }
                }
                break;
            }
        }
    }

    private _emitDefine(define: string, notDefine = false): string {
        return `${notDefine ? "#ifndef" : "#ifdef"} ${define}\n`;
    }

    public override initialize() {
        this.associatedVariableName = "";
    }

    /**
     * Set the input block to its default value (based on its type)
     */
    public setDefaultValue() {
        switch (this.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                this.value = 0;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                this.value = Vector2.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                this.value = Vector3.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                this.value = Vector4.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                this.value = Color3.White();
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                this.value = new Color4(1, 1, 1, 1);
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                this.value = Matrix.Identity();
                break;
        }
    }

    private _emitConstant(state: NodeMaterialBuildState) {
        switch (this.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                return `${state._emitFloat(this.value)}`;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return `vec2(${this.value.x}, ${this.value.y})`;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return `vec3(${this.value.x}, ${this.value.y}, ${this.value.z})`;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return `vec4(${this.value.x}, ${this.value.y}, ${this.value.z}, ${this.value.w})`;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                TmpColors.Color3[0].set(this.value.r, this.value.g, this.value.b);
                if (this.convertToGammaSpace) {
                    TmpColors.Color3[0].toGammaSpaceToRef(TmpColors.Color3[0], state.sharedData.scene.getEngine().useExactSrgbConversions);
                }
                if (this.convertToLinearSpace) {
                    TmpColors.Color3[0].toLinearSpaceToRef(TmpColors.Color3[0], state.sharedData.scene.getEngine().useExactSrgbConversions);
                }
                return `vec3(${TmpColors.Color3[0].r}, ${TmpColors.Color3[0].g}, ${TmpColors.Color3[0].b})`;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                TmpColors.Color4[0].set(this.value.r, this.value.g, this.value.b, this.value.a);
                if (this.convertToGammaSpace) {
                    TmpColors.Color4[0].toGammaSpaceToRef(TmpColors.Color4[0], state.sharedData.scene.getEngine().useExactSrgbConversions);
                }
                if (this.convertToLinearSpace) {
                    TmpColors.Color4[0].toLinearSpaceToRef(TmpColors.Color4[0], state.sharedData.scene.getEngine().useExactSrgbConversions);
                }
                return `vec4(${TmpColors.Color4[0].r}, ${TmpColors.Color4[0].g}, ${TmpColors.Color4[0].b}, ${TmpColors.Color4[0].a})`;
        }

        return "";
    }

    /** @internal */
    public get _noContextSwitch(): boolean {
        return attributeInFragmentOnly[this.name];
    }

    private _emit(state: NodeMaterialBuildState) {
        // Uniforms
        if (this.isUniform) {
            if (!this._associatedVariableName) {
                this._associatedVariableName = state._getFreeVariableName("u_" + this.name);
            }

            if (this.isConstant) {
                if (state.constants.indexOf(this.associatedVariableName) !== -1) {
                    return;
                }
                state.constants.push(this.associatedVariableName);
                state._constantDeclaration += state._declareOutput(this.output, true) + ` = ${this._emitConstant(state)};\n`;
                return;
            }

            if (state.uniforms.indexOf(this.associatedVariableName) !== -1) {
                return;
            }

            state._emitUniformFromString(this._associatedVariableName, this.type);

            if (state.shaderLanguage === ShaderLanguage.WGSL) {
                this._prefix = "uniforms.";
            }

            // well known
            const hints = state.sharedData.hints;
            if (this._systemValue !== null && this._systemValue !== undefined) {
                switch (this._systemValue) {
                    case NodeMaterialSystemValues.WorldView:
                        hints.needWorldViewMatrix = true;
                        break;
                    case NodeMaterialSystemValues.WorldViewProjection:
                        hints.needWorldViewProjectionMatrix = true;
                        break;
                }
            } else {
                if (this._animationType !== AnimatedInputBlockTypes.None) {
                    state.sharedData.animatedInputs.push(this);
                }
            }

            return;
        }

        // Attribute
        if (this.isAttribute) {
            this.associatedVariableName = remapAttributeName[this.name] ?? this.name;

            if (this.name === "particle_positionw") {
                state.sharedData.defines["POSITIONW_AS_VARYING"] = "true";
            }
            if (this.target === NodeMaterialBlockTargets.Vertex && state._vertexState) {
                // Attribute for fragment need to be carried over by varyings
                if (attributeInFragmentOnly[this.name]) {
                    if (attributeAsUniform[this.name]) {
                        state._emitUniformFromString(this.declarationVariableName, this.type);
                        if (state.shaderLanguage === ShaderLanguage.WGSL) {
                            this._prefix = `vertexInputs.`;
                        }
                    } else {
                        state._emitVaryingFromString(this.declarationVariableName, this.type);
                    }
                } else {
                    this._emit(state._vertexState);
                }
                return;
            }

            const alreadyDeclared = state.attributes.indexOf(this.declarationVariableName) !== -1;

            if (!alreadyDeclared) {
                state.attributes.push(this.declarationVariableName);
            }

            if (attributeInFragmentOnly[this.name]) {
                if (attributeAsUniform[this.name]) {
                    if (!alreadyDeclared) {
                        state._emitUniformFromString(this.declarationVariableName, this.type);
                    }
                    if (state.shaderLanguage === ShaderLanguage.WGSL) {
                        this._prefix = `uniforms.`;
                    }
                } else {
                    if (!alreadyDeclared) {
                        state._emitVaryingFromString(this.declarationVariableName, this.type);
                    }
                    if (state.shaderLanguage === ShaderLanguage.WGSL) {
                        this._prefix = `fragmentInputs.`;
                    }
                }
            } else {
                if (state.shaderLanguage === ShaderLanguage.WGSL) {
                    if (!alreadyDeclared) {
                        const defineName = attributeDefine[this.name];
                        if (defineName) {
                            state._attributeDeclaration += this._emitDefine(defineName);
                            state._attributeDeclaration += `attribute ${this.declarationVariableName}: ${state._getShaderType(this.type)};\n`;
                            state._attributeDeclaration += `#else\n`;
                            state._attributeDeclaration += `var<private> ${this.declarationVariableName}: ${state._getShaderType(this.type)} = ${state._getShaderType(this.type)}(0.);\n`;
                            state._attributeDeclaration += `#endif\n`;
                        } else {
                            state._attributeDeclaration += `attribute ${this.declarationVariableName}: ${state._getShaderType(this.type)};\n`;
                        }
                    }
                    this._prefix = `vertexInputs.`;
                } else {
                    if (!alreadyDeclared) {
                        const defineName = attributeDefine[this.name];
                        if (defineName) {
                            state._attributeDeclaration += this._emitDefine(defineName);
                            state._attributeDeclaration += `attribute ${state._getShaderType(this.type)} ${this.declarationVariableName};\n`;
                            state._attributeDeclaration += `#else\n`;
                            state._attributeDeclaration += `${state._getShaderType(this.type)} ${this.declarationVariableName} = ${state._getShaderType(this.type)}(0.);\n`;
                            state._attributeDeclaration += `#endif\n`;
                        } else {
                            state._attributeDeclaration += `attribute ${state._getShaderType(this.type)} ${this.declarationVariableName};\n`;
                        }
                    }
                }
            }
        }
    }

    /**
     * @internal
     */
    public _transmitWorld(effect: Effect, world: Matrix, worldView: Matrix, worldViewProjection: Matrix) {
        if (!this._systemValue) {
            return;
        }

        const variableName = this._associatedVariableName;
        switch (this._systemValue) {
            case NodeMaterialSystemValues.World:
                effect.setMatrix(variableName, world);
                break;
            case NodeMaterialSystemValues.WorldView:
                effect.setMatrix(variableName, worldView);
                break;
            case NodeMaterialSystemValues.WorldViewProjection:
                effect.setMatrix(variableName, worldViewProjection);
                break;
        }
    }

    /**
     * @internal
     */
    public _transmit(effect: Effect, scene: Scene, material: NodeMaterial) {
        if (this.isAttribute) {
            return;
        }

        const variableName = this._associatedVariableName;
        if (this._systemValue) {
            switch (this._systemValue) {
                case NodeMaterialSystemValues.World:
                case NodeMaterialSystemValues.WorldView:
                case NodeMaterialSystemValues.WorldViewProjection:
                    return;
                case NodeMaterialSystemValues.View:
                    effect.setMatrix(variableName, scene.getViewMatrix());
                    break;
                case NodeMaterialSystemValues.Projection:
                    effect.setMatrix(variableName, scene.getProjectionMatrix());
                    break;
                case NodeMaterialSystemValues.ProjectionInverse: {
                    const projectionMatrix = scene.getProjectionMatrix();
                    projectionMatrix.invertToRef(TmpVectors.Matrix[0]);
                    effect.setMatrix(variableName, TmpVectors.Matrix[0]);
                    break;
                }
                case NodeMaterialSystemValues.ViewProjection:
                    effect.setMatrix(variableName, scene.getTransformMatrix());
                    break;
                case NodeMaterialSystemValues.CameraPosition:
                    scene.bindEyePosition(effect, variableName, true);
                    break;
                case NodeMaterialSystemValues.CameraForward:
                    if (scene.activeCamera) {
                        const transform = scene.activeCamera.getWorldMatrix();
                        const forward = TmpVectors.Vector3[2];
                        forward.set(0, 0, scene.useRightHandedSystem ? -1 : 1);
                        const worldForward = new Vector3();
                        Vector3.TransformNormalToRef(forward, transform, worldForward);
                        worldForward.normalize();

                        effect.setVector3(variableName, worldForward);
                    }
                    break;
                case NodeMaterialSystemValues.FogColor:
                    effect.setColor3(variableName, scene.fogColor);
                    break;
                case NodeMaterialSystemValues.DeltaTime:
                    effect.setFloat(variableName, scene.deltaTime / 1000.0);
                    break;
                case NodeMaterialSystemValues.CameraParameters:
                    if (scene.activeCamera) {
                        effect.setFloat4(
                            variableName,
                            scene.getEngine().hasOriginBottomLeft ? -1 : 1,
                            scene.activeCamera.minZ,
                            scene.activeCamera.maxZ,
                            1 / scene.activeCamera.maxZ
                        );
                    }
                    break;
                case NodeMaterialSystemValues.MaterialAlpha:
                    effect.setFloat(variableName, material.alpha);
                    break;
            }
            return;
        }

        const value = this._valueCallback ? this._valueCallback() : this._storedValue;

        if (value === null) {
            return;
        }

        switch (this.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                effect.setFloat(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Int:
                effect.setInt(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                TmpColors.Color3[0].set(this.value.r, this.value.g, this.value.b);
                if (this.convertToGammaSpace) {
                    TmpColors.Color3[0].toGammaSpaceToRef(TmpColors.Color3[0], scene.getEngine().useExactSrgbConversions);
                }
                if (this.convertToLinearSpace) {
                    TmpColors.Color3[0].toLinearSpaceToRef(TmpColors.Color3[0], scene.getEngine().useExactSrgbConversions);
                }
                effect.setColor3(variableName, TmpColors.Color3[0]);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                TmpColors.Color4[0].set(this.value.r, this.value.g, this.value.b, this.value.a);
                if (this.convertToGammaSpace) {
                    TmpColors.Color4[0].toGammaSpaceToRef(TmpColors.Color4[0], scene.getEngine().useExactSrgbConversions);
                }
                if (this.convertToLinearSpace) {
                    TmpColors.Color4[0].toLinearSpaceToRef(TmpColors.Color4[0], scene.getEngine().useExactSrgbConversions);
                }
                effect.setDirectColor4(variableName, TmpColors.Color4[0]);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                effect.setVector2(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                effect.setVector3(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                effect.setVector4(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                effect.setMatrix(variableName, value);
                break;
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (this.isUniform || this.isSystemValue) {
            state.sharedData.inputBlocks.push(this);
        }

        this._emit(state);
    }

    protected override _dumpPropertiesCode() {
        const variableName = this._codeVariableName;

        if (this.isAttribute) {
            return super._dumpPropertiesCode() + `${variableName}.setAsAttribute("${this.name}");\n`;
        }
        if (this.isSystemValue) {
            return super._dumpPropertiesCode() + `${variableName}.setAsSystemValue(BABYLON.NodeMaterialSystemValues.${NodeMaterialSystemValues[this._systemValue!]});\n`;
        }
        if (this.isUniform) {
            const codes: string[] = [];

            let valueString = "";

            switch (this.type) {
                case NodeMaterialBlockConnectionPointTypes.Float:
                    valueString = `${this.value}`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector2:
                    valueString = `new BABYLON.Vector2(${this.value.x}, ${this.value.y})`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector3:
                    valueString = `new BABYLON.Vector3(${this.value.x}, ${this.value.y}, ${this.value.z})`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector4:
                    valueString = `new BABYLON.Vector4(${this.value.x}, ${this.value.y}, ${this.value.z}, ${this.value.w})`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Color3:
                    valueString = `new BABYLON.Color3(${this.value.r}, ${this.value.g}, ${this.value.b})`;
                    if (this.convertToGammaSpace) {
                        valueString += ".toGammaSpace()";
                    }
                    if (this.convertToLinearSpace) {
                        valueString += ".toLinearSpace()";
                    }
                    break;
                case NodeMaterialBlockConnectionPointTypes.Color4:
                    valueString = `new BABYLON.Color4(${this.value.r}, ${this.value.g}, ${this.value.b}, ${this.value.a})`;
                    if (this.convertToGammaSpace) {
                        valueString += ".toGammaSpace()";
                    }
                    if (this.convertToLinearSpace) {
                        valueString += ".toLinearSpace()";
                    }
                    break;
                case NodeMaterialBlockConnectionPointTypes.Matrix:
                    valueString = `BABYLON.Matrix.FromArray([${(this.value as Matrix).m.join(", ")}])`;
                    break;
            }

            // Common Property "Value"
            codes.push(`${variableName}.value = ${valueString}`);

            // Float-Value-Specific Properties
            if (this.type === NodeMaterialBlockConnectionPointTypes.Float) {
                codes.push(
                    `${variableName}.min = ${this.min}`,
                    `${variableName}.max = ${this.max}`,
                    `${variableName}.isBoolean = ${this.isBoolean}`,
                    `${variableName}.matrixMode = ${this.matrixMode}`,
                    `${variableName}.animationType = BABYLON.AnimatedInputBlockTypes.${AnimatedInputBlockTypes[this.animationType]}`
                );
            }

            // Common Property "Type"
            codes.push(`${variableName}.isConstant = ${this.isConstant}`);

            codes.push("");

            return super._dumpPropertiesCode() + codes.join(";\n");
        }
        return super._dumpPropertiesCode();
    }

    public override dispose() {
        this.onValueChangedObservable.clear();

        super.dispose();
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.type = this.type;
        serializationObject.mode = this._mode;
        serializationObject.systemValue = this._systemValue;
        serializationObject.animationType = this._animationType;
        serializationObject.min = this.min;
        serializationObject.max = this.max;
        serializationObject.isBoolean = this.isBoolean;
        serializationObject.matrixMode = this.matrixMode;
        serializationObject.isConstant = this.isConstant;
        serializationObject.groupInInspector = this.groupInInspector;
        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;

        if (this._storedValue != null && this._mode === NodeMaterialBlockConnectionPointMode.Uniform) {
            if (this._storedValue.asArray) {
                serializationObject.valueType = "BABYLON." + this._storedValue.getClassName();
                serializationObject.value = this._storedValue.asArray();
            } else {
                serializationObject.valueType = "number";
                serializationObject.value = this._storedValue;
            }
        }

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        this._mode = serializationObject.mode;
        super._deserialize(serializationObject, scene, rootUrl);

        this._type = serializationObject.type;

        this._systemValue = serializationObject.systemValue || serializationObject.wellKnownValue;
        this._animationType = serializationObject.animationType;
        this.min = serializationObject.min || 0;
        this.max = serializationObject.max || 0;
        this.isBoolean = !!serializationObject.isBoolean;
        this.matrixMode = serializationObject.matrixMode || 0;
        this.isConstant = !!serializationObject.isConstant;
        this.groupInInspector = serializationObject.groupInInspector || "";
        this.convertToGammaSpace = !!serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;

        // Tangents back compat
        if (
            serializationObject.name === "tangent" &&
            serializationObject.mode === NodeMaterialBlockConnectionPointMode.Attribute &&
            serializationObject.type === NodeMaterialBlockConnectionPointTypes.Vector3
        ) {
            this._type = NodeMaterialBlockConnectionPointTypes.Vector4;
        }

        if (!serializationObject.valueType) {
            return;
        }

        if (serializationObject.valueType === "number") {
            this._storedValue = serializationObject.value;
        } else {
            const valueType = GetClass(serializationObject.valueType);

            if (valueType) {
                this._storedValue = valueType.FromArray(serializationObject.value);
            }
        }
    }
}

RegisterClass("BABYLON.InputBlock", InputBlock);
