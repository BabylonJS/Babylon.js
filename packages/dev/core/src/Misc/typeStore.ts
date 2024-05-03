/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
const _RegisteredTypes: { [key: string]: Object } = {};

/**
 * @internal
 */
export function RegisterClass(className: string, type: Object) {
    _RegisteredTypes[className] = type;
}

/**
 * @internal
 */
export function GetClass(fqdn: string): any {
    return _RegisteredTypes[fqdn];
}

/**
 * @internal
 */
export function GetClassName(obj: any): string {
    for (const key in _RegisteredTypes) {
        if (obj instanceof (_RegisteredTypes[key] as any) && !key.includes("Abstract")) {
            return key;
        }
    }
    return "Unknown";
}
