/** @internal */
export function _CleanUrl(url: string) {
    return url.replace(/#/gm, "%23");
}
