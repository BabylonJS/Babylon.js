module BABYLON {
	export class VRDeviceOrientationCamera extends BABYLON.OculusCamera {
		public _alpha = 0;
		public _beta = 0;
		public _gamma = 0;
	
		constructor(name: string, position: Vector3, scene: Scene) {
			super(name, position, scene);
		}

        public _onOrientationEvent(evt: DeviceOrientationEvent): void {
            this._alpha = +evt.alpha|0;
            this._beta = +evt.beta|0;
            this._gamma = +evt.gamma|0;

            if (this._gamma < 0) {
            	this._gamma = 90 + this._gamma;
            }
            else {
				// Incline it in the correct angle.
            	this._gamma = 270 - this._gamma;
            }

            this.rotation.x = this._gamma / 180.0 * Math.PI;   
			this.rotation.y = -this._alpha / 180.0 * Math.PI;	
			this.rotation.z	= this._beta / 180.0 * Math.PI;		
        }
	}
}