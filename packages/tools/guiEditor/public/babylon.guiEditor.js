(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    // index.js calls BABYLON.GuiEditor.Show (mixed case); also expose GUIEditor for
    // any code that uses the source-code class name directly.
    BABYLON.GuiEditor = BABYLON.GuiEditor || {};
    BABYLON.GuiEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteGuiEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonGuiEditorReady", { detail: { args: args } }));
    };
    BABYLON.GUIEditor = BABYLON.GuiEditor;
})();
