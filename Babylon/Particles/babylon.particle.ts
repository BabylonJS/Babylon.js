module BABYLON {
    export class Particle {
        public position = BABYLON.Vector3.Zero();
        public direction = BABYLON.Vector3.Zero();
        public color = new BABYLON.Color4(0, 0, 0, 0);
        public colorStep = new BABYLON.Color4(0, 0, 0, 0);
        public lifeTime = 1.0;
        public age = 0;
        public size = 0;
        public angle = 0;
        public angularSpeed = 0;
    }
} 