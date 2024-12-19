import type { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes/transformNode";
import type { IDisposable } from "../../scene";
import type { Nullable } from "../../types";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { ISpatialAudioTransformOptions } from "./spatialAudioTransform";
import { SpatialAudioTransform } from "./spatialAudioTransform";

/** @internal */
export class SpatialAudioListener implements IDisposable {
    private _engine: AudioEngineV2;
    private _spatialTransform: SpatialAudioTransform;

    /** @internal */
    constructor(engine: AudioEngineV2, options: Nullable<ISpatialAudioTransformOptions> = null) {
        this._engine = engine;
        this._spatialTransform = new SpatialAudioTransform(options);

        this._engine.listeners.add(this);
    }

    /** @internal */
    public dispose(): void {
        this._engine.listeners.delete(this);

        this._spatialTransform.dispose();
    }

    /** @internal */
    public get position(): Vector3 {
        return this._spatialTransform.position;
    }

    public set position(position: Vector3) {
        this._spatialTransform.position = position;
    }

    /** @internal */
    public get rotation(): Quaternion {
        return this._spatialTransform.rotation;
    }

    public set rotation(rotation: Quaternion) {
        this._spatialTransform.rotation = rotation;
    }

    /** @internal */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._spatialTransform.attachedTransformNode;
    }

    public set attachedTransformNode(node: Nullable<TransformNode>) {
        this._spatialTransform.attachedTransformNode = node;
    }
}
