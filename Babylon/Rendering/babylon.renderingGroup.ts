module BABYLON {
    export class RenderingGroup {
        private _scene: Scene
        private _opaqueSubMeshes = new BABYLON.SmartArray<SubMesh>(256);
        private _transparentSubMeshes = new BABYLON.SmartArray<SubMesh>(256);
        private _alphaTestSubMeshes = new BABYLON.SmartArray<SubMesh>(256);
        private _activeVertices: number;

        constructor(public index: number, scene: Scene) {
            this._scene = scene;
        }

        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents: () => void) => void,
                      beforeTransparents): boolean {
            if (customRenderFunction) {
                customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, beforeTransparents);
                return true;
            }

            if (this._opaqueSubMeshes.length === 0 && this._alphaTestSubMeshes.length === 0 && this._transparentSubMeshes.length === 0) {
                return false;
            }
            var engine = this._scene.getEngine();
            // Opaque
            var subIndex: number;
            var submesh: SubMesh;

            for (subIndex = 0; subIndex < this._opaqueSubMeshes.length; subIndex++) {
                submesh = this._opaqueSubMeshes.data[subIndex];
                this._activeVertices += submesh.verticesCount;

                submesh.render();
            }

            // Alpha test
            engine.setAlphaTesting(true);
            for (subIndex = 0; subIndex < this._alphaTestSubMeshes.length; subIndex++) {
                submesh = this._alphaTestSubMeshes.data[subIndex];
                this._activeVertices += submesh.verticesCount;

                submesh.render();
            }
            engine.setAlphaTesting(false);

            if (beforeTransparents) {
                beforeTransparents();
            }

            // Transparent
            if (this._transparentSubMeshes.length) {
                // Sorting
                for (subIndex = 0; subIndex < this._transparentSubMeshes.length; subIndex++) {
                    submesh = this._transparentSubMeshes.data[subIndex];
                    submesh._distanceToCamera = submesh.getBoundingInfo().boundingSphere.centerWorld.subtract(this._scene.activeCamera.position).length();
                }

                var sortedArray = this._transparentSubMeshes.data.slice(0, this._transparentSubMeshes.length);

                sortedArray.sort((a, b) => {
                    if (a._distanceToCamera < b._distanceToCamera) {
                        return 1;
                    }
                    if (a._distanceToCamera > b._distanceToCamera) {
                        return -1;
                    }

                    return 0;
                });

                // Rendering
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
                for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                    submesh = sortedArray[subIndex];
                    this._activeVertices += submesh.verticesCount;

                    submesh.render();
                }
                engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
            }
            return true;
        }


        public prepare(): void {
            this._opaqueSubMeshes.reset();
            this._transparentSubMeshes.reset();
            this._alphaTestSubMeshes.reset();
        }

        public dispatch(subMesh: SubMesh): void {
            var material = subMesh.getMaterial();
            var mesh = subMesh.getMesh();

            if (material.needAlphaBlending() || mesh.visibility < 1.0) { // Transparent
                if (material.alpha > 0 || mesh.visibility < 1.0) {
                    this._transparentSubMeshes.push(subMesh);
                }
            } else if (material.needAlphaTesting()) { // Alpha test
                this._alphaTestSubMeshes.push(subMesh);
            } else {
                this._opaqueSubMeshes.push(subMesh); // Opaque
            }
        }
    }
} 