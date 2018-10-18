import { CubeTexture, RenderTargetTexture, Tools, Vector3 } from "babylonjs";
import { TextureAdapter } from "../adapters/TextureAdapter";
import { Helpers } from "../helpers/Helpers";
import { Inspector } from "../Inspector";
import { TreeItem } from "../tree/TreeItem";
import { Tab } from "./Tab";
import { TabBar } from "./TabBar";

import * as Split from "Split";

export class TextureTab extends Tab {

    static DDSPreview: DDSPreview;

    private _inspector: Inspector;
    /** The panel containing a list of items */
    protected _treePanel: HTMLElement;
    protected _treeItems: Array<TreeItem> = [];

    /* Panel containing the texture image */
    private _imagePanel: HTMLElement;

    constructor(tabbar: TabBar, inspector: Inspector) {
        super(tabbar, 'Textures');
        this._inspector = inspector;

        // Build the properties panel : a div that will contains the tree and the detail panel
        this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;

        // Build the treepanel
        this._treePanel = Helpers.CreateDiv('insp-tree', this._panel);

        this._imagePanel = Helpers.CreateDiv('insp-details', this._panel) as HTMLDivElement;

        Split([this._treePanel, this._imagePanel], {
            blockDrag: this._inspector.popupMode,
            direction: 'vertical'
        });

        this.update();
    }

    public dispose() {
        TextureTab.DDSPreview.dispose();
    }

    public update(_items?: Array<TreeItem>) {
        let items;
        if (_items) {
            items = _items;
        } else {
            // Rebuild the tree
            this._treeItems = this._getTree();
            items = this._treeItems;
        }
        // Clean the tree
        Helpers.CleanDiv(this._treePanel);
        Helpers.CleanDiv(this._imagePanel);

        // Sort items alphabetically
        items.sort((item1, item2) => {
            return item1.compareTo(item2);
        });

        // Display items
        for (let item of items) {
            this._treePanel.appendChild(item.toHtml());
        }
    }

    /* Overrides super */
    private _getTree(): Array<TreeItem> {
        let arr = [];

        // get all cameras from the first scene
        let instances = this._inspector.scene;
        for (let tex of instances.textures) {
            arr.push(new TreeItem(this, new TextureAdapter(tex)));
        }
        return arr;
    }

    /** Display the details of the given item */
    public displayDetails(item: TreeItem) {
        // Remove active state on all items
        this.activateNode(item);
        Helpers.CleanDiv(this._imagePanel);
        // Get the texture object
        let texture = item.adapter.object;
        let imageExtension = item.adapter.object.name.split('.').pop();
        //In case the texture is a standard image format
        if (imageExtension == "png" || imageExtension == "jpg" || imageExtension == "gif" || imageExtension == "svg") {

            let img = Helpers.CreateElement('img', 'texture-image', this._imagePanel) as HTMLImageElement;

            img.style.width = this._imagePanel.style.width;

            img.style.height = "auto";

            img.src = (<BABYLON.Texture>texture).name;

        } else if (imageExtension == "dds") {
            //In case the texture is a dds format

            if (TextureTab.DDSPreview != null && TextureTab.DDSPreview.canvas != null) {
                this._imagePanel.appendChild(<Node>TextureTab.DDSPreview.canvas);
                TextureTab.DDSPreview.insertPreview(item.adapter);
            }
            else {
                //Create a canvas to load BJS if it don't exists
                let previewCanvas = Helpers.CreateElement('canvas', '', this._imagePanel);
                previewCanvas.style.outline = "none";
                previewCanvas.style.webkitTapHighlightColor = "rgba(255,255,255,0)";
                previewCanvas.id = "babylonjs-inspector-textures-preview";

                TextureTab.DDSPreview = new DDSPreview(item.adapter);
            }
        }
        else {
            let imgs: HTMLImageElement[] = [];
            let img = Helpers.CreateElement('img', 'texture-image', this._imagePanel) as HTMLImageElement;
            imgs.push(img);
            //Create five other images elements
            for (let i = 0; i < 5; i++) {
                imgs.push(Helpers.CreateElement('img', 'texture-image', this._imagePanel) as HTMLImageElement);
            }

            if (texture instanceof RenderTargetTexture) {
                // RenderTarget textures
                let scene = this._inspector.scene;
                let engine = scene.getEngine();
                let size = texture.getSize();

                // Clone the texture
                let screenShotTexture = texture.clone();
                screenShotTexture.activeCamera = texture.activeCamera;
                screenShotTexture.onBeforeRender = texture.onBeforeRender;
                screenShotTexture.onAfterRender = texture.onAfterRender;
                screenShotTexture.onBeforeRenderObservable = texture.onBeforeRenderObservable;

                // To display the texture after rendering
                screenShotTexture.onAfterRenderObservable.add((faceIndex: number) => {
                    Tools.DumpFramebuffer(size.width, size.height, engine,
                        (data) => imgs[faceIndex].src = data);
                });

                // Render the texture
                scene.incrementRenderId();
                scene.resetCachedMaterial();
                screenShotTexture.render();
                screenShotTexture.dispose();
            } else if (texture instanceof CubeTexture) {
                // Cannot open correctly DDS File
                // Display all textures of the CubeTexture
                let pixels = <ArrayBufferView>texture.readPixels();
                let canvas = document.createElement('canvas');
                canvas.id = "MyCanvas";

                if (img.parentElement) {
                    img.parentElement.appendChild(canvas);
                }
                let ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
                let size = texture.getSize();

                let tmp = pixels.buffer.slice(0, size.height * size.width * 4);
                let u = new Uint8ClampedArray(tmp);

                let colors = new ImageData(size.width * 6, size.height);

                colors.data.set(u);
                let imgData = ctx.createImageData(size.width * 6, size.height);

                imgData.data.set(u);

                // let data = imgData.data;

                // for(let i = 0, len = size.height * size.width; i < len; i++) {
                //     data[i] = pixels[i];
                // }
                ctx.putImageData(imgData, 0, 0);
                // let i: number = 0;
                // for(let filename of (texture as CubeTexture)['_files']){
                //     imgs[i].src = filename;
                //     i++;
                // }
            }
            else if (texture['_canvas']) {
                // Dynamic texture
                let base64Image = texture['_canvas'].toDataURL("image/png");
                img.src = base64Image;
            } else if (texture.url) {
                let pixels = texture.readPixels();
                let canvas = document.createElement('canvas');
                canvas.id = "MyCanvas";

                if (img.parentElement) {
                    img.parentElement.appendChild(canvas);
                }
                let ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
                let size = texture.getSize();

                let imgData = ctx.createImageData(size.width, size.height);

                imgData.data.set(pixels);

                ctx.putImageData(imgData, 0, 0);
                // If an url is present, the texture is an image
                // img.src = texture.url;

            }

        }

    }

    /** Select an item in the tree */
    public select(item: TreeItem) {
        // Active the node
        this.activateNode(item);
        // Display its details
        this.displayDetails(item);
    }

    /** Set the given item as active in the tree */
    public activateNode(item: TreeItem) {
        if (this._treeItems) {
            for (let node of this._treeItems) {
                node.active(false);
            }
        }
        item.active(true);
    }

}

class DDSPreview {

    public canvas: HTMLCanvasElement | null;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _mat: BABYLON.StandardMaterial;
    private _tex: BABYLON.Texture;
    private _cubeTex: BABYLON.CubeTexture;
    private _mesh: BABYLON.Mesh;

    constructor(AdapterItem: TextureAdapter) {

        this.canvas = document.getElementById("babylonjs-inspector-textures-preview") as HTMLCanvasElement;
        this._engine = new BABYLON.Engine(this.canvas, true);

        this._run();
        this.insertPreview(AdapterItem);
    }

    private _run() {
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.clearColor = new BABYLON.Color4(0.1412, 0.1412, 0.1412, 1);

        let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this._scene);
        light.intensity = 1;

        this._camera = new BABYLON.ArcRotateCamera("Camera", 0, 1.57, 5, Vector3.Zero(), this._scene);
        this._scene.activeCamera = this._camera;
        this._camera.attachControl(this.canvas as HTMLCanvasElement);

        window.addEventListener("resize", () => {
            this._engine.resize();
        });

        this._scene.executeWhenReady(() => {
            this._engine.runRenderLoop(() => {
                this._scene.render();
            });
        });
    }

    public insertPreview(AdapterItem: TextureAdapter) {
        if (this._tex) { this._tex.dispose(); }
        if (this._mat) { this._mat.dispose(); }
        if (this._mesh) { this._mesh.dispose(); }

        this._mat = new BABYLON.StandardMaterial("customMat", this._scene);

        if (AdapterItem.type() == "Texture") {
            //If the dds is not a cube format render it on a plane

            var previewMeshPlane = BABYLON.Mesh.CreatePlane("previewPlane", 3, this._scene);
            previewMeshPlane.rotate(new BABYLON.Vector3(1, 0, 0), 3.14);
            previewMeshPlane.rotate(new BABYLON.Vector3(0, 1, 0), -1.57);
            this._mesh = previewMeshPlane;

            this._tex = new BABYLON.Texture(AdapterItem.object.name, this._scene);
            this._tex.invertZ = true;
            this._tex.uScale = -1;

            this._mat.diffuseTexture = this._tex;
            this._mat.emissiveTexture = this._tex;
            this._mat.specularTexture = this._tex;
            this._mat.disableLighting = true;

            previewMeshPlane.material = this._mat;

        }
        else if (AdapterItem.type() == "BaseTexture") {
            //Else if the dds is a cube format render it on a box

            var previewMeshBox = BABYLON.Mesh.CreateBox("previewBox", 3, this._scene);
            previewMeshBox.rotate(new BABYLON.Vector3(0, 1, 0), -0.5);
            this._mesh = previewMeshBox;

            this._cubeTex = new BABYLON.CubeTexture(AdapterItem.object.name, this._scene);
            this._mat.reflectionTexture = this._cubeTex;
            (<BABYLON.CubeTexture>this._mat.reflectionTexture).coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._mat.disableLighting = true;

            previewMeshBox.material = this._mat;
        }

        this._engine.resize();
    }

    public dispose() {
        this._engine.dispose();
        this.canvas = null;
    }
}
