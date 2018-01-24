﻿module BABYLON {
    export class FresnelParameters {
        private _isEnabled = true;
        public get isEnabled(): boolean {
            return this._isEnabled;
        }
        public set isEnabled(value: boolean) {
            if (this._isEnabled === value) {
                return;
            }

            this._isEnabled = value;
            Engine.MarkAllMaterialsAsDirty(Material.FresnelDirtyFlag | Material.MiscDirtyFlag);
        }   

        public leftColor = Color3.White();
        public rightColor = Color3.Black();
        public bias = 0;
        public power = 1;

        public clone(): FresnelParameters {
            var newFresnelParameters = new FresnelParameters();

            Tools.DeepCopy(this, newFresnelParameters);

            return newFresnelParameters;
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.isEnabled = this.isEnabled;
            serializationObject.leftColor = this.leftColor;
            serializationObject.rightColor = this.rightColor;
            serializationObject.bias = this.bias;
            serializationObject.power = this.power;

            return serializationObject;
        }

        public static Parse(parsedFresnelParameters: any): FresnelParameters {
            var fresnelParameters = new FresnelParameters();

            fresnelParameters.isEnabled = parsedFresnelParameters.isEnabled;
            fresnelParameters.leftColor = Color3.FromArray(parsedFresnelParameters.leftColor);
            fresnelParameters.rightColor = Color3.FromArray(parsedFresnelParameters.rightColor);
            fresnelParameters.bias = parsedFresnelParameters.bias;
            fresnelParameters.power = parsedFresnelParameters.power || 1.0;

            return fresnelParameters;
        }
    }
}