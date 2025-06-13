// Constants
const DELIMITER = "#";
const SAFARI_DELIMITER = "%23";
const DELIMITER_REGEX = new RegExp(`(?:${DELIMITER}|${SAFARI_DELIMITER})`);

/**
 * Extracts the snippet info from the URL hash.
 * @returns The snippet token and version from the URL hash as an array.
 */
export function getSnippet() {
    const [snippetToken, version] = location.hash.substring(1).split(DELIMITER_REGEX);
    return [snippetToken, version];
}

/**
 * Set the snippet info in the URL hash.
 * @param snippetToken - Snippet token to set
 * @param version - Version of the snippet to set
 * @param triggerHashChangeEvent - Whether to trigger a hash change event
 */
export function setSnippet(snippetToken: string, version: string | undefined, triggerHashChangeEvent: boolean = true) {
    let newHash = snippetToken;
    if (version && version != "0") {
        newHash += DELIMITER + version;
    }

    if (triggerHashChangeEvent) {
        location.hash = newHash;
    } else {
        history.replaceState(null, "", window.location.pathname + DELIMITER + newHash);
    }
}
