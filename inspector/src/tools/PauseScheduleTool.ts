module INSPECTOR {
     
    export class PauseScheduleTool extends AbstractTool {
        
        private _isPause : boolean = false;

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-pause', parent, inspector, 'Pause the automatic update of properties');
        }

        // Action : refresh the whole panel
        public action() {
            if (this._isPause) {
                Scheduler.getInstance().pause = false;
                this._updateIcon('fa-pause');
            } else {
                Scheduler.getInstance().pause = true;
                this._updateIcon('fa-play');
            }
            this._isPause = !this._isPause;
        }
    }
}