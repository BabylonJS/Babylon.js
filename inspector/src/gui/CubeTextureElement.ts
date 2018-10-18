import { Color4, CubeTexture, Engine, Mesh, Scene, StandardMaterial, Texture } from "babylonjs";
import { Helpers } from "../helpers/Helpers";
import { BasicElement } from "./BasicElement";

/**
* Display a very small div. A new canvas is created, with a new js scene, containing only the
* cube texture in a cube
*/
export class CubeTextureElement extends BasicElement {

    /** The big div displaying the full image */
    private _textureDiv: HTMLElement;

    private _engine: Engine;
    protected _scene: Scene;
    protected _cube: Mesh;
    private _canvas: HTMLCanvasElement;
    protected _textureUrl: string;

    // On pause the engine will not render anything
    private _pause: boolean = false;

    /** The texture given as a parameter should be cube. */
    constructor(tex: Texture) {
        super();
        this._div.className = 'fa fa-search texture-element';

        // Create the texture viewer
        this._textureDiv = Helpers.CreateDiv('texture-viewer', this._div);
        // canvas
        this._canvas = Helpers.CreateElement('canvas', 'texture-viewer-img', this._textureDiv) as HTMLCanvasElement;

        if (tex) {
            this._textureUrl = tex.name;
        }

        this._div.addEventListener('mouseover', this._showViewer.bind(this, 'flex'));
        this._div.addEventListener('mouseout', this._showViewer.bind(this, 'none'));

    }

    public update(tex?: Texture) {
        if (tex && tex.url === this._textureUrl) {
            // Nothing to do, as the old texture is the same as the old one
        } else {
            if (tex) {
                this._textureUrl = tex.name;
            }
            if (this._engine) {
                // Dispose old material and cube
                if (this._cube.material) {
                    this._cube.material.dispose(true, true);
                }
                this._cube.dispose();
            } else {
                this._initEngine();
            }
            // and create it again
            this._populateScene();
        }
    }

    /** Creates the box  */
    protected _populateScene() {
        // Create the hdr texture
        let hdrTexture = new CubeTexture(this._textureUrl, this._scene);
        hdrTexture.coordinatesMode = Texture.SKYBOX_MODE;

        this._cube = Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
        let hdrSkyboxMaterial = new StandardMaterial("skyBox", this._scene);
        hdrSkyboxMaterial.backFaceCulling = false;
        hdrSkyboxMaterial.reflectionTexture = hdrTexture;
        hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        hdrSkyboxMaterial.disableLighting = true;
        this._cube.material = hdrSkyboxMaterial;
        this._cube.registerBeforeRender(() => {
            this._cube.rotation.y += 0.01;
        });
    }

    /** Init the babylon engine */
    private _initEngine() {
        this._engine = new Engine(this._canvas);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0, 0, 0, 0);

        this._engine.runRenderLoop(() => {
            if (!this._pause) {
                this._scene.render();
            }
        });

        this._canvas.setAttribute('width', '110');
        this._canvas.setAttribute('height', '110');
    }

    private _showViewer(mode: string) {
        // If displaying...
        if (mode != 'none') {
            // ... and the canvas is not initialized
            if (!this._engine) {
                this._initEngine();
                this._populateScene();
            }
            // In every cases, unpause the engine
            this._pause = false;
        } else {
            // hide : pause the engine
            this._pause = true;
        }
        this._textureDiv.style.display = mode;
    }

    /** Removes properly the babylon engine */
    public dispose() {
        if (this._engine) {
            this._engine.dispose();
            (<any>this._engine) = null;
        }
    }
}
