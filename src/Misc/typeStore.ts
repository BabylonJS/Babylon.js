/** @hidden */
const _RegisteredTypes: { [key: string]: Object } = {};

/** @hidden */
export function RegisterClass(className: string, type: Object) {
    _RegisteredTypes[className] = type;
}

/** @hidden */
export function GetClass(fqdn: string): any {
    return _RegisteredTypes[fqdn];
}
