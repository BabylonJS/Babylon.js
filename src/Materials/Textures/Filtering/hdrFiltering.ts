import { Vector3, Color4 } from "../../../Maths/math";
import { Nullable } from "../../../types";
import { InternalTexture } from "../internalTexture"
import { RenderTargetTexture } from "../renderTargetTexture"
import { HDRCubeTexture } from "../hdrCubeTexture"
import { CubeTexture } from "../cubeTexture"
import { Scene } from "../../../scene";
import { Engine } from "../../../Engines/engine";
import { Effect } from "../../../Materials/effect";
import { Material } from "../../../Materials/material";
import { DataBuffer } from "../../../Meshes/DataBuffer"
import { VertexBuffer } from "../../../Meshes/Buffer"

import "../../../Shaders/hdrFiltering.vertex";
import "../../../Shaders/hdrFiltering.fragment";
/**
 * Filters HDR maps to get correct  renderings of PBR reflections
 */
export class HDRFiltering {

	private _scene: Scene;
	private _engine: Engine;
	private _effect: Effect;

	private _numSamples: number = 128;

	constructor(scene: Scene) {
		// pass
		this._scene = scene;
		this._engine = scene.getEngine();

		this.createEffect();
		this._prepareBuffers();
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
	        // result.push(a2  / (d * d));
	    }

	    return result;
	}

	/**
	 * Get a value indicating if the post-process is ready to be used
	 * @returns true if the post-process is ready (shader is compiled)
	 */
	public isReady(texture: CubeTexture | HDRCubeTexture) {
		return (texture.isReady() && this._effect.isReady())
	}

	// Todo merge hdrCubeTexture with CubeTexture
	public prefilter(texture: CubeTexture | HDRCubeTexture, onFinished?: () => void) {
		return new Promise((resolve) => {
			const callback = () => {
				if (this.isReady(texture)) {
					this._prefilter(texture);
					resolve();
					if (onFinished) {
						onFinished();
					}
					this._scene.unregisterAfterRender(callback);
				}
			};
			// Is dependence of renderloop really necessary ? maybe setInterval is more suited
			this._scene.registerAfterRender(callback);
		})
	}

	private _prefilter(texture: CubeTexture | HDRCubeTexture) : CubeTexture | HDRCubeTexture {
		// const nbRoughnessStops = 2;
		const maxLodLevel = Math.round(Math.log(texture.getSize().width) / Math.log(2));
		const samples = this._numSamples;
		const tempTexture = new RenderTargetTexture("temp", texture.getSize(), this._scene, true, true, undefined, true, undefined, false);

		for (let i = 0; i < maxLodLevel + 1; i++) {
			const roughness = i / maxLodLevel;
			const kernel = HDRFiltering.generateSamples(samples, roughness);
			const weights = HDRFiltering.generateWeights(kernel, roughness);

			this.filter(texture, tempTexture, kernel, weights, i);
		}

		texture._texture!._webGLTexture = tempTexture._texture!._webGLTexture;
		return texture;
	}

	public filter(texture: CubeTexture | HDRCubeTexture, outputTexture: RenderTargetTexture, kernel: Vector3[], weights: number[], lodLevel: number = 0) : Nullable<RenderTargetTexture> {
		if (!texture.isReady()) {
			return null;
		}

		const directions = [
			[new Vector3(0, 0, -1), new Vector3(0, -1, 0), new Vector3(1, 0, 0)], // PositiveX
			[new Vector3(0, 0, 1), new Vector3(0, -1, 0), new Vector3(-1, 0, 0)], // NegativeX
			[new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 0)], // PositiveY
			[new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, -1, 0)], // NegativeY
			[new Vector3(1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, 1)], // PositiveZ
			[new Vector3(-1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, -1)], // NegativeZ
		];

		for (let i = 0; i < 6 ; i++) {
			this.apply(texture, kernel, weights);
			this._effect.setVector3("up", directions[i][0]);
			this._effect.setVector3("right", directions[i][1]);
			this._effect.setVector3("front", directions[i][2]);
			this.directRender(outputTexture._texture!, i, lodLevel);
		}

		return outputTexture;
	}

	public static flatten(arr: Vector3[]) : number[] {
		const result = [];

		for (let i = 0; i < arr.length; i++) {
			result.push(arr[i].x, arr[i].y, arr[i].z);
		}

		return result;
	}

	/**
	 * Binds all textures and uniforms to the shader, this will be run on every pass.
	 * @returns the effect corresponding to this post process. Null if not compiled or not ready.
	 */
	public apply(texture: CubeTexture | HDRCubeTexture, kernel: Vector3[], weights: number[]) {
	    // Check
	    if (!this._effect || !this._effect.isReady()) {
	        return null;
	    }

	    // States
	    this._engine.enableEffect(this._effect);
	    this._engine.setState(false);
	    this._engine.setDepthBuffer(false);
	    this._engine.setDepthWrite(false);

	    this._effect.setTexture("inputTexture", texture);

	    // Parameters
	    this._effect.setArray3("sampleDirections", HDRFiltering.flatten(kernel));
	    this._effect.setArray("weights", weights);
	    this._effect.setFloat("cubeWidth", texture.getSize().width);
	    this._effect.setFloat2("scale", 1, 1);
	    return this._effect;
	}

	/**
	 * Updates the effect with the current post process compile time values and recompiles the shader.
	 * @param defines Define statements that should be added at the beginning of the shader. (default: null)
	 * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
	 * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
	 * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
	 * @param onCompiled Called when the shader has been compiled.
	 * @param onError Called if there is an error when compiling a shader.
	 */
	public createEffect() {
		const defines = "#define NUM_SAMPLES " + this._numSamples;
	    this._effect = this._engine.createEffect({ vertex: "hdrFiltering", fragment: "hdrFiltering" },
	        ["position"],
	        ["sampleDirections", "weights", "up", "right", "front", "cubeWidth"],
	        ["inputTexture"],
	        defines
	    );
	}

   /**
     * Manually render a set of post processes to a texture.
     * @param targetTexture The target texture to render to.
     * @param faceIndex defines the face to render to if a cubemap is defined as the target
     * @param lodLevel defines which lod of the texture to render to
     */
    public directRender(targetTexture: InternalTexture, faceIndex = 0, lodLevel = 0): void {
        var engine = this._engine;
        engine._currentRenderTarget = null;
        engine.bindFramebuffer(targetTexture, faceIndex, undefined, undefined, true, lodLevel);
        engine.clear(new Color4(0.0, 0.0, 0.0, 0.0), true, true);
        // VBOs
        this._prepareBuffers();
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._effect);
        engine.drawElementsType(Material.TriangleFillMode, 0, 6);

        engine.restoreDefaultFramebuffer();
        // Restore depth buffer
	    engine.setState(true);
        engine.setDepthBuffer(true);
        engine.setDepthWrite(true);
    }

    private _indexBuffer: DataBuffer;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};

    /**
     * Creates a new instance PostProcess
     * @param scene The scene that the post process is associated with.
     */
    private _prepareBuffers(): void {
        if (this._vertexBuffers[VertexBuffer.PositionKind]) {
            return;
        }

        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

        this._buildIndexBuffer();
    }

    private _buildIndexBuffer(): void {
        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
    }

    public dispose() {
    	this._vertexBuffers[VertexBuffer.PositionKind].dispose();
    	this._effect.dispose();
    }

}