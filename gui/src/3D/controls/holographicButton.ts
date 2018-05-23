/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _backPlate: Mesh;
        private _textPlate: Mesh;
        private _frontPlate: Mesh;
        private _text: string;
        private _imageUrl: string;
        private _shareMaterials = true;
        private _frontMaterial: FluentMaterial;
        private _backMaterial: FluentMaterial;
        private _plateMaterial: StandardMaterial;
        private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;

        // private _imageUrl: string;

        /**
         * Gets or sets text for the button
         */
        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            if (this._text === value) {
                return;
            }

            this._text = value;
            this._rebuildContent();
        }

        /**
         * Gets or sets the image url for the button
         */
        public get imageUrl(): string {
            return this._imageUrl;
        }

        public set imageUrl(value: string) {
            if (this._imageUrl === value) {
                return;
            }

            this._imageUrl = value;
            this._rebuildContent();
        }        

        /**
         * Gets the back material used by this button
         */
        public get backMaterial(): FluentMaterial {
            return this._backMaterial;
        }

        /**
         * Gets the front material used by this button
         */
        public get frontMaterial(): FluentMaterial {
            return this._frontMaterial;
        }       
        
        /**
         * Gets the plate material used by this button
         */
        public get plateMaterial(): StandardMaterial {
            return this._plateMaterial;
        }          

        /**
         * Gets a boolean indicating if this button shares its material with other HolographicButtons
         */
        public get shareMaterials(): boolean {
            return this._shareMaterials;
        }

        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string, shareMaterials = true) {
            super(name);

            this._shareMaterials = shareMaterials;

            // Default animations
            this.pointerEnterAnimation = () => {
                if (!this.mesh) {
                    return;
                }
                this._frontPlate.setEnabled(true);
            }

            this.pointerOutAnimation = () => {
                if (!this.mesh) {
                    return;
                }
                this._frontPlate.setEnabled(false);
            }                      
        }
    
        protected _getTypeName(): string {
            return "HolographicButton";
        }        

        private _rebuildContent(): void {
            let panel = new StackPanel();
            panel.isVertical = true;

            if (this._imageUrl) {
                let image = new BABYLON.GUI.Image();
                image.source = this._imageUrl;
                image.paddingTop = "40px";
                image.height = "180px";
                image.width = "100px";
                image.paddingBottom = "40px";
                panel.addControl(image);                
            }

            if (this._text) {
                let text = new BABYLON.GUI.TextBlock();
                text.text = this._text;
                text.color = "white";
                text.height = "30px";
                text.fontSize = 24;
                panel.addControl(text);
            }

            if (this._frontPlate) {
                this.content = panel;
            }
        }

        // Mesh association
        protected _createNode(scene: Scene): TransformNode {
            this._backPlate = MeshBuilder.CreateBox(this.name + "BackMesh", {
                width: 1.0, 
                height: 1.0,
                depth: 0.08
            }, scene); 

            this._frontPlate = MeshBuilder.CreateBox(this.name + "FrontMesh", {
                width: 1.0, 
                height: 1.0,
                depth: 0.08
            }, scene); 

            this._frontPlate.parent = this._backPlate;
            this._frontPlate.position.z = -0.08;
            this._frontPlate.isPickable = false;
            this._frontPlate.setEnabled(false);

            this._textPlate= <Mesh>super._createNode(scene);
            this._textPlate.parent = this._backPlate;
            this._textPlate.position.z = -0.08;
            this._textPlate.isPickable = false;            
           
            return this._backPlate;
        }

        protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
            this._plateMaterial.emissiveTexture = facadeTexture;
            this._plateMaterial.opacityTexture = facadeTexture;
        }   
        
        private _createBackMaterial(mesh: Mesh) {
            this._backMaterial = new FluentMaterial(this.name + "Back Material", mesh.getScene());
            this._backMaterial.renderHoverLight = true;
            this._pickedPointObserver = this._host.onPickedPointChangedObservable.add(pickedPoint => {
                if (pickedPoint) {
                    this._backMaterial.hoverPosition = pickedPoint;
                    this._backMaterial.hoverColor.a = 1.0;
                } else {
                    this._backMaterial.hoverColor.a = 0;
                }
            });
        }

        private _createFrontMaterial(mesh: Mesh) {
            this._frontMaterial = new FluentMaterial(this.name + "Front Material", mesh.getScene());
            this._frontMaterial.innerGlowColorIntensity = 0; // No inner glow
            this._frontMaterial.alpha = 0.5; // Additive
            this._frontMaterial.renderBorders = true;
        }     
        
        private _createPlateMaterial(mesh: Mesh) {
            this._plateMaterial = new StandardMaterial(this.name + "Plate Material", mesh.getScene());
            this._plateMaterial.specularColor = Color3.Black();
        }

        protected _affectMaterial(mesh: Mesh) {
            // Back
            if (this._shareMaterials) {
                if (!this._host.sharedMaterials["backFluentMaterial"]) {
                    this._createBackMaterial(mesh);
                    this._host.sharedMaterials["backFluentMaterial"] =  this._backMaterial;
                } else {
                    this._backMaterial = this._host.sharedMaterials["backFluentMaterial"] as FluentMaterial;
                }

                // Front
                if (!this._host.sharedMaterials["frontFluentMaterial"]) {
                    this._createFrontMaterial(mesh);
                    this._host.sharedMaterials["frontFluentMaterial"] = this._frontMaterial;                
                } else {
                    this._frontMaterial = this._host.sharedMaterials["frontFluentMaterial"] as FluentMaterial;
                }  
            } else {
                this._createBackMaterial(mesh);
                this._createFrontMaterial(mesh);
            }

            this._createPlateMaterial(mesh);
            this._backPlate.material =  this._backMaterial;
            this._frontPlate.material = this._frontMaterial;
            this._textPlate.material = this._plateMaterial;

            this._rebuildContent();
        }

        /**
         * Releases all associated resources
         */
        public dispose() {
            super.dispose(); // will dispose main mesh ie. back plate
            
            if (!this.shareMaterials) {
                this._backMaterial.dispose();
                this._frontMaterial.dispose();
                this._plateMaterial.dispose();

                if (this._pickedPointObserver) {
                    this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
                    this._pickedPointObserver = null;
                }
            }
        }        
    }
}