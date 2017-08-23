module INSPECTOR {

    export class TextureTab extends Tab {

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
            // Nothing to dispose
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

            let imgs: HTMLImageElement[] = [];
            let img = Helpers.CreateElement('img', 'texture-image', this._imagePanel) as HTMLImageElement;
            imgs.push(img);
            
            //Create five other images elements
            for(let i = 0; i<5; i++){
                imgs.push(Helpers.CreateElement('img', 'texture-image', this._imagePanel) as HTMLImageElement);
            }

            if (texture instanceof BABYLON.MapTexture) {
                // instance of Map texture
                texture.bindTextureForPosSize(new BABYLON.Vector2(0, 0), new BABYLON.Size(texture.getSize().width, texture.getSize().height), false);
                BABYLON.Tools.DumpFramebuffer(texture.getSize().width, texture.getSize().height, this._inspector.scene.getEngine(), (data) => img.src = data);
                texture.unbindTexture();

            }
            else if (texture instanceof BABYLON.RenderTargetTexture) {
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
                    BABYLON.Tools.DumpFramebuffer(size.width, size.height, engine,  
                        (data) => imgs[faceIndex].src = data, "image/png");
                });

                // Render the texture
                scene.incrementRenderId();
                scene.resetCachedMaterial();
                screenShotTexture.render();
                screenShotTexture.dispose();
            }else if(texture instanceof BABYLON.CubeTexture){
                // Display all textures of the CubeTexture
                let i: number = 0;
                for(let filename of (texture as BABYLON.CubeTexture)['_files']){
                    imgs[i].src = filename;
                    i++;
                }
            }
             else if (texture.url) {
                // If an url is present, the texture is an image
                img.src = texture.url;

            } else if (texture['_canvas']) {
                // Dynamic texture
                let base64Image = texture['_canvas'].toDataURL("image/png");
                img.src = base64Image;
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

}