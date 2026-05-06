/**
 * Shows a Playground-owned prompt for resolving a missing Smart Asset file.
 * @param key The smart asset key that failed to load.
 * @param expectedUrl The URL that failed to load.
 * @returns A replacement URL or File, or null to skip loading the asset.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function PlaygroundAssetNotFoundHandler(key: string, expectedUrl: string): Promise<string | File | null> {
    return await new Promise<string | File | null>((resolve) => {
        const shortUrl = expectedUrl.length > 60 ? "..." + expectedUrl.slice(-50) : expectedUrl;

        const overlay = document.createElement("div");
        overlay.style.cssText = ["position:fixed", "inset:0", "background:rgba(0,0,0,0.5)", "display:flex", "align-items:center", "justify-content:center", "z-index:10000"].join(
            ";"
        );

        const dialog = document.createElement("div");
        dialog.style.cssText = [
            "background:#2d2d2d",
            "color:#eee",
            "padding:24px 32px",
            "border-radius:8px",
            "font:14px sans-serif",
            "max-width:500px",
            "text-align:center",
            "box-shadow:0 4px 24px rgba(0,0,0,0.6)",
        ].join(";");

        const title = document.createElement("div");
        title.style.cssText = "font-size:16px;font-weight:bold;margin-bottom:8px";
        title.textContent = "Smart Asset not found";

        const keyLine = document.createElement("div");
        keyLine.style.cssText = "margin-bottom:4px";
        keyLine.appendChild(document.createTextNode("Key: "));
        const keyValue = document.createElement("b");
        keyValue.textContent = key;
        keyLine.appendChild(keyValue);

        const urlLine = document.createElement("div");
        urlLine.style.cssText = "margin-bottom:16px;opacity:0.6;font-size:12px;word-break:break-all";
        urlLine.textContent = shortUrl;

        const prompt = document.createElement("div");
        prompt.style.cssText = "margin-bottom:16px";
        prompt.textContent = "Locate the file or skip this asset.";

        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;gap:12px;justify-content:center";

        const locateButton = document.createElement("button");
        locateButton.textContent = "Locate File...";
        locateButton.style.cssText = "padding:8px 20px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px";

        const skipButton = document.createElement("button");
        skipButton.textContent = "Skip";
        skipButton.style.cssText = "padding:8px 20px;background:#444;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:13px";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2";
        input.style.display = "none";

        const close = (value: string | File | null) => {
            overlay.remove();
            resolve(value);
        };

        locateButton.onclick = () => input.click();
        skipButton.onclick = () => close(null);
        input.onchange = () => close(input.files?.[0] ?? null);

        actions.appendChild(locateButton);
        actions.appendChild(skipButton);
        dialog.appendChild(title);
        dialog.appendChild(keyLine);
        dialog.appendChild(urlLine);
        dialog.appendChild(prompt);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    });
}
