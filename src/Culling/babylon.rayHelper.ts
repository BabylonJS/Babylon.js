module BABYLON {
    export class RayHelper {
        
        public ray:Ray;

        private _renderPoints: Vector3[];
        private _renderLine: LinesMesh;
        private _renderFunction: () => void;
        private _scene: Scene;
        
        private _updateToMeshFunction: () => void;
        private _attachedToMesh: AbstractMesh;
        private _meshSpaceDirection: Vector3;
        private _meshSpaceOrigin: Vector3;

        constructor(ray:Ray) {
            this.ray = ray;
        }

        public show(scene:Scene, color:Color3): void{

            if(!this._renderFunction){

                var ray = this.ray;

                this._renderFunction = this._render.bind(this);
                this._scene = scene;
                this._renderPoints = [ray.origin, ray.origin.add(ray.direction.scale(ray.length))];
                this._renderLine = Mesh.CreateLines("ray", this._renderPoints, scene, true);

                this._scene.registerBeforeRender(this._renderFunction);

            }

            if (color) {
                this._renderLine.color.copyFrom(color);
            }

        }

        public hide(): void{

            if(this._renderFunction){
                this._scene.unregisterBeforeRender(this._renderFunction);
                this._scene = null;
                this._renderFunction = null;
                this._renderLine.dispose();
                this._renderLine = null;
                this._renderPoints = null;
            }

        }

        private _render(): void {

            var ray = this.ray;

            var point = this._renderPoints[1];
            var len = Math.min(ray.length, 1000000);
            
            point.copyFrom(ray.direction);
            point.scaleInPlace(len);
            point.addInPlace(ray.origin);

            Mesh.CreateLines("ray", this._renderPoints, this._scene, true, this._renderLine);

        }

        public attachToMesh(mesh:AbstractMesh, meshSpaceDirection?:Vector3, meshSpaceOrigin?:Vector3, length?:number): void{

            this._attachedToMesh = mesh;

            var ray = this.ray;

            if(!ray.direction){
                ray.direction = Vector3.Zero();
            }

            if(!ray.origin){
                ray.origin = Vector3.Zero();
            }

            if(length){
                ray.length = length;
            }

            if(!meshSpaceOrigin){
                meshSpaceOrigin = Vector3.Zero();
            }

            if(!meshSpaceDirection){
                // -1 so that this will work with Mesh.lookAt
                meshSpaceDirection = new Vector3(0, 0, -1);
            }

            if(!this._meshSpaceDirection){
                this._meshSpaceDirection = meshSpaceDirection.clone();
                this._meshSpaceOrigin = meshSpaceOrigin.clone();
            }else{
                this._meshSpaceDirection.copyFrom(meshSpaceDirection);
                this._meshSpaceOrigin.copyFrom(meshSpaceOrigin);
            }

            if(!this._updateToMeshFunction){
                this._updateToMeshFunction = this._updateToMesh.bind(this);
                this._attachedToMesh.getScene().registerBeforeRender(this._updateToMeshFunction);
            }

            this._updateToMesh();

        }

        public detachFromMesh(): void{

            if(this._attachedToMesh){
                this._attachedToMesh.getScene().unregisterBeforeRender(this._updateToMeshFunction);
                this._attachedToMesh = null;
                this._updateToMeshFunction = null;
            }

        }

        private _updateToMesh(): void{

            var ray = this.ray;

            if(this._attachedToMesh._isDisposed){
                this.detachFromMesh();
                return;
            }

            this._attachedToMesh.getDirectionToRef(this._meshSpaceDirection, ray.direction);
            Vector3.TransformCoordinatesToRef(this._meshSpaceOrigin, this._attachedToMesh.getWorldMatrix(), ray.origin);

        }

        public dispose(): void{

            this.hide();
            this.detachFromMesh();
            this.ray = null;

        }

    }
}