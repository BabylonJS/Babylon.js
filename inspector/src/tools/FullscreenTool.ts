module INSPECTOR {
     
    export class FullscreenTool extends AbstractTool {

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-expand', parent, inspector, 'Open the scene in fullscreen, press Esc to exit');
        }

        // Action : refresh the whole panel
        public action() {

            var elem = document.body;

            function requestFullScreen(element:HTMLElement) {
                // Supports most browsers and their versions.
                var requestMethod = element.requestFullscreen || element.webkitRequestFullScreen;
                requestMethod.call(element);
            }
           
            requestFullScreen(elem);
        }
    }
}