declare module BABYLON {
    class SpriteManager {
        public name: string;
        public cellSize: number;
        public sprites: Sprite[];
        public renderingGroupId: number;
        public onDispose: () => void;
        public fogEnabled: boolean;
        private _capacity;
        private _spriteTexture;
        private _epsilon;
        private _scene;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        private _indexBuffer;
        private _vertices;
        private _effectBase;
        private _effectFog;
        constructor(name: string, imgUrl: string, capacity: number, cellSize: number, scene: Scene, epsilon?: number);
        private _appendSpriteVertex(index, sprite, offsetX, offsetY, rowSize);
        public render(): void;
        public dispose(): void;
    }
}
