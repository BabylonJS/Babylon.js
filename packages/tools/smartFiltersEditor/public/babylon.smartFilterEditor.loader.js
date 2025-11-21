const scriptName = "babylon.smartFilterEditor.js";
const defaultScript = `/${scriptName}`;
const snapshotServerUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/";

(function () {
    // Get the 'snapshot' query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const snapshot = urlParams.get("snapshot");

    let scriptSrc = defaultScript;

    // Check if snapshot exists and that it only contains valid characters
    if (snapshot && typeof snapshot === "string") {
        // Make sure the string only has valid letters, numbers, or forward slashes in it
        const semverPattern = /^[a-zA-Z0-9/]+$/;

        if (semverPattern.test(snapshot)) {
            scriptSrc = `${snapshotServerUrl}${snapshot}/smartFiltersEditor/${scriptName}`;
        }
    }

    // Create the script
    const script = document.createElement("script");
    script.onerror = function () {
        // Handle loading errors - fall back to default path if versioned script fails
        if (scriptSrc !== defaultScript) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to load script from the snapshot server. Falling back to default script.`);

            // Remove the failed script
            script.remove();

            // Create a new script with the fallback path
            const fallbackScript = document.createElement("script");
            fallbackScript.src = defaultScript;
            document.head.appendChild(fallbackScript);
        }
    };
    script.src = scriptSrc;

    document.head.appendChild(script);
})();
