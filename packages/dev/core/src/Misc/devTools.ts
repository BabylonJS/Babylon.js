const WarnedMap: { [key: string]: boolean } = {};
/**
 * @internal
 */
export function _WarnImport(name: string, warnOnce = false) {
    if (warnOnce && WarnedMap[name]) {
        return;
    }
    WarnedMap[name] = true;
    return `${name} needs to be imported before as it contains a side-effect required by your code.`;
}
