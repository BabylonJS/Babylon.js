declare module INSPECTOR {
    class PauseScheduleTool extends AbstractTool {
        private _isPause;
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
