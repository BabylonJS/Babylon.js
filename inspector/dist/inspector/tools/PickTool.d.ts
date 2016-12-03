declare module INSPECTOR {
    class PickTool extends AbstractTool {
        private _isActive;
        private _pickHandler;
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
        /** Deactivate this tool */
        private _deactivate();
        /** Pick a mesh in the scene */
        private _pickMesh(evt);
        private _updatePointerPosition(evt);
    }
}
