import { Tools } from "babylonjs/Misc/tools";
import { TmpVectors, Vector3 } from "babylonjs/Maths/math.vector";
import { float } from "babylonjs/types";

import { VolumeBasedPanel } from "./volumeBasedPanel";
import { Control3D } from "./control3D";
import { Container3D } from "./container3D";

/**
 * Class used to create a container panel where items get randomized planar mapping
 */
export class ScatterPanel extends VolumeBasedPanel {
    private _iteration = 100.0;

    /**
     * Gets or sets the number of iteration to use to scatter the controls (100 by default)
     */
    public get iteration(): float {
        return this._iteration;
    }

    public set iteration(value: float) {
        if (this._iteration === value) {
            return;
        }

        this._iteration = value;

        Tools.SetImmediate(() => {
            this._arrangeChildren();
        });
    }

    protected _mapGridNode(control: Control3D, nodePosition: Vector3) {
        let mesh = control.mesh;
        let newPos = this._scatterMapping(nodePosition);

        if (!mesh) {
            return;
        }

        switch (this.orientation) {
            case Container3D.FACEORIGIN_ORIENTATION:
            case Container3D.FACEFORWARD_ORIENTATION:
                mesh.lookAt(new Vector3(0, 0, 1));
                break;
            case Container3D.FACEFORWARDREVERSED_ORIENTATION:
            case Container3D.FACEORIGINREVERSED_ORIENTATION:
                mesh.lookAt(new Vector3(0, 0, -1));
                break;
        }

        control.position = newPos;
    }

    private _scatterMapping(source: Vector3): Vector3 {
        source.x = (1.0 - Math.random() * 2.0) * this._cellWidth;
        source.y = (1.0 - Math.random() * 2.0) * this._cellHeight;

        return source;
    }

    protected _finalProcessing() {
        var meshes = [];
        for (var child of this._children) {
            if (!child.mesh) {
                continue;
            }

            meshes.push(child.mesh);
        }

        for (var count = 0; count < this._iteration; count++) {
            meshes.sort((a, b) => {
                let distance1 = a.position.lengthSquared();
                let distance2 = b.position.lengthSquared();

                if (distance1 < distance2) {
                    return 1;
                } else if (distance1 > distance2) {
                    return -1;
                }

                return 0;
            });

            let radiusPaddingSquared = Math.pow(this.margin, 2.0);
            let cellSize = Math.max(this._cellWidth, this._cellHeight);
            let difference2D = TmpVectors.Vector2[0];
            let difference = TmpVectors.Vector3[0];

            for (let i = 0; i < meshes.length - 1; i++) {
                for (let j = i + 1; j < meshes.length; j++) {
                    if (i != j) {
                        meshes[j].position.subtractToRef(meshes[i].position, difference);

                        // Ignore Z axis
                        difference2D.x = difference.x;
                        difference2D.y = difference.y;
                        let combinedRadius = cellSize;
                        let distance = difference2D.lengthSquared() - radiusPaddingSquared;
                        let minSeparation = Math.min(distance, radiusPaddingSquared);
                        distance -= minSeparation;

                        if (distance < (Math.pow(combinedRadius, 2.0))) {
                            difference2D.normalize();
                            difference.scaleInPlace((combinedRadius - Math.sqrt(distance)) * 0.5);
                            meshes[j].position.addInPlace(difference);
                            meshes[i].position.subtractInPlace(difference);
                        }
                    }
                }
            }
        }
    }
}