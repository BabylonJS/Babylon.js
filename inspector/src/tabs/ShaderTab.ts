module INSPECTOR {

    export class ShaderTab extends Tab {

        private _inspector : Inspector;
        
        private _vertexPanel : HTMLElement;
        private _fragmentPanel : HTMLElement;

        constructor(tabbar:TabBar, insp:Inspector) {
            super(tabbar, 'Shader');            
            this._inspector = insp;

            // Build the shaders panel : a div that will contains the shaders tree and both shaders panels
            this._panel         = Helpers.CreateDiv('tab-panel') as HTMLDivElement;

            let shaderPanel     = Helpers.CreateDiv('shader-tree-panel') as HTMLDivElement;
            this._vertexPanel   = Helpers.CreateDiv('shader-panel') as HTMLDivElement;
            this._fragmentPanel = Helpers.CreateDiv('shader-panel') as HTMLDivElement;

            this._panel.appendChild(shaderPanel);
            this._panel.appendChild(this._vertexPanel);
            this._panel.appendChild(this._fragmentPanel);
            
            Helpers.LoadScript();
            
            Split([this._vertexPanel, this._fragmentPanel], {
                blockDrag : this._inspector.popupMode,
                sizes:[50, 50],
                direction:'vertical'}
            );  
            
            let comboBox = Helpers.CreateElement('select', '', shaderPanel);
            comboBox.addEventListener('change', this._selectShader.bind(this));
            
            let option = Helpers.CreateElement('option', '', comboBox);
            option.textContent = 'Select a shader';
            option.setAttribute('value', "");
            option.setAttribute('disabled', 'true');
            option.setAttribute('selected', 'true');            
            
            // Build shaders combobox
            for (let mat of this._inspector.scene.materials) {
                if (mat instanceof BABYLON.ShaderMaterial) {
                    let option = Helpers.CreateElement('option', '', comboBox);
                    option.setAttribute('value', mat.id);
                    option.textContent = `${mat.name} - ${mat.id}`;
                    
                }
            }

        }
        
        private _selectShader(event:Event) {
            let id = (event.target as HTMLSelectElement).value;
            let mat = this._inspector.scene.getMaterialByID(id); 
            
            // Clean shader panel
            Helpers.CleanDiv(this._vertexPanel);
            // add the title - vertex shader
            let title = Helpers.CreateDiv('shader-panel-title', this._vertexPanel);
            title.textContent = 'Vertex shader';
            // add code
            let code = Helpers.CreateElement('code', 'glsl',  Helpers.CreateElement('pre', '', this._vertexPanel));
            code.textContent = this._beautify(mat.getEffect().getVertexShaderSource());
            
            Helpers.CleanDiv(this._fragmentPanel);
            // add the title - fragment shader
            title = Helpers.CreateDiv('shader-panel-title', this._fragmentPanel);
            title.textContent = 'Frgament shader';
            // add code
            code = Helpers.CreateElement('code', 'glsl',  Helpers.CreateElement('pre', '', this._fragmentPanel));
            code.textContent = this._beautify(mat.getEffect().getFragmentShaderSource());         
                                    
            // Init the syntax highlighting
            let styleInit = Helpers.CreateElement('script', '', Inspector.DOCUMENT.body);
            styleInit.textContent = 'hljs.initHighlighting();';
            
        }

        /** Overrides super.dispose */
        public dispose() {
        }

        /** Returns the position of the first { and the corresponding } */
        private _getBracket(str) {
            let fb = str.indexOf('{');
            let arr = str.substr(fb+1).split('');
            let counter = 1;
            let currentPosInString  = fb;
            let lastBracketIndex = 0;
            for (let char of arr) {
                currentPosInString++;
                if (char === '{') {
                    counter++
                }
                if (char === '}') {
                    counter--
                }
                if (counter == 0) {
                    lastBracketIndex = currentPosInString;
                    break;         
                }
            }

            return {firstBracket : fb, lastBracket:lastBracketIndex};
        }

        /** 
         * Beautify the given string : correct indentation
         */
        private _beautify(glsl:string, level: number = 0) {
            
            // return condition : no brackets at all
            let brackets = this._getBracket(glsl);
            let firstBracket       = brackets.firstBracket;
            let lastBracket        = brackets.lastBracket;

            let spaces = "";
            for (let i=0 ;i<level; i++) {
                spaces += "    "; // 4 spaces
            }
            // If no brackets, return the indented string
            if (firstBracket == -1) {
                glsl = spaces+glsl; // indent first line
                glsl = glsl
                    .replace(/;./g, x => '\n'+x.substr(1)) // new line after ;  except the last one
                    glsl = glsl.replace(/=/g, " = ") // space around =
                    glsl = glsl.replace(/\n/g, "\n"+spaces); // indentation
                return glsl;
            } else {
                // if brackets, beautify the inside                                 
                // let insideWithBrackets = glsl.substr(firstBracket, lastBracket-firstBracket+1);
                let left   = glsl.substr(0, firstBracket);
                let right  = glsl.substr(lastBracket+1, glsl.length); 
                let inside = glsl.substr(firstBracket+1, lastBracket-firstBracket-1);
                inside     = this._beautify(inside, level+1);
                return this._beautify(left, level)+'{\n'+inside+'\n'+spaces+'}\n'+this._beautify(right, level);

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
        }
    }

}