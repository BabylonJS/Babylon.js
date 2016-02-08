/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {

    export class SphericalHarmonics {
        public L00: Vector3 = Vector3.Zero();
        public L1_1: Vector3 = Vector3.Zero();
        public L10: Vector3 = Vector3.Zero();
        public L11: Vector3 = Vector3.Zero();
        public L2_2: Vector3 = Vector3.Zero();
        public L2_1: Vector3 = Vector3.Zero();
        public L20: Vector3 = Vector3.Zero();
        public L21: Vector3 = Vector3.Zero();
        public L22: Vector3 = Vector3.Zero();

        public addLight(direction: Vector3, color: Color3, deltaSolidAngle: number) : void
        {
            var colorVector = new Vector3(color.r, color.g, color.b);
            var c = colorVector.scale(deltaSolidAngle);

            this.L00 = this.L00.add(c.scale(0.282095));

            this.L1_1 = this.L1_1.add(c.scale(0.488603 * direction.y));
            this.L10 = this.L10.add(c.scale(0.488603 * direction.z));
            this.L11 = this.L11.add(c.scale(0.488603 * direction.x));

            this.L2_2 = this.L2_2.add(c.scale(1.092548  * direction.x * direction.y));
            this.L2_1 = this.L2_1.add(c.scale(1.092548 * direction.y * direction.z));
            this.L21 = this.L21.add(c.scale(1.092548 * direction.x * direction.z));

            this.L20 = this.L20.add(c.scale(0.315392 * (3.0 * direction.z * direction.z - 1.0)));
            this.L22 = this.L22.add(c.scale(0.546274 * (direction.x * direction.x - direction.y * direction.y)));
        }

        public scale(scale: number): void
        {
            this.L00 = this.L00.scale(scale);
            this.L1_1 = this.L1_1.scale(scale);
            this.L10 = this.L10.scale(scale);
            this.L11 = this.L11.scale(scale);
            this.L2_2 = this.L2_2.scale(scale);
            this.L2_1 = this.L2_1.scale(scale);
            this.L20 = this.L20.scale(scale);
            this.L21 = this.L21.scale(scale);
            this.L22 = this.L22.scale(scale);
        }
    }
}