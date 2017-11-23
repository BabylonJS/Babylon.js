module BABYLON.Debug {

    export class BoneAxesViewer extends Debug.AxesViewer {

        public mesh: Nullable<Mesh>;
        public bone: Nullable<Bone>;

        public pos = Vector3.Zero();
        public xaxis = Vector3.Zero();
        public yaxis = Vector3.Zero();
        public zaxis = Vector3.Zero();

        constructor(scene: Scene, bone:Bone, mesh: Mesh, scaleLines = 1) {

            super(scene, scaleLines);

            this.mesh = mesh;
            this.bone = bone;

        }

        public update (): void {

            if (!this.mesh || !this.bone) {
                return;
            }

            var bone = this.bone;
            bone.getAbsolutePositionToRef(this.mesh, this.pos);
            bone.getDirectionToRef(Axis.X, this.mesh, this.xaxis);
            bone.getDirectionToRef(Axis.Y, this.mesh, this.yaxis);
            bone.getDirectionToRef(Axis.Z, this.mesh, this.zaxis);

            super.update(this.pos, this.xaxis, this.yaxis, this.zaxis);

        }

        public dispose() {

            if (this.mesh){
                this.mesh = null;
                this.bone = null;

                super.dispose();
            
            }
        }

    }
}
