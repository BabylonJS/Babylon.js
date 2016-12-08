module INSPECTOR {
     
    export class RefreshTool extends AbstractTool {

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-refresh', parent, inspector, 'Refresh the current tab');
        }

        // Action : refresh the whole panel
        public action() {
            this._inspector.refresh();
        }
    }
}