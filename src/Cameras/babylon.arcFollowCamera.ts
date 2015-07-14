module BABYLON {
    export class ArcFollowCamera extends TargetCamera {

        private _radPerDeg:number = Math.PI / 180;
        private _cartesianCoordinates:Vector3 = Vector3.Zero();

        constructor(name:string, public alpha:number, public beta:number, public radius:number, public target:AbstractMesh, scene:Scene) {
            super(name, Vector3.Zero(), scene);
            this.follow();
        }

        private _degToRad(deg) {
            return deg * this._radPerDeg;
        }

        private follow():void {
            this._cartesianCoordinates.x = this.radius * Math.cos(this._degToRad(this.alpha)) * Math.cos(this._degToRad(this.beta));
            this._cartesianCoordinates.y = this.radius * Math.sin(this._degToRad(this.beta));
            this._cartesianCoordinates.z = this.radius * Math.sin(this._degToRad(this.alpha)) * Math.cos(this._degToRad(this.beta));

            this.position = this.target.position.add(this._cartesianCoordinates);
            this.setTarget(this.target.position);
        }

        public _checkInputs():void {
            super._checkInputs();
            this.follow();
        }
    }
}
