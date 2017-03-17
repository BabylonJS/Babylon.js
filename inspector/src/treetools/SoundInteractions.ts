module INSPECTOR {

    export interface ISoundInteractions {
        setPlaying: (callback: Function) => void;
    }

    /**
     * 
     */
    export class SoundInteractions extends AbstractTreeTool {
        private playSound: ISoundInteractions;
        private b: boolean;

        constructor(playSound: ISoundInteractions) {
            super();
            this.playSound = playSound;
            this.b = false;
            this._elem.classList.add('fa-play');
        }

        protected action() {
            super.action();
            this._playSound();
        }

        private _playSound() {

            if (this._elem.classList.contains('fa-play')) {
                this._elem.classList.remove('fa-play');
                this._elem.classList.add('fa-pause');
            }
            else {
                this._elem.classList.remove('fa-pause');
                this._elem.classList.add('fa-play');
            }
            this.playSound.setPlaying(() => {
                this._elem.classList.remove('fa-pause');
                this._elem.classList.add('fa-play');
            });
        }
    }
}