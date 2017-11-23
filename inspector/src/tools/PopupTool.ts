module INSPECTOR {
     
    export class PopupTool extends AbstractTool {

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-external-link', parent, inspector, 'Open the inspector in a popup');
        }

        // Action : refresh the whole panel
        public action() {
            this._inspector.openPopup();
        }
    }
}