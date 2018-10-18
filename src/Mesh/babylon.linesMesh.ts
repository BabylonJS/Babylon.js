module BABYLON {
    /**
     * Line mesh
     * @see https://doc.babylonjs.com/babylon101/parametric_shapes
     */
    export class LinesMesh extends Mesh {
        /**
         * Color of the line (Default: White)
         */
        public color = new Color3(1, 1, 1);
        /**
         * Alpha of the line (Default: 1)
         */
        public alpha = 1;

        /**
         * The intersection Threshold is the margin applied when intersection a segment of the LinesMesh with a Ray.
         * This margin is expressed in world space coordinates, so its value may vary.
         * Default value is 0.1
         * @returns the intersection Threshold value.
         */
        public get intersectionThreshold(): number {
            return this._intersectionThreshold;
        }

        /**
         * The intersection Threshold is the margin applied when intersection a segment of the LinesMesh with a Ray.
         * This margin is expressed in world space coordinates, so its value may vary.
         */
        public set intersectionThreshold(value: number) {
            if (this._intersectionThreshold === value) {
                return;
            }
            this._intersectionThreshold = value;
        }

        private _intersectionThreshold: number;
        private _colorShader: ShaderMaterial;

        /**
         * Creates a new LinesMesh
         * @param name defines the name
         * @param scene defines the hosting scene
         * @param parent defines the parent mesh if any
         * @param source defines the optional source LinesMesh used to clone data from
         * @param doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
         * When false, achieved by calling a clone(), also passing False.
         * This will make creation of children, recursive.
         * @param useVertexColor defines if this LinesMesh supports vertex color
         * @param useVertexAlpha defines if this LinesMesh supports vertex alpha
         */
        constructor(
            name: string,
            scene: Nullable<Scene> = null,
            parent: Nullable<Node> = null,
            source?: LinesMesh,
            doNotCloneChildren?: boolean,
            /**
             * If vertex color should be applied to the mesh
             */
            public useVertexColor?: boolean,
            /**
             * If vertex alpha should be applied to the mesh
             */
            public useVertexAlpha?: boolean
        ) {
            super(name, scene, parent, source, doNotCloneChildren);

            if (source) {
                this.color = source.color.clone();
                this.alpha = source.alpha;
                this.useVertexColor = source.useVertexColor;
                this.useVertexAlpha = source.useVertexAlpha;
            }

            this._intersectionThreshold = 0.1;

            var defines: string[] = [];
            var options = {
                attributes: [VertexBuffer.PositionKind, "world0", "world1", "world2", "world3"],
                uniforms: ["world", "viewProjection"],
                needAlphaBlending: true,
                defines: defines
            };

            if (useVertexAlpha === false) {
                options.needAlphaBlending = false;
            }

            if (!useVertexColor) {
                options.uniforms.push("color");
            }
            else {
                options.defines.push("#define VERTEXCOLOR");
                options.attributes.push(VertexBuffer.ColorKind);
            }

            this._colorShader = new ShaderMaterial("colorShader", this.getScene(), "color", options);
        }

        /**
         * Returns the string "LineMesh"
         */
        public getClassName(): string {
            return "LinesMesh";
        }

        /**
         * @hidden
         */
        public get material(): Material {
            return this._colorShader;
        }

        /**
         * @hidden
         */
        public set material(value: Material) {
            // Do nothing
        }

        /**
         * @hidden
         */
        public get checkCollisions(): boolean {
            return false;
        }

        /** @hidden */
        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): LinesMesh {
            if (!this._geometry) {
                return this;
            }
            // VBOs
            this._geometry._bind(this._colorShader.getEffect());

            // Color
            if (!this.useVertexColor) {
                this._colorShader.setColor4("color", this.color.toColor4(this.alpha));
            }
            return this;
        }

        /** @hidden */
        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): LinesMesh {
            if (!this._geometry || !this._geometry.getVertexBuffers() || (!this._unIndexed && !this._geometry.getIndexBuffer())) {
                return this;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            engine.drawElementsType(Material.LineListDrawMode, subMesh.indexStart, subMesh.indexCount, instancesCount);
            return this;
        }

        /**
         * Disposes of the line mesh
         * @param doNotRecurse If children should be disposed
         */
        public dispose(doNotRecurse?: boolean): void {
            this._colorShader.dispose(false, false, true);
            super.dispose(doNotRecurse);
        }

        /**
         * Returns a new LineMesh object cloned from the current one.
         */
        public clone(name: string, newParent?: Node, doNotCloneChildren?: boolean): LinesMesh {
            return new LinesMesh(name, this.getScene(), newParent, this, doNotCloneChildren);
        }
    }
}