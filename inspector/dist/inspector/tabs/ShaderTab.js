var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var INSPECTOR;
(function (INSPECTOR) {
    var ShaderTab = (function (_super) {
        __extends(ShaderTab, _super);
        function ShaderTab(tabbar, insp) {
            _super.call(this, tabbar, 'Shader');
            this._inspector = insp;
            // Build the shaders panel : a div that will contains the shaders tree and both shaders panels
            this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            var shaderPanel = INSPECTOR.Helpers.CreateDiv('shader-tree-panel');
            this._vertexPanel = INSPECTOR.Helpers.CreateDiv('shader-panel');
            this._fragmentPanel = INSPECTOR.Helpers.CreateDiv('shader-panel');
            this._panel.appendChild(shaderPanel);
            this._panel.appendChild(this._vertexPanel);
            this._panel.appendChild(this._fragmentPanel);
            INSPECTOR.Helpers.LoadScript();
            Split([this._vertexPanel, this._fragmentPanel], {
                sizes: [50, 50],
                direction: 'vertical' });
            var comboBox = INSPECTOR.Helpers.CreateElement('select', '', shaderPanel);
            comboBox.addEventListener('change', this._selectShader.bind(this));
            var option = INSPECTOR.Helpers.CreateElement('option', '', comboBox);
            option.textContent = 'Select a shader';
            option.setAttribute('value', "");
            option.setAttribute('disabled', 'true');
            option.setAttribute('selected', 'true');
            // Build shaders combobox
            for (var _i = 0, _a = this._inspector.scene.materials; _i < _a.length; _i++) {
                var mat = _a[_i];
                if (mat instanceof BABYLON.ShaderMaterial) {
                    var option_1 = INSPECTOR.Helpers.CreateElement('option', '', comboBox);
                    option_1.setAttribute('value', mat.id);
                    option_1.textContent = mat.name + " - " + mat.id;
                }
            }
        }
        ShaderTab.prototype._selectShader = function (event) {
            var id = event.target.value;
            var mat = this._inspector.scene.getMaterialByID(id);
            // Clean shader panel
            INSPECTOR.Helpers.CleanDiv(this._vertexPanel);
            // add the title - vertex shader
            var title = INSPECTOR.Helpers.CreateDiv('shader-panel-title', this._vertexPanel);
            title.textContent = 'Vertex shader';
            // add code
            var code = INSPECTOR.Helpers.CreateElement('code', 'glsl', INSPECTOR.Helpers.CreateElement('pre', '', this._vertexPanel));
            code.textContent = this._beautify(mat.getEffect().getVertexShaderSource());
            INSPECTOR.Helpers.CleanDiv(this._fragmentPanel);
            // add the title - fragment shader
            title = INSPECTOR.Helpers.CreateDiv('shader-panel-title', this._fragmentPanel);
            title.textContent = 'Frgament shader';
            // add code
            code = INSPECTOR.Helpers.CreateElement('code', 'glsl', INSPECTOR.Helpers.CreateElement('pre', '', this._fragmentPanel));
            code.textContent = this._beautify(mat.getEffect().getFragmentShaderSource());
            // Init the syntax highlighting
            var styleInit = INSPECTOR.Helpers.CreateElement('script', '', INSPECTOR.Inspector.DOCUMENT.body);
            styleInit.textContent = 'hljs.initHighlighting();';
        };
        /** Overrides super.dispose */
        ShaderTab.prototype.dispose = function () {
        };
        /** Returns the position of the first { and the corresponding } */
        ShaderTab.prototype._getBracket = function (str) {
            var fb = str.indexOf('{');
            var arr = str.substr(fb + 1).split('');
            var counter = 1;
            var currentPosInString = fb;
            var lastBracketIndex = 0;
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var char = arr_1[_i];
                currentPosInString++;
                if (char === '{') {
                    counter++;
                }
                if (char === '}') {
                    counter--;
                }
                if (counter == 0) {
                    lastBracketIndex = currentPosInString;
                    break;
                }
            }
            return { firstBracket: fb, lastBracket: lastBracketIndex };
        };
        /**
         * Beautify the given string : correct indentation
         */
        ShaderTab.prototype._beautify = function (glsl, level) {
            if (level === void 0) { level = 0; }
            // return condition : no brackets at all
            var brackets = this._getBracket(glsl);
            var firstBracket = brackets.firstBracket;
            var lastBracket = brackets.lastBracket;
            var spaces = "";
            for (var i = 0; i < level; i++) {
                spaces += "    "; // 4 spaces
            }
            // If no brackets, return the indented string
            if (firstBracket == -1) {
                glsl = spaces + glsl; // indent first line
                glsl = glsl
                    .replace(/;./g, function (x) { return '\n' + x.substr(1); }); // new line after ;  except the last one
                glsl = glsl.replace(/=/g, " = "); // space around =
                glsl = glsl.replace(/\n/g, "\n" + spaces); // indentation
                return glsl;
            }
            else {
                // if brackets, beautify the inside                                 
                // let insideWithBrackets = glsl.substr(firstBracket, lastBracket-firstBracket+1);
                var left = glsl.substr(0, firstBracket);
                var right = glsl.substr(lastBracket + 1, glsl.length);
                var inside = glsl.substr(firstBracket + 1, lastBracket - firstBracket - 1);
                inside = this._beautify(inside, level + 1);
                return this._beautify(left, level) + '{\n' + inside + '\n' + spaces + '}\n' + this._beautify(right, level);
            }
            // // Replace bracket with @1 and @2 with correct indentation
            // let newInside          = "@1\n\t" + inside + "\n@2";
            // newInside              = newInside.replace(/;\n/g, ";\n\t");
            // glsl                   = glsl.replace(insideWithBrackets, newInside);
            // firstBracket       = glsl.indexOf('{');
            // lastBracket        = glsl.lastIndexOf('}');
            // }
            // console.log(glsl);
            // let regex = /(\{(?:\{??[^\{]*?}))+/gmi;
            // let tmp = glsl;
            // let m;
            // while ((m = regex.exec(tmp)) !== null) {
            //     // This is necessary to avoid infinite loops with zero-width matches
            //     if (m.index === regex.lastIndex) {
            //         regex.lastIndex++;
            //     }                
            //     // The result can be accessed through the `m`-variable.
            //     m.forEach((match, groupIndex) => {
            //         // Remove the first and the last bracket only
            //         let matchWithoutBrackets = match.replace(/{/, "").replace(/}/, "");
            //         // Indent the content inside brackets with tabs
            //         glsl = glsl.replace(match, `{\n\t${matchWithoutBrackets}\n}\n`);
            //         // removes the match from tmp
            //         tmp = tmp.replace(match, "");
            //         // and continue
            //     });
            // }
            // return 
        };
        return ShaderTab;
    }(INSPECTOR.Tab));
    INSPECTOR.ShaderTab = ShaderTab;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=ShaderTab.js.map