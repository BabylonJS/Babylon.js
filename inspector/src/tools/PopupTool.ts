module INSPECTOR {
     
    export class PopupTool extends AbstractTool {

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-external-link', parent, inspector, 'Creates the inspector in an external popup');
        }

        // Action : refresh the whole panel
        public action() {
            this._inspector.openPopup();
        }
    }
}