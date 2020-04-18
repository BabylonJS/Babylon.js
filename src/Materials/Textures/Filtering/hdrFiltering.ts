import { Vector3 } from "../../../Maths/math";
import { InternalTexture } from "../internalTexture"
import { HDRCubeTexture } from "../hdrCubeTexture"
import { CubeTexture } from "../cubeTexture"
/**
 * Filters HDR maps to get correct  renderings of PBR reflections
 */
export class HDRFiltering {

	constructor() {
		// pass
	}

	private static _bits = new Uint32Array(1);

	private static _radicalInverse_VdC(i: number) {
	    HDRFiltering._bits[0] = i;
	    HDRFiltering._bits[0] = ((HDRFiltering._bits[0] << 16) | (HDRFiltering._bits[0] >> 16)) >>> 0;
	    HDRFiltering._bits[0] = ((HDRFiltering._bits[0] & 0x55555555) << 1) | ((HDRFiltering._bits[0] & 0xAAAAAAAA) >>> 1) >>> 0;
	    HDRFiltering._bits[0] = ((HDRFiltering._bits[0] & 0x33333333) << 2) | ((HDRFiltering._bits[0] & 0xCCCCCCCC) >>> 2) >>> 0;
	    HDRFiltering._bits[0] = ((HDRFiltering._bits[0] & 0x0F0F0F0F) << 4) | ((HDRFiltering._bits[0] & 0xF0F0F0F0) >>> 4) >>> 0;
	    HDRFiltering._bits[0] = ((HDRFiltering._bits[0] & 0x00FF00FF) << 8) | ((HDRFiltering._bits[0] & 0xFF00FF00) >>> 8) >>> 0;
	    return HDRFiltering._bits[0] * 2.3283064365386963e-10; // / 0x100000000 or / 4294967296
	}

	private static _hammersley(i: number, n: number) {
	    return [i / n, HDRFiltering._radicalInverse_VdC(i)];
	}

	private static _GGXImportanceSampling(u: number, v: number, alphaG: number) : Vector3 {
	    // https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf
	    const phi = v * 2.0 * Math.PI;
	    const theta = Math.atan(alphaG * Math.sqrt(u) / Math.sqrt(1 - u))
	    return new Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi) * Math.sin(theta), Math.cos(theta));
	}

	private static _convertRoughnessToAlphaG(roughness: number) : number {
	    return roughness * roughness + 0.0005;
	}

	public static generateSamples(numSamples: number, roughness: number): Vector3[] {
	    const result = [];
	    let vector;

	    for (let i = 0; i < numSamples; i++) {
	        const rand = HDRFiltering._hammersley(i, numSamples);
	        vector = HDRFiltering._GGXImportanceSampling(rand[0], rand[1], HDRFiltering._convertRoughnessToAlphaG(roughness));

	        result.push(vector);
	    }

	    return result;
	}

	public static generateWeights(samples: Vector3[], roughness: number): number[] {
	    // float a2 = square(alphaG);
	    // float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
	    // return a2 / (PI * d * d);
	    const result = [];
	    const alphaG = HDRFiltering._convertRoughnessToAlphaG(roughness);

	    for (let i = 0; i < samples.length; i++) {
	        const a2 = alphaG * alphaG;
	        // NdotH = samples[i].z
	        const d = samples[i].z * samples[i].z * (a2 - 1) + 1;
	        result.push(a2  / (Math.PI * d * d));
	    }

	    return result;
	}

	// Todo merge hdrCubeTexture with CubeTexture
	public static prefilter(texture: CubeTexture | HDRCubeTexture) {
		//
		const nbRoughnessStops = 10;
		const samples = 1024;
		const mipmaps: InternalTexture[] = [];

		for (let i = 0; i < nbRoughnessStops; i++) {
			const roughness = i / nbRoughnessStops;
			const kernel = HDRFiltering.generateSamples(samples, roughness);

			const filteredTexture = HDRFiltering.filter(texture, kernel);
			mipmaps.push(filteredTexture);
		}

		HDRFiltering.setMipmaps(texture, mipmaps);
	}

	public static filter(texture: CubeTexture | HDRCubeTexture, kernel: Vector3[]) : InternalTexture {
		// pass
		return null as any;
	}

	public static setMipmaps(texture: CubeTexture | HDRCubeTexture, mipmaps: InternalTexture[]) {
		// pass
	}
}