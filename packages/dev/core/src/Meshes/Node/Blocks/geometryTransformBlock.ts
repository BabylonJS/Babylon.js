import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { Matrix, Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import type { VertexData } from "../../../Meshes/mesh.vertexData";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";

/**
 * Block used to apply a transform to a vector / geometry
 */
export class GeometryTransformBlock extends NodeGeometryBlock {
    private _rotationMatrix = new Matrix();
    private _scalingMatrix = new Matrix();
    private _translationMatrix = new Matrix();
    private _scalingRotationMatrix = new Matrix();
    private _pivotMatrix = new Matrix();
    private _backPivotMatrix = new Matrix();
    private _transformMatrix = new Matrix();

    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = true;

    /**
     * Create a new GeometryTransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix, true);
        this.registerInput("translation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scaling", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.One());
        this.registerInput("pivot", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryTransformBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix input component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the translation input component
     */
    public get translation(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the scaling input component
     */
    public get scaling(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the pivot input component
     */
    public get pivot(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func = (state: NodeGeometryBuildState) => {
            const value = this.value.getConnectedValue(state);

            if (!value) {
                return null;
            }

            let matrix: Matrix;

            if (this.matrix.isConnected) {
                matrix = this.matrix.getConnectedValue(state);
            } else {
                const scaling = this.scaling.getConnectedValue(state) || Vector3.OneReadOnly;
                const rotation = this.rotation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                const translation = this.translation.getConnectedValue(state) || Vector3.ZeroReadOnly;
                const pivot = this.pivot.getConnectedValue(state) || Vector3.ZeroReadOnly;

                // Transform
                Matrix.TranslationToRef(-pivot.x, -pivot.y, -pivot.z, this._pivotMatrix);
                Matrix.ScalingToRef(scaling.x, scaling.y, scaling.z, this._scalingMatrix);
                Matrix.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, this._rotationMatrix);
                Matrix.TranslationToRef(translation.x + pivot.x, translation.y + pivot.y, translation.z + pivot.z, this._translationMatrix);

                this._pivotMatrix.multiplyToRef(this._scalingMatrix, this._backPivotMatrix);
                this._backPivotMatrix.multiplyToRef(this._rotationMatrix, this._scalingRotationMatrix);
                this._scalingRotationMatrix.multiplyToRef(this._translationMatrix, this._transformMatrix);
                matrix = this._transformMatrix;
            }

            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Geometry: {
                    const geometry = (value as VertexData).clone();
                    geometry.transform(matrix);
                    return geometry;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2:
                    return Vector2.Transform(value, matrix);
                case NodeGeometryBlockConnectionPointTypes.Vector3:
                    return Vector3.TransformCoordinates(value, matrix);
                case NodeGeometryBlockConnectionPointTypes.Vector4:
                    return Vector4.TransformCoordinates(value, matrix);
            }

            return null;
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
    }
}

RegisterClass("BABYLON.GeometryTransformBlock", GeometryTransformBlock);
