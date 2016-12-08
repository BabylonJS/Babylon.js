 module INSPECTOR {
     /**
     * Display a very small div corresponding to the given texture. On mouse over, display the full image
     */
    export class TextureElement extends BasicElement{

        /** The big div displaying the full image */
        private _textureDiv : HTMLElement;
            
        constructor(tex : BABYLON.Texture) {
            super();
            this._div.className = 'fa fa-search texture-element';

            // Create the texture viewer
            this._textureDiv = Helpers.CreateDiv('texture-viewer', this._div);
            // Img
            let imgDiv = Helpers.CreateDiv('texture-viewer-img', this._textureDiv);

            // Texture size
            let sizeDiv = Helpers.CreateDiv(null, this._textureDiv);
            
            if (tex) {
                sizeDiv.textContent = `${tex.getBaseSize().width}px x ${tex.getBaseSize().height}px`;
                imgDiv.style.backgroundImage = `url('${tex.url}')`;     
                imgDiv.style.width = `${tex.getBaseSize().width}px`;
                imgDiv.style.height = `${tex.getBaseSize().height}px`;
            }

            this._div.addEventListener('mouseover', this._showViewer.bind(this, 'flex'));
            this._div.addEventListener('mouseout', this._showViewer.bind(this, 'none')); 

        }
        
        public update(tex?:BABYLON.Texture) {
            
        }

        private _showViewer(mode:string) {
            this._textureDiv.style.display = mode;
        }
    }
 }