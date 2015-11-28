module BABYLON {
    export class RenderingGroup {
        private _scene: Scene
        private _opaqueSubMeshes = new SmartArray<SubMesh>(256);
        private _transparentSubMeshes = new SmartArray<SubMesh>(256);
        private _alphaTestSubMeshes = new SmartArray<SubMesh>(256);
        private _activeVertices: number;

        public onBeforeTransparentRendering: () => void;

        constructor(public index: number, scene: Scene) {
            this._scene = scene;
        }

        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>) => void): boolean {
            if (customRenderFunction) {
                customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes);
                return true;
            }

            if (this._opaqueSubMeshes.length === 0 && this._alphaTestSubMeshes.length === 0 && this._transparentSubMeshes.length === 0) {
                if (this.onBeforeTransparentRendering) {
                    this.onBeforeTransparentRendering();
                }
                return false;
            }
            var engine = this._scene.getEngine();
            // Opaque
            var subIndex: number;
            var submesh: SubMesh;

            for (subIndex = 0; subIndex < this._opaqueSubMeshes.length; subIndex++) {
                submesh = this._opaqueSubMeshes.data[subIndex];

                submesh.render(false);
            }

            // Alpha test
            engine.setAlphaTesting(true);
            for (subIndex = 0; subIndex < this._alphaTestSubMeshes.length; subIndex++) {
                submesh = this._alphaTestSubMeshes.data[subIndex];

                submesh.render(false);
            }
            engine.setAlphaTesting(false);

            if (this.onBeforeTransparentRendering) {
                this.onBeforeTransparentRendering();
            }

            // Transparent
            if (this._transparentSubMeshes.length) {
                // Sorting
                for (subIndex = 0; subIndex < this._transparentSubMeshes.length; subIndex++) {
                    submesh = this._transparentSubMeshes.data[subIndex];
                    submesh._alphaIndex = submesh.getMesh().alphaIndex;
                    submesh._distanceToCamera = submesh.getBoundingInfo().boundingSphere.centerWorld.subtract(this._scene.activeCamera.globalPosition).length();
                }

                var sortedArray = this._transparentSubMeshes.data.slice(0, this._transparentSubMeshes.length);

                sortedArray.sort((a, b) => {
                    // Alpha index first
                    if (a._alphaIndex > b._alphaIndex) {
                        return 1;
                    }
                    if (a._alphaIndex < b._alphaIndex) {
                        return -1;
                    }

                    // Then distance to camera
                    if (a._distanceToCamera < b._distanceToCamera) {
                        return 1;
                    }
                    if (a._distanceToCamera > b._distanceToCamera) {
                        return -1;
                    }

                    return 0;
                });

                // Rendering                
                for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                    submesh = sortedArray[subIndex];

                    submesh.render(true);
                }
                engine.setAlphaMode(Engine.ALPHA_DISABLE);
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

            if (material.needAlphaBlending() || mesh.visibility < 1.0 || mesh.hasVertexAlpha) { // Transparent
                this._transparentSubMeshes.push(subMesh);
            } else if (material.needAlphaTesting()) { // Alpha test
                this._alphaTestSubMeshes.push(subMesh);
            } else {
                this._opaqueSubMeshes.push(subMesh); // Opaque
            }
        }
    }
} 