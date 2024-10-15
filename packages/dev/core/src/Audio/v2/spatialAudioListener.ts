import type { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes";
import type { IDisposable } from "../../scene";
import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISpatialAudioTransformOptions } from "./spatialAudioTransform";
import { SpatialAudioTransform } from "./spatialAudioTransform";

export class SpatialAudioListener implements IDisposable {
    private _engine: AbstractAudioEngine;
    private _spatialTransform: SpatialAudioTransform;

    public constructor(engine: AbstractAudioEngine, options?: ISpatialAudioTransformOptions) {
        this._engine = engine;
        this._spatialTransform = new SpatialAudioTransform(options);

        this._engine.listeners.add(this);
    }

    public dispose(): void {
        this._engine.listeners.delete(this);

        this._spatialTransform.dispose();
    }

    public get position(): Vector3 {
        return this._spatialTransform.position;
    }

    public set position(position: Vector3) {
        this._spatialTransform.position = position;
    }

    public get rotation(): Quaternion {
        return this._spatialTransform.rotation;
    }

    public set rotation(rotation: Quaternion) {
        this._spatialTransform.rotation = rotation;
    }

    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._spatialTransform.attachedTransformNode;
    }

    public set attachedTransformNode(node: Nullable<TransformNode>) {
        this._spatialTransform.attachedTransformNode = node;
    }
}
