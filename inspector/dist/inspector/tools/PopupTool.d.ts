declare module INSPECTOR {
    class PopupTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
