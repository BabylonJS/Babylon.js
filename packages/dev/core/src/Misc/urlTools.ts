/**
 * Gets the file extension from a URL.
 * @param url The URL to get the file extension from.
 * @returns The file extension, or an empty string if no extension is found.
 */
export function GetExtensionFromUrl(url: string) {
    const urlWithoutUriParams = url.split("?")[0];
    const lastDot = urlWithoutUriParams.lastIndexOf(".");
    const extension = lastDot > -1 ? urlWithoutUriParams.substring(lastDot).toLowerCase() : "";
    return extension;
}
