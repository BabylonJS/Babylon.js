(async () => {
    await import("viewer");
    const container = document.createElement("div");
    container.innerHTML = `<babylon-viewer source="https://playground.babylonjs.com/scenes/BoomBox.glb"></babylon-viewer>`;
    document.body.appendChild(container);
})();
