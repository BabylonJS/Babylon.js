import { PBRBaseMaterial } from "./pbrBaseMaterial";
import { HDRFiltering } from "../Textures/Filtering/hdrFiltering";
import { Constants } from "../../Engines/constants";
import { Vector3 } from "../../Maths/math";

/**
 * Allows for realtime filtering of reflection texture
 * Only turn this on for material having dynamic HDR textures (real-time probes)
 * and keep the sample count very low.
 * Baking with HDRFiltering.ts is a way better solution performance-wise
 */
export class EnvironmentRealtimeFiltering {
        private _material: PBRBaseMaterial;
        private _cachedRoughness: number = 0;

        constructor(material: PBRBaseMaterial) {
        	this._material = material;
        }
        private _enabled: boolean = false;
        /**
         * Enables realtime filtering on the material.
         */
        public get enabled() {
        	return this._enabled;
        }
        public set enabled(b: boolean) {
        	this._enabled = b;
        	this._material.markAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }

        private _numSamples: number = 16;
        /**
         * Number of samples used to evaluate BRDF on the texture.
         */
        public get numSamples() {
        	return this._numSamples;
        }
        public set numSamples(n: number) {
        	this._numSamples = n;
        	this._material.markAsDirty(Constants.MATERIAL_TextureDirtyFlag);

        	if (this.sampleDirections) {
        		this.sampleDirections.length = 0;
        	}
        }

        /**
         * Sample directions around a z-orientated normal
         */
        public sampleDirections: number[];
        public sampleDirectionV3: Vector3[]; // debug, remove
        /**
         * Sample weights of the probability density function
         */
        public sampleWeights: number[];

        /**
         * Generates the samples for a roughness value.
         */
        public generateFilterSamples(roughness: number) {
        	if (this.enabled && (!this.sampleDirections || !this.sampleDirections.length || roughness != this._cachedRoughness)) {
				const sampleDirections = HDRFiltering.generateSamples(this._numSamples, roughness);
				this.sampleDirectionV3 = sampleDirections;
				this.sampleWeights = HDRFiltering.generateWeights(sampleDirections, roughness);
				this.sampleDirections = HDRFiltering.flatten(sampleDirections);
        		this._cachedRoughness = roughness;
        	}
		}
}