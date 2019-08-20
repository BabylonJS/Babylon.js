import { Nullable } from "../types";
import { AxesViewer } from "../Debug/axesViewer";
import { Vector3 } from "../Maths/math.vector";
import { Mesh } from "../Meshes/mesh";
import { Bone } from "../Bones/bone";
import { Scene } from "../scene";
import { Axis } from '../Maths/math.axis';

/**
     * The BoneAxesViewer will attach 3 axes to a specific bone of a specific mesh
     * @see demo here: https://www.babylonjs-playground.com/#0DE8F4#8
     */
export class BoneAxesViewer extends AxesViewer {

    /**
     * Gets or sets the target mesh where to display the axes viewer
     */
    public mesh: Nullable<Mesh>;
    /**
     * Gets or sets the target bone where to display the axes viewer
     */
    public bone: Nullable<Bone>;

    /** Gets current position */
    public pos = Vector3.Zero();
    /** Gets direction of X axis */
    public xaxis = Vector3.Zero();
    /** Gets direction of Y axis */
    public yaxis = Vector3.Zero();
    /** Gets direction of Z axis */
    public zaxis = Vector3.Zero();

    /**
     * Creates a new BoneAxesViewer
     * @param scene defines the hosting scene
     * @param bone defines the target bone
     * @param mesh defines the target mesh
     * @param scaleLines defines a scaling factor for line length (1 by default)
     */
    constructor(scene: Scene, bone: Bone, mesh: Mesh, scaleLines = 1) {

        super(scene, scaleLines);

        this.mesh = mesh;
        this.bone = bone;

    }

    /**
     * Force the viewer to update
     */
    public update(): void {

        if (!this.mesh || !this.bone) {
            return;
        }

        var bone = this.bone;
        bone._markAsDirtyAndCompose();
        bone.getAbsolutePositionToRef(this.mesh, this.pos);
        bone.getDirectionToRef(Axis.X, this.mesh, this.xaxis);
        bone.getDirectionToRef(Axis.Y, this.mesh, this.yaxis);
        bone.getDirectionToRef(Axis.Z, this.mesh, this.zaxis);

        super.update(this.pos, this.xaxis, this.yaxis, this.zaxis);

    }

    /** Releases resources */
    public dispose() {

        if (this.mesh) {
            this.mesh = null;
            this.bone = null;

            super.dispose();

        }
    }

}