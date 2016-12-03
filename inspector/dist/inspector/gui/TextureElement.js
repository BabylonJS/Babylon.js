var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div corresponding to the given texture. On mouse over, display the full image
    */
    var TextureElement = (function (_super) {
        __extends(TextureElement, _super);
        function TextureElement(tex) {
            _super.call(this);
            this._div.className = 'fa fa-search texture-element';
            // Create the texture viewer
            this._textureDiv = INSPECTOR.Helpers.CreateDiv('texture-viewer', this._div);
            // Img
            var imgDiv = INSPECTOR.Helpers.CreateDiv('texture-viewer-img', this._textureDiv);
            // Texture size
            var sizeDiv = INSPECTOR.Helpers.CreateDiv(null, this._textureDiv);
            if (tex) {
                sizeDiv.textContent = tex.getBaseSize().width + "px x " + tex.getBaseSize().height + "px";
                imgDiv.style.backgroundImage = "url('" + tex.url + "')";
                imgDiv.style.width = tex.getBaseSize().width + "px";
                imgDiv.style.height = tex.getBaseSize().height + "px";
            }
            this._div.addEventListener('mouseover', this._showViewer.bind(this, 'flex'));
            this._div.addEventListener('mouseout', this._showViewer.bind(this, 'none'));
        }
        TextureElement.prototype.update = function (tex) {
        };
        TextureElement.prototype._showViewer = function (mode) {
            this._textureDiv.style.display = mode;
        };
        return TextureElement;
    }(INSPECTOR.BasicElement));
    INSPECTOR.TextureElement = TextureElement;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=TextureElement.js.map