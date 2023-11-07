const warnedMap: { [key: string]: boolean } = {};
/**
 * @internal
 */
export function _WarnImport(name: string, warnOnce = false) {
    if (warnOnce && warnedMap[name]) {
        return;
    }
    warnedMap[name] = true;
    return `${name} needs to be imported before as it contains a side-effect required by your code.`;
}
