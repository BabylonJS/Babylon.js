import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockConnectionPointMode } from '../../Enums/nodeMaterialBlockConnectionPointMode';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { Nullable } from '../../../../types';
import { Effect } from '../../../../Materials/effect';
import { Matrix, Vector2, Vector3, Vector4 } from '../../../../Maths/math.vector';
import { Scene } from '../../../../scene';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Color3, Color4 } from '../../../../Maths/math';
import { AnimatedInputBlockTypes } from './animatedInputBlockTypes';
import { Observable } from '../../../../Misc/observable';
import { MaterialHelper } from '../../../../Materials/materialHelper';

const remapAttributeName: { [name: string]: string }  = {
    "position2d": "position",
    "particle_uv": "vUV",
    "particle_color": "vColor",
    "particle_texturemask": "textureMask",
    "particle_positionw": "vPositionW",
};

const attributeInFragmentOnly: { [name: string]: boolean }  = {
    "particle_uv": true,
    "particle_color": true,
    "particle_texturemask": true,
    "particle_positionw": true,
};

const attributeAsUniform: { [name: string]: boolean }  = {
    "particle_texturemask": true,
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

    /** Gets or set a value used to limit the range of float values */
    public min: number = 0;

    /** Gets or set a value used to limit the range of float values */
    public max: number = 0;

    /** Gets or set a value indicating that this input can only get 0 and 1 values */
    public isBoolean: boolean = false;

    /** Gets or sets a value used by the Node Material editor to determine how to configure the current value if it is a matrix */
    public matrixMode: number = 0;

    /** @hidden */
    public _systemValue: Nullable<NodeMaterialSystemValues> = null;

    /** Gets or sets a boolean indicating that the value of this input will not change after a build */
    public isConstant = false;

    /** Gets or sets the group to use to display this block in the Inspector */
    public groupInInspector = "";

    /** Gets an observable raised when the value is changed */
    public onValueChangedObservable = new Observable<InputBlock>();

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
                    case "position":
                    case "normal":
                    case "tangent":
                    case "particle_positionw":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case "uv":
                    case "uv2":
                    case "position2d":
                    case "particle_uv":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector2;
                        return this._type;
                    case "matricesIndices":
                    case "matricesWeights":
                    case "world0":
                    case "world1":
                    case "world2":
                    case "world3":
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector4;
                        return this._type;
                    case "color":
                    case "particle_color":
                    case "particle_texturemask":
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
                        this._type = NodeMaterialBlockConnectionPointTypes.Matrix;
                        return this._type;
                    case NodeMaterialSystemValues.CameraPosition:
                        this._type = NodeMaterialBlockConnectionPointTypes.Vector3;
                        return this._type;
                    case NodeMaterialSystemValues.FogColor:
                        this._type = NodeMaterialBlockConnectionPointTypes.Color3;
                        return this._type;
                    case NodeMaterialSystemValues.DeltaTime:
                        this._type = NodeMaterialBlockConnectionPointTypes.Float;
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
        super(name, target, false, true);

        this._type = type;

        this.setDefaultValue();

        this.registerOutput("output", type);
    }

    /**
    * Validates if a name is a reserve word.
    * @param newName the new name to be given to the node.
    * @returns false if the name is a reserve word, else true.
    */
    public validateBlockName(newName: string) {
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
        return this._storedValue;
    }

    public set value(value: any) {
        if (this.type === NodeMaterialBlockConnectionPointTypes.Float) {
            if (this.isBoolean) {
                value = value ? 1 : 0;
            }
            else if (this.min !== this.max) {
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
     * Gets or sets the associated variable name in the shader
     */
    public get associatedVariableName(): string {
        return this._associatedVariableName;
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
    public getClassName() {
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
        }
    }

    private _emitDefine(define: string): string {
        if (define[0] === "!") {
            return `#ifndef ${define.substring(1)}\r\n`;
        }

        return `#ifdef ${define}\r\n`;
    }

    public initialize(state: NodeMaterialBuildState) {
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
                return `vec3(${this.value.r}, ${this.value.g}, ${this.value.b})`;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return `vec4(${this.value.r}, ${this.value.g}, ${this.value.b}, ${this.value.a})`;
        }

        return "";
    }

    /** @hidden */
    public get _noContextSwitch(): boolean {
        return attributeInFragmentOnly[this.name];
    }

    private _emit(state: NodeMaterialBuildState, define?: string) {
        // Uniforms
        if (this.isUniform) {
            if (!this.associatedVariableName) {
                this.associatedVariableName = state._getFreeVariableName("u_" + this.name);
            }

            if (this.isConstant) {
                if (state.constants.indexOf(this.associatedVariableName) !== -1) {
                    return;
                }
                state.constants.push(this.associatedVariableName);
                state._constantDeclaration += this._declareOutput(this.output, state) + ` = ${this._emitConstant(state)};\r\n`;
                return;
            }

            if (state.uniforms.indexOf(this.associatedVariableName) !== -1) {
                return;
            }

            state.uniforms.push(this.associatedVariableName);
            if (define) {
                state._uniformDeclaration += this._emitDefine(define);
            }
            state._uniformDeclaration += `uniform ${state._getGLType(this.type)} ${this.associatedVariableName};\r\n`;
            if (define) {
                state._uniformDeclaration += `#endif\r\n`;
            }

            // well known
            let hints = state.sharedData.hints;
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

            if (this.target === NodeMaterialBlockTargets.Vertex && state._vertexState) { // Attribute for fragment need to be carried over by varyings
                if (attributeInFragmentOnly[this.name]) {
                    if (attributeAsUniform[this.name]) {
                        state._emitUniformFromString(this.associatedVariableName, state._getGLType(this.type), define);
                    } else {
                        state._emitVaryingFromString(this.associatedVariableName, state._getGLType(this.type), define);
                    }
                } else {
                    this._emit(state._vertexState, define);
                }
                return;
            }

            if (state.attributes.indexOf(this.associatedVariableName) !== -1) {
                return;
            }

            state.attributes.push(this.associatedVariableName);

            if (attributeInFragmentOnly[this.name]) {
                if (attributeAsUniform[this.name]) {
                    state._emitUniformFromString(this.associatedVariableName, state._getGLType(this.type), define);
                } else {
                    state._emitVaryingFromString(this.associatedVariableName, state._getGLType(this.type), define);
                }
            } else {
                if (define) {
                    state._attributeDeclaration += this._emitDefine(define);
                }
                state._attributeDeclaration += `attribute ${state._getGLType(this.type)} ${this.associatedVariableName};\r\n`;
                if (define) {
                    state._attributeDeclaration += `#endif\r\n`;
                }
            }
        }
    }

    /** @hidden */
    public _transmitWorld(effect: Effect, world: Matrix, worldView: Matrix, worldViewProjection: Matrix) {
        if (!this._systemValue) {
            return;
        }

        let variableName = this.associatedVariableName;
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

    /** @hidden */
    public _transmit(effect: Effect, scene: Scene) {
        if (this.isAttribute) {
            return;
        }

        let variableName = this.associatedVariableName;
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
                case NodeMaterialSystemValues.ViewProjection:
                    effect.setMatrix(variableName, scene.getTransformMatrix());
                    break;
                case NodeMaterialSystemValues.CameraPosition:
                    MaterialHelper.BindEyePosition(effect, scene, variableName);
                    break;
                case NodeMaterialSystemValues.FogColor:
                    effect.setColor3(variableName, scene.fogColor);
                    break;
                case NodeMaterialSystemValues.DeltaTime:
                    effect.setFloat(variableName, scene.deltaTime / 1000.0);
            }
            return;
        }

        let value = this._valueCallback ? this._valueCallback() : this._storedValue;

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
                effect.setColor3(variableName, value);
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                effect.setDirectColor4(variableName, value);
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (this.isUniform || this.isSystemValue) {
            state.sharedData.inputBlocks.push(this);
        }

        this._emit(state);
    }

    protected _dumpPropertiesCode() {
        let variableName = this._codeVariableName;

        if (this.isAttribute) {
            return `${variableName}.setAsAttribute("${this.name}");\r\n`;
        }
        if (this.isSystemValue) {
            return `${variableName}.setAsSystemValue(BABYLON.NodeMaterialSystemValues.${NodeMaterialSystemValues[this._systemValue!]});\r\n`;
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
                    break;
                case NodeMaterialBlockConnectionPointTypes.Color4:
                    valueString = `new BABYLON.Color4(${this.value.r}, ${this.value.g}, ${this.value.b}, ${this.value.a})`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Matrix:
                    valueString = `BABYLON.Matrix.FromArray([${(this.value as Matrix).m}])`;
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
            codes.push(
                `${variableName}.isConstant = ${this.isConstant}`,
            );

            codes.push('');

            return codes.join(';\r\n');
        }
        return "";
    }

    public dispose() {
        this.onValueChangedObservable.clear();

        super.dispose();
    }

    public serialize(): any {
        let serializationObject = super.serialize();

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

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
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

        if (!serializationObject.valueType) {
            return;
        }

        if (serializationObject.valueType === "number") {
            this._storedValue = serializationObject.value;
        } else {
            let valueType = _TypeStore.GetClass(serializationObject.valueType);

            if (valueType) {
                this._storedValue = valueType.FromArray(serializationObject.value);
            }
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.InputBlock"] = InputBlock;