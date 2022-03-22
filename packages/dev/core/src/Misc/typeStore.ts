/** @hidden */
// eslint-disable-next-line @typescript-eslint/naming-convention
const _RegisteredTypes: { [key: string]: Object } = {};

/**
 * @param className
 * @param type
 * @hidden
 */
export function RegisterClass(className: string, type: Object) {
    _RegisteredTypes[className] = type;
}

/**
 * @param fqdn
 * @hidden
 */
export function GetClass(fqdn: string): any {
    return _RegisteredTypes[fqdn];
}
