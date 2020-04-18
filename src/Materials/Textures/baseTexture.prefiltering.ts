import { BaseTexture } from "./baseTexture";
import { HDRFiltering } from "./Filtering/hdrFiltering";
import { Constants } from "../../Engines/constants";
import { Vector3 } from "../../Maths/math";

declare module "./baseTexture" {
    export interface BaseTexture {
        /**
         * Only turn this on for dynamic HDR textures (real-time probes)
         */
        realTimeFiltering: boolean;
        _realTimeFiltering: boolean;
        numSamples: number;
        _numSamples: number;
        _sampleDirections: number[];
        _sampleDirectionV3: Vector3[]; // debug, remove
        _sampleWeights: number[];
        generateFilterSamples(roughness: number) : void;
    }
}

BaseTexture.prototype._realTimeFiltering = false;
BaseTexture.prototype._numSamples = 16;

Object.defineProperty(BaseTexture.prototype, "numSamples", {
    get: function(this: BaseTexture) {
    	return this._numSamples;
    },
    set: function(this: BaseTexture, value: number) {
    	let scene = this.getScene();
    	this._numSamples = value;
    	if (!scene) {
    		return;
    	}
    	scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
    	    return mat.hasTexture(this);
    	});

    },
    enumerable: true,
    configurable: true
});

Object.defineProperty(BaseTexture.prototype, "realTimeFiltering", {
    get: function(this: BaseTexture) {
    	return this._realTimeFiltering;
    },
    set: function(this: BaseTexture, value: boolean) {
    	let scene = this.getScene();
    	this._realTimeFiltering = value;
    	if (!scene) {
    		return;
    	}
    	scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
    	    return mat.hasTexture(this);
    	});

    },
    enumerable: true,
    configurable: true
});

BaseTexture.prototype.generateFilterSamples = function(roughness) {
	const sampleDirections = HDRFiltering.generateSamples(this._numSamples, roughness);
	this._sampleDirectionV3 = sampleDirections;
	this._sampleWeights = HDRFiltering.generateWeights(sampleDirections, roughness);
	this._sampleDirections = [];

	for (let i = 0; i < sampleDirections.length; i++) {
		this._sampleDirections.push(sampleDirections[i].x, sampleDirections[i].y, sampleDirections[i].z);
	}
}