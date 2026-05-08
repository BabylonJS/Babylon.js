/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
const RegisteredTypes: { [key: string]: object } = {};

/**
 * @internal
 */
export function RegisterClass(className: string, type: object) {
    RegisteredTypes[className] = type;
}

/**
 * @internal
 */
export function GetClass(fqdn: string): any {
    return RegisteredTypes[fqdn];
}

/**
 * @internal
 */
export function GetClassName(obj: any): string {
    for (const key in RegisteredTypes) {
        if (obj instanceof (RegisteredTypes[key] as any) && !key.includes("Abstract")) {
            return key;
        }
    }
    return "Unknown";
}
