declare module BABYLON {
    class Layer {
        public name: string;
        public texture: Texture;
        public isBackground: boolean;
        public color: Color4;
        public onDispose: () => void;
        private _scene;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        private _indexBuffer;
        private _effect;
        constructor(name: string, imgUrl: string, scene: Scene, isBackground?: boolean, color?: Color4);
        public render(): void;
        public dispose(): void;
    }
}
