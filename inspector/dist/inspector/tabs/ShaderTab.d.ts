declare module INSPECTOR {
    class ShaderTab extends Tab {
        private _inspector;
        private _vertexPanel;
        private _fragmentPanel;
        constructor(tabbar: TabBar, insp: Inspector);
        private _selectShader(event);
        /** Overrides super.dispose */
        dispose(): void;
        /** Returns the position of the first { and the corresponding } */
        private _getBracket(str);
        /**
         * Beautify the given string : correct indentation
         */
        private _beautify(glsl, level?);
    }
}
