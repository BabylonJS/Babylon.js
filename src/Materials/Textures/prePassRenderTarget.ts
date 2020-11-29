import { MultiRenderTarget, IMultiRenderTargetOptions } from "./multiRenderTarget";
import { Engine } from "../../Engines/engine";
import { GeometryBufferRenderer } from '../../Rendering/geometryBufferRenderer';
import { PrePassRenderer } from '../../Rendering/prePassRenderer';
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Constants } from "../../Engines/constants";
import { PostProcess } from "../../PostProcesses/postProcess";
import { ImageProcessingPostProcess } from "../../PostProcesses/imageProcessingPostProcess";

/**
 * A multi render target designed to render the prepass.
 * Prepass is a scene component used to render information in multiple textures
 * alongside with the scene materials rendering.
 * Note : This is an internal class, and you should NOT need to instanciate this. 
 * Only the `PrePassRenderer` should instanciate this class.
 * It is more likely that you need a regular `MultiRenderTarget`
 */
export class PrePassRenderTarget extends MultiRenderTarget {

	/**
	 * Number of textures in the multi render target texture where the scene is directly rendered
	 */
	public mrtCount: number = 0;

	public _mrtFormats: number[] = [];
	public _mrtLayout: number[];
    public _textureIndices: number[] = [];

    public _multiRenderAttachments: number[];
    public _defaultAttachments: number[];
    public _clearAttachments: number[];

    public _beforeCompositionPostProcesses: PostProcess[] = [];
    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    private _prePassRenderer: PrePassRenderer;

	/**
	 * How many samples are used for MSAA of the scene render target
	 */
	public get samples() {
	    return this._samples;
	}

	public set samples(n: number) {
	    if (!this.imageProcessingPostProcess) {
	        this._createCompositionEffect();
	    }

	    this._samples = n;
	}

	public _engine: Engine;
	public _scene: Scene;

	public static _textureFormats = [
	    {
	        type: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_HALF_FLOAT,
	    },
	    {
	        type: Constants.PREPASS_POSITION_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_HALF_FLOAT,
	    },
	    {
	        type: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_HALF_FLOAT,
	    },
	    {
	        type: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_UNSIGNED_INT,
	    },
	    {
	        type: Constants.PREPASS_COLOR_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_HALF_FLOAT,
	    },
	    {
	        type: Constants.PREPASS_DEPTHNORMAL_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_HALF_FLOAT,
	    },
	    {
	        type: Constants.PREPASS_ALBEDO_TEXTURE_TYPE,
	        format: Constants.TEXTURETYPE_UNSIGNED_INT,
	    },
	];

	public _geometryBuffer: Nullable<GeometryBufferRenderer>;
	public _useGeometryBufferFallback = false;
	/**
	 * Uses the geometry buffer renderer as a fallback for non prepass capable effects
	 */
	public get useGeometryBufferFallback() : boolean {
	    return this._useGeometryBufferFallback;
	}

	public set useGeometryBufferFallback(value: boolean) {
	    this._useGeometryBufferFallback = value;

	    if (value) {
	        this._geometryBuffer = this._scene.enableGeometryBufferRenderer();

	        if (!this._geometryBuffer) {
	            // Not supported
	            this._useGeometryBufferFallback = false;
	            return;
	        }

	        this._geometryBuffer.renderList = [];
	        this._geometryBuffer._linkPrePassRenderer(this._prePassRenderer);
	        this._updateGeometryBufferLayout();
	    } else {
	        if (this._geometryBuffer) {
	            this._geometryBuffer._unlinkPrePassRenderer();
	        }
	        this._geometryBuffer = null;
	        this._scene.disableGeometryBufferRenderer();
	    }
	}

	/**
	 * Returns the index of a texture in the multi render target texture array.
	 * @param type Texture type
	 * @return The index
	 */
	public getIndex(type: number) : number {
	    return this._textureIndices[type];
	}

	public constructor(name: string,  prePassRenderer: PrePassRenderer, size: any, count: number, scene: Scene, options?: IMultiRenderTargetOptions | undefined) {
		super(name, size, count, scene, options);
		this._prePassRenderer = prePassRenderer;

		this._resetLayout();
		this._reinitializeAttachments();
	}

	/**
	 * Prepares this rt to rebuild attachments according to the current texture layout
	 */
	public _reinitializeAttachments() {
	    const multiRenderLayout = [];
	    const clearLayout = [false];
	    const defaultLayout = [true];

	    for (let i = 0; i < this.mrtCount; i++) {
	        multiRenderLayout.push(true);

	        if (i > 0) {
	            clearLayout.push(true);
	            defaultLayout.push(false);
	        }
	    }

	    this._multiRenderAttachments = this._engine.buildTextureLayout(multiRenderLayout);
	    this._clearAttachments = this._engine.buildTextureLayout(clearLayout);
	    this._defaultAttachments = this._engine.buildTextureLayout(defaultLayout);
	}

	public _createCompositionEffect() {
	    if (this._useGeometryBufferFallback && !this._geometryBuffer) {
	        // Initializes the link with geometry buffer
	        this.useGeometryBufferFallback = true;
	    }

	    this.imageProcessingPostProcess = new ImageProcessingPostProcess("prePassComposition", 1, null, undefined, this._engine);
	}

	public _updateGeometryBufferLayout() {
	    if (this._geometryBuffer) {
	        this._geometryBuffer._resetLayout();

	        const texturesActivated = [];

	        for (let i = 0; i < this._mrtLayout.length; i++) {
	            texturesActivated.push(false);
	        }

	        this._geometryBuffer._linkInternalTexture(this.getInternalTexture()!);

	        const matches = [
	            {
	                prePassConstant: Constants.PREPASS_DEPTHNORMAL_TEXTURE_TYPE,
	                geometryBufferConstant: GeometryBufferRenderer.DEPTHNORMAL_TEXTURE_TYPE,
	            },
	            {
	                prePassConstant: Constants.PREPASS_POSITION_TEXTURE_TYPE,
	                geometryBufferConstant: GeometryBufferRenderer.POSITION_TEXTURE_TYPE,
	            },
	            {
	                prePassConstant: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
	                geometryBufferConstant: GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE,
	            },
	            {
	                prePassConstant: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
	                geometryBufferConstant: GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE,
	            }
	        ];

	        // replace textures in the geometryBuffer RT
	        for (let i = 0; i < matches.length; i++) {
	            const index = this._mrtLayout.indexOf(matches[i].prePassConstant);
	            if (index !== -1) {
	                this._geometryBuffer._forceTextureType(matches[i].geometryBufferConstant, index);
	                texturesActivated[index] = true;
	            }
	        }

	        this._geometryBuffer._setAttachments(this._engine.buildTextureLayout(texturesActivated));
	    }
	}

	/**
	 * Checks that the size of this RT is still adapted to the desired render size.
	 */
	public _checkSize() {
	    var requiredWidth = this._engine.getRenderWidth(true);
	    var requiredHeight = this._engine.getRenderHeight(true);
	    var width = this.getRenderWidth();
	    var height = this.getRenderHeight();

	    if (width !== requiredWidth || height !== requiredHeight) {
	        this.resize({ width: requiredWidth, height: requiredHeight });

	        this._updateGeometryBufferLayout();
	    }
	}

	/**
	 * Resets the texture layout within this MRT.
	 */
	public _resetLayout() {
	    for (let i = 0 ; i < PrePassRenderTarget._textureFormats.length; i++) {
	        this._textureIndices[PrePassRenderTarget._textureFormats[i].type] = -1;
	    }

	    this._textureIndices[Constants.PREPASS_COLOR_TEXTURE_TYPE] = 0;
	    this._mrtLayout = [Constants.PREPASS_COLOR_TEXTURE_TYPE];
	    this._mrtFormats = [Constants.TEXTURETYPE_HALF_FLOAT];
	    this.mrtCount = 1;
	}

	/**
	 * Resets the post processes chains applied to this RT.
	 */
	public _resetPostProcessChain() {
	    this._beforeCompositionPostProcesses = [];
	}

	/**
	 * Diposes this render target
	 */
	public dispose() {
		super.dispose();
		if (this.imageProcessingPostProcess) {
	        this.imageProcessingPostProcess.dispose();
		}
	}
}