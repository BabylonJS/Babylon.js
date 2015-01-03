declare module BABYLON {
    class FilesInput {
        private engine;
        private currentScene;
        private canvas;
        private sceneLoadedCallback;
        private progressCallback;
        private additionnalRenderLoopLogicCallback;
        private textureLoadingCallback;
        private startingProcessingFilesCallback;
        private elementToMonitor;
        static FilesTextures: any[];
        static FilesToLoad: any[];
        constructor(p_engine: Engine, p_scene: Scene, p_canvas: HTMLCanvasElement, p_sceneLoadedCallback: any, p_progressCallback: any, p_additionnalRenderLoopLogicCallback: any, p_textureLoadingCallback: any, p_startingProcessingFilesCallback: any);
        public monitorElementForDragNDrop(p_elementToMonitor: HTMLElement): void;
        private renderFunction();
        private drag(e);
        private drop(eventDrop);
        private loadFiles(event);
    }
}
