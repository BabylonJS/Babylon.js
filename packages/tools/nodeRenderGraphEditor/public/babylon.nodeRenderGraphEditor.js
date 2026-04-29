(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeRenderGraphEditor = BABYLON.NodeRenderGraphEditor || {};
    BABYLON.NodeRenderGraphEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeRenderGraphEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeRenderGraphEditorReady", { detail: { args: args } }));
    };
})();
