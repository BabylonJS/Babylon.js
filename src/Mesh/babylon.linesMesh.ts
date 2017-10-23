/// <reference path="babylon.mesh.ts" />

module BABYLON {
    export class LinesMesh extends Mesh {
        public color = new Color3(1, 1, 1);
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
         * @param value the new threshold to apply
         */
        public set intersectionThreshold(value: number) {
            if (this._intersectionThreshold === value) {
                return;
            }

            this._intersectionThreshold = value;
            if (this.geometry) {
                this.geometry.boundingBias = new Vector2(0, value);
            }
        }

        private _intersectionThreshold: number;
        private _colorShader: ShaderMaterial;

        constructor(name: string, scene: Scene, parent: Nullable<Node> = null, source?: LinesMesh, doNotCloneChildren?: boolean, public useVertexColor? : boolean) {
            super(name, scene, parent, source, doNotCloneChildren);

            if (source) {
                this.color = source.color.clone();
                this.alpha = source.alpha;
                this.useVertexColor = source.useVertexColor;
            }

            this._intersectionThreshold = 0.1;
            
            var options = {
                attributes: [VertexBuffer.PositionKind],
                uniforms: ["world", "viewProjection"],
                needAlphaBlending: false,
            };
            
            if (!useVertexColor) {
                options.uniforms.push("color");
                options.needAlphaBlending = true;
            }

            this._colorShader = new ShaderMaterial("colorShader", scene, "color", options);
        }

        /**
         * Returns the string "LineMesh"  
         */
        public getClassName(): string {
            return "LinesMesh";
        }      

        public get material(): Material {
            return this._colorShader;
        }

        public get checkCollisions(): boolean {
            return false;
        }

        public createInstance(name: string): InstancedMesh {
            throw new Error("LinesMeshes do not support createInstance.");
        }

        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): LinesMesh {
            if (!this._geometry) {
                return this;
            }
            // VBOs
            this._geometry._bind(this._colorShader.getEffect() );

            // Color
            if (!this.useVertexColor) {
                this._colorShader.setColor4("color", this.color.toColor4(this.alpha));
            }
            return this;
        }

        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): LinesMesh {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return this;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            engine.draw(false, subMesh.indexStart, subMesh.indexCount);
            return this;
        }

        public dispose(doNotRecurse?: boolean): void {
            this._colorShader.dispose();

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