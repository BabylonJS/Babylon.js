export const _FileExtensionRegex = new RegExp("\\.(\\w{3,4})($|\\?)");

/** @internal */
export function _CleanUrl(url: string) {
    return url.replace(/#/gm, "%23");
}
