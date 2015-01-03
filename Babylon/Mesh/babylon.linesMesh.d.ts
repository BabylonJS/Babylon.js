declare module BABYLON {
    class LinesMesh extends Mesh {
        public color: Color3;
        public alpha: number;
        private _colorShader;
        private _ib;
        private _indicesLength;
        private _indices;
        constructor(name: string, scene: Scene, updatable?: boolean);
        public material : Material;
        public isPickable : boolean;
        public checkCollisions : boolean;
        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): void;
        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): void;
        public intersects(ray: Ray, fastCheck?: boolean): any;
        public dispose(doNotRecurse?: boolean): void;
    }
}
