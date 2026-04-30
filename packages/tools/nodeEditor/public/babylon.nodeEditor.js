(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeEditor = BABYLON.NodeEditor || {};
    BABYLON.NodeEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeEditorReady", { detail: { args: args } }));
    };
})();
