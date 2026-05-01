(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeGeometryEditor = BABYLON.NodeGeometryEditor || {};
    BABYLON.NodeGeometryEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeGeometryEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeGeometryEditorReady", { detail: { args: args } }));
    };
})();
