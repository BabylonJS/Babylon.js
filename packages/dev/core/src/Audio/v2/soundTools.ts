/** @internal */
export function _cleanUrl(url: string) {
    return url.replace(/#/gm, "%23");
}
