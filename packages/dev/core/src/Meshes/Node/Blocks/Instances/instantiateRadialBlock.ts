import { InstantiateBlock } from "./instantiateBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import { type NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { VertexData } from "core/Meshes/mesh.vertexData";
import type { Nullable } from "core/types";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { INodeGeometryInstancingContext } from "../../Interfaces/nodeGeometryInstancingContext";

/**
 * Block used to clone geometry in a radial shape
 */
export class InstantiateRadialBlock extends InstantiateBlock implements INodeGeometryExecutionContext, INodeGeometryInstancingContext {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { rebuild: true } })
    public evaluateContext = true;
    /**
     * Create a new InstantiateRadialBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry, false);
        this.registerInput("count", NodeGeometryBlockConnectionPointTypes.Int, true, 1, 0);
        this.registerInput("origin", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        //Per step or total
        this.registerInput("radius", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0);

        //Angle start and end
        this.registerInput("angleStart", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("angleEnd", NodeGeometryBlockConnectionPointTypes.Float, true, 0);

        this.registerInput("clonerCenterOrGlobalForward", NodeGeometryBlockConnectionPointTypes.Int, true, 0, 0, 1);

        //transform offset
        this.registerInput("transform", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));

        //rotation is magnitude per step, or total rotation
        this.registerInput("rotation", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));

        //scale is magnitude per step, or total rotation
        this.registerInput("scale", NodeGeometryBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        this.scale.acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InstantiateRadialBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the count input component
     */
    public get count(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the origin input component
     */
    public get origin(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the direction input component
     */
    public get radius(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the direction input component
     */
    public get angleStart(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the direction input component
     */
    public get angleEnd(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the clonerCenterOrGlobalForward input component
     */
    public get clonerCenterOrGlobalForward(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the transformPerStepOrTotal input component
     */
    public get transform(): NodeGeometryConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the rotation input component
     */
    public get rotation(): NodeGeometryConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeGeometryConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            state.pushExecutionContext(this);

            this._vertexData = this.geometry.getConnectedValue(state);
            state.pushGeometryContext(this._vertexData);

            if (!this._vertexData || !this._vertexData.positions || !this.geometry.isConnected) {
                state.restoreExecutionContext();
                state.restoreGeometryContext();
                this.output._storedValue = null;
                return;
            }
            const count = this.count.getConnectedValue(state) as number;

            if (count <= 0) {
                this.output._storedValue = this._vertexData;
                state.restoreExecutionContext();
                state.restoreGeometryContext();
                return this._vertexData;
            }

            const origin = this.origin.getConnectedValue(state) as Vector3;
            const radius = this.radius.getConnectedValue(state) as number;
            const angleStart: number = this.angleStart.getConnectedValue(state) as number;
            const angleEnd = this.angleEnd.getConnectedValue(state) as number;

            const clonerCenterOrGlobalForward = this.clonerCenterOrGlobalForward.getConnectedValue(state) as number;

            const transform = this.transform.getConnectedValue(state) as Vector3;

            const rotation = this.rotation.getConnectedValue(state) as Vector3;

            const scale = state.adaptInput(this.scale, NodeGeometryBlockConnectionPointTypes.Vector3, Vector3.OneReadOnly);

            const invertRadians = Math.PI / 180;
            const angleStartRadians = angleStart * invertRadians;
            const angleEndRadians = angleEnd * invertRadians;
            const pieSlice = Math.PI * 2 - (angleStartRadians + angleEndRadians);
            const rStep = pieSlice / count;

            const results = [];

            let rootData: Nullable<VertexData> = null;

            const transformMatrix = Matrix.Identity();
            const transformOffset = Vector3.Zero();
            const rotationOffset = Vector3.Zero();
            const scaleOffset = Vector3.Zero();

            for (this._currentIndex = 0; this._currentIndex < count; this._currentIndex++) {
                const clone = this._vertexData.clone();

                const centerForward = new Vector3(0, 0, 1);
                const angle = angleStartRadians + rStep * this._currentIndex;
                const angleQuat = Quaternion.FromEulerAngles(0, angle, 0);
                centerForward.rotateByQuaternionToRef(angleQuat, centerForward);
                const objectOrigin = centerForward.scale(radius).add(origin);

                transformOffset.copyFrom(transform.clone().scale(this._currentIndex));
                if (clonerCenterOrGlobalForward == 0) {
                    transformOffset.rotateByQuaternionToRef(angleQuat, transformOffset);
                }
                transformOffset.addInPlace(objectOrigin);

                rotationOffset.copyFrom(rotation.clone().scale(this._currentIndex));

                scaleOffset.copyFrom(scale.clone().scale(this._currentIndex));
                scaleOffset.addInPlace(new Vector3(1, 1, 1));

                const rotQuat = Quaternion.FromEulerAngles(rotationOffset.x * invertRadians, rotationOffset.y * invertRadians, rotationOffset.z * invertRadians);

                if (clonerCenterOrGlobalForward == 0) {
                    rotQuat.multiplyInPlace(angleQuat);
                }

                Matrix.ComposeToRef(scaleOffset, rotQuat, transformOffset, transformMatrix);
                clone.transform(transformMatrix);

                if (!rootData) {
                    rootData = clone;
                } else {
                    results.push(clone);
                }
            }

            if (rootData) {
                rootData.merge(results, false, false, true, true);
                this._vertexData = rootData;
            }

            this._vertexData.merge(results, false, false, true, true);
            // Storage

            state.restoreExecutionContext();
            state.restoreGeometryContext();
            return this._vertexData;
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }
}

RegisterClass("BABYLON.InstantiateRadialBlock", InstantiateRadialBlock);
