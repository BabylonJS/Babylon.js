declare module BABYLON {
    class DebugLayer {
        private _scene;
        private _enabled;
        private _labelsEnabled;
        private _displayStatistics;
        private _displayTree;
        private _displayLogs;
        private _globalDiv;
        private _statsDiv;
        private _statsSubsetDiv;
        private _optionsDiv;
        private _optionsSubsetDiv;
        private _logDiv;
        private _logSubsetDiv;
        private _treeDiv;
        private _treeSubsetDiv;
        private _drawingCanvas;
        private _drawingContext;
        private _syncPositions;
        private _syncData;
        private _onCanvasClick;
        private _clickPosition;
        private _ratio;
        private _identityMatrix;
        private _showUI;
        private _needToRefreshMeshesTree;
        public shouldDisplayLabel: (node: Node) => boolean;
        public shouldDisplayAxis: (mesh: Mesh) => boolean;
        public axisRatio: number;
        constructor(scene: Scene);
        private _refreshMeshesTreeContent();
        private _renderSingleAxis(zero, unit, unitText, label, color);
        private _renderAxis(projectedPosition, mesh, globalViewport);
        private _renderLabel(text, projectedPosition, labelOffset, onClick, getFillStyle);
        private _isClickInsideRect(x, y, width, height);
        public isVisible(): boolean;
        public hide(): void;
        public show(showUI?: boolean): void;
        private _clearLabels();
        private _generateheader(root, text);
        private _generateTexBox(root, title);
        private _generateAdvancedCheckBox(root, leftTitle, rightTitle, initialState, task, tag?);
        private _generateCheckBox(root, title, initialState, task, tag?);
        private _generateRadio(root, title, name, initialState, task, tag?);
        private _generateDOMelements();
        private _displayStats();
    }
}
