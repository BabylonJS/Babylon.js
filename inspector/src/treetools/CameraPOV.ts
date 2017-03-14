module INSPECTOR {

    export interface ICameraPOV {
        setPOV: () => void
    }

    /**
     * 
     */
    export class CameraPOV extends AbstractTreeTool {
        private cameraPOV: ICameraPOV;

        constructor(camera: ICameraPOV) {
            super();
            this.cameraPOV = camera;
            this._elem.classList.add('fa-video-camera');
        }

        protected action() {
            super.action();
            this._gotoPOV();
        }

        private _gotoPOV() {

            let actives = Inspector.DOCUMENT.querySelectorAll(".fa-video-camera.active");
            console.log(actives);
            for (let i = 0; i < actives.length; i++) {
                actives[i].classList.remove('active');
            }
            //if (this._on) {
                // set icon camera
                this._elem.classList.add('active');
            //}
            this.cameraPOV.setPOV();

        }
    }
}