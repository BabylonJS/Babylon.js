module BABYLON {
    export class RenderingGroup {
        private _scene: Scene;
        private _opaqueSubMeshes = new SmartArray<SubMesh>(256);
        private _transparentSubMeshes = new SmartArray<SubMesh>(256);
        private _alphaTestSubMeshes = new SmartArray<SubMesh>(256);
        private _activeVertices: number;

        private _opaqueSortCompareFn: (a: SubMesh, b: SubMesh) => number;
        private _alphaTestSortCompareFn: (a: SubMesh, b: SubMesh) => number;
        private _transparentSortCompareFn: (a: SubMesh, b: SubMesh) => number;
        
        private _renderOpaque: (subMeshes: SmartArray<SubMesh>) => void;
        private _renderAlphaTest: (subMeshes: SmartArray<SubMesh>) => void;
        private _renderTransparent: (subMeshes: SmartArray<SubMesh>) => void;

        public onBeforeTransparentRendering: () => void;

        public set opaqueSortCompareFn(value: (a: SubMesh, b: SubMesh) => number) {
            this._opaqueSortCompareFn = value;
            if (value) {
                this._renderOpaque = this.renderOpaqueSorted;
            }
            else {
                this._renderOpaque = RenderingGroup.renderUnsorted;
            }
        }

        public set alphaTestSortCompareFn(value: (a: SubMesh, b: SubMesh) => number) {
            this._alphaTestSortCompareFn = value;
            if (value) {
                this._renderAlphaTest = this.renderAlphaTestSorted;
            }
            else {
                this._renderAlphaTest = RenderingGroup.renderUnsorted;
            }
        }

        public set transparentSortCompareFn(value: (a: SubMesh, b: SubMesh) => number) {
            this._transparentSortCompareFn = value;
            if (value) {
                this._renderTransparent = this.renderTransparentSorted;
            }
            else {
                this._renderTransparent = RenderingGroup.renderUnsorted;
            }
        }

        constructor(public index: number, scene: Scene,
            opaqueSortCompareFn: (a: SubMesh, b: SubMesh) => number = null,
            alphaTestSortCompareFn: (a: SubMesh, b: SubMesh) => number = null,
            transparentSortCompareFn: (a: SubMesh, b: SubMesh) => number = RenderingGroup.defaultTransparentSortCompare) {
            this._scene = scene;

            this.opaqueSortCompareFn = opaqueSortCompareFn;
            this.alphaTestSortCompareFn = alphaTestSortCompareFn;
            this.transparentSortCompareFn = transparentSortCompareFn;            
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
            this._renderOpaque(this._opaqueSubMeshes);

            // Alpha test
            engine.setAlphaTesting(true);
            this._renderAlphaTest(this._alphaTestSubMeshes);
            engine.setAlphaTesting(false);

            if (this.onBeforeTransparentRendering) {
                this.onBeforeTransparentRendering();
            }

            // Transparent
            this._renderTransparent(this._transparentSubMeshes);
            return true;
        }

        private renderOpaqueSorted(subMeshes: SmartArray<SubMesh>): void {
            return RenderingGroup.renderSorted(subMeshes, this.opaqueSortCompareFn, this._scene.activeCamera.globalPosition);
        }

        private renderAlphaTestSorted(subMeshes: SmartArray<SubMesh>): void {
            return RenderingGroup.renderSorted(subMeshes, this.alphaTestSortCompareFn, this._scene.activeCamera.globalPosition);
        }

        private renderTransparentSorted(subMeshes: SmartArray<SubMesh>): void {
            return RenderingGroup.renderSorted(subMeshes, this.transparentSortCompareFn, this._scene.activeCamera.globalPosition);
        }

        private static renderSorted(subMeshes: SmartArray<SubMesh>, sortCompareFn: (a: SubMesh, b: SubMesh) => number, cameraPosition: Vector3): void {
            let subIndex = 0;
            let subMesh;
            for (; subIndex < subMeshes.length; subIndex++) {
                subMesh = subMeshes.data[subIndex];
                subMesh._alphaIndex = subMesh.getMesh().alphaIndex;
                subMesh._distanceToCamera = subMesh.getBoundingInfo().boundingSphere.centerWorld.subtract(cameraPosition).length();
            }

            let sortedArray = subMeshes.data.slice(0, subMeshes.length);
            sortedArray.sort(sortCompareFn);

            for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                subMesh = sortedArray[subIndex];
                subMesh.render(false);
            }
        }

        private static renderUnsorted(subMeshes: SmartArray<SubMesh>): void {
            for (var subIndex = 0; subIndex < subMeshes.length; subIndex++) {
                let submesh = subMeshes.data[subIndex];
                submesh.render(false);
            }
        }

        public static defaultTransparentSortCompare(a: SubMesh, b:SubMesh) : number {
            // Alpha index first
            if (a._alphaIndex > b._alphaIndex) {
                return 1;
            }
            if (a._alphaIndex < b._alphaIndex) {
                return -1;
            }

            // Then distance to camera
            return RenderingGroup.backToFrontSortCompare(a, b);
        }

        public static backToFrontSortCompare(a: SubMesh, b:SubMesh) : number {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return 1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return -1;
            }

            return 0;
        }

        public static frontToBackSortCompare(a: SubMesh, b:SubMesh) : number {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return -1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return 1;
            }

            return 0;
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