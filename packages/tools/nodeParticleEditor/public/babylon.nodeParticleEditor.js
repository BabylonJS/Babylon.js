(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeParticleEditor = BABYLON.NodeParticleEditor || {};
    BABYLON.NodeParticleEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeParticleEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeParticleEditorReady", { detail: { args: args } }));
    };
})();
