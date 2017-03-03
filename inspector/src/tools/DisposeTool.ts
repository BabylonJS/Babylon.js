module INSPECTOR {
     
    /**
     * Removes the inspector panel
     */
    export class DisposeTool extends AbstractTool {

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-times', parent, inspector, 'Close the inspector panel');
        }

        // Action : refresh the whole panel
        public action() {
            this._inspector.dispose();
        }
    }
}