/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { ISpatialAudioTransformOptions } from "./spatialAudioTransform";
import { SpatialAudioTransform } from "./spatialAudioTransform";
import type { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes";
import type { IDisposable } from "../../scene";
import type { Nullable } from "../../types";

export class SpatialAudioListener implements IDisposable {
    public constructor(engine: AbstractAudioEngine, options?: ISpatialAudioTransformOptions) {
        this._engine = engine;
        this._spatialTransform = new SpatialAudioTransform(options);

        this._engine._addListener(this);
    }

    public dispose(): void {
        this._engine._removeListener(this);

        this._spatialTransform.dispose();
    }

    private _engine: AbstractAudioEngine;

    private _spatialTransform: SpatialAudioTransform;

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
