import { Effect } from "../Materials/effect";
import { VertexBuffer } from "../Meshes/buffer";
import { Scene } from "../scene";

export class RadiosityEffectsManager {
	public useHemicube: boolean;
	public useDepthCompare: boolean;
	public uV2Effect: Effect;
	public radiosityEffect: Effect;
	public shootEffect: Effect;
	public nextShooterEffect: Effect;
	public dilateEffect: Effect;

	private _vertexBuffer: VertexBuffer;
	private _indexBuffer: WebGLBuffer;

	private _scene: Scene;

	constructor(scene: Scene, useHemicube: boolean, useDepthCompare: boolean) {
		this._scene = scene;
		this.useHemicube = useHemicube;
		this.useDepthCompare = useDepthCompare;

		this._prepareBuffers();
		this.createEffects();
	}

	public get screenQuadVB(): VertexBuffer {
		return this._vertexBuffer;
	}

	public get screenQuadIB(): WebGLBuffer {
		return this._indexBuffer;
	}

	public createEffects(): Promise<void> {

		return new Promise((resolve, reject) => {
			let interval = setInterval(() => {
				let readyStates = [
					this.isNextShooterEffectReady(),
					this.isRadiosityDataEffectReady(),
					this.isShootEffectReady(),
					this.isUV2EffectReady(),
					this.isDilateEffectReady()
				];

				for (let i = 0; i < readyStates.length; i++) {
					if (!readyStates[i]) {
						return;
					}
				}

				clearInterval(interval);
				resolve();
			}, 200)
		});
	}

	public isReady(): boolean {
		return 	this.isNextShooterEffectReady() &&
				this.isRadiosityDataEffectReady() &&
				this.isShootEffectReady() &&
				this.isUV2EffectReady() &&
				this.isDilateEffectReady();
	}

	private _prepareBuffers(): void {
		if (this._vertexBuffer) {
			return;
		}

		// VBO
		var vertices = [];
		vertices.push(1, 1);
		vertices.push(-1, 1);
		vertices.push(-1, -1);
		vertices.push(1, -1);

		this._vertexBuffer = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

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


	/**
	 * Creates the patch rendering effect and checks if the effect is ready.
	 * @param subMesh The submesh to be used to render the depth map of
	 * @param useInstances If multiple world instances should be used
	 * @returns if the depth renderer is ready to render the depth map
	 */
	public isUV2EffectReady(): boolean {
		let attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];
		let uniforms = ["world", "mBones", "nearFar"];
		let defines = [];
		uniforms.push("view");
		if (this.useHemicube) {
			uniforms.push("projection");
			defines.push("#define HEMICUBE");
		}

		if (this.useDepthCompare) {
			defines.push("#define DEPTH_COMPARE");
		}

		// Get correct effect
		var join = defines.join("\n");

		this.uV2Effect = this._scene.getEngine().createEffect("uv2mat",
			attribs,
			uniforms,
			["diffuseSampler", "itemBuffer"], join);

		return this.uV2Effect.isReady();
	}

	public isShootEffectReady(): boolean {
		var attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];
		var uniforms = ["view", "shootPos", "shootNormal", "shootEnergy", "shootDArea", "nearFar", "gatheringScale"]; // ["world", "mBones", "view", "nearFar"]
		var samplers = ["itemBuffer", "worldPosBuffer", "worldNormalBuffer", "idBuffer", "residualBuffer", "gatheringBuffer"];
		var defines = [];
		if (this.useDepthCompare) {
			defines.push("#define DEPTH_COMPARE");
		}
		if (this.useHemicube) {
			defines.push("#define HEMICUBE");
		}

		this.shootEffect = this._scene.getEngine().createEffect("radiosity",
			attribs,
			uniforms,
			samplers,
			defines.join("\n"));

		return this.shootEffect.isReady();
	}

	public isRadiosityDataEffectReady(): boolean {
		var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind, VertexBuffer.UV2Kind];

		this.radiosityEffect = this._scene.getEngine().createEffect("buildRadiosity",
			attribs,
			["world", "texSize", "worldTexelRatio", "patchOffset", "color", "lightStrength"],
			[]);


		return this.radiosityEffect.isReady();
	}

	public isNextShooterEffectReady(): boolean {
		this.nextShooterEffect = this._scene.getEngine().createEffect("nextShooter",
			[VertexBuffer.PositionKind],
			["lod", "area", "polygonId"],
			["unshotRadiositySampler"], "");

		return this.nextShooterEffect.isReady();
	}

	public isDilateEffectReady(): boolean {
		this.dilateEffect = this._scene.getEngine().createEffect("dilate",
			[VertexBuffer.PositionKind],
			["offset", "texelSize"],
			["inputTexture"], "");

		return this.dilateEffect.isReady();
	}
}