(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.FlowGraphEditor = BABYLON.FlowGraphEditor || {};
    BABYLON.FlowGraphEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteFlowGraphEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonFlowGraphEditorReady", { detail: { args: args } }));
    };
})();
