/** @hidden */
export class _TypeStore {
    /** @hidden */
    public static RegisteredTypes: { [key: string]: Object } = {};

    /** @hidden */
    public static GetClass(fqdn: string): any {
        if (this.RegisteredTypes && this.RegisteredTypes[fqdn]) {
            return this.RegisteredTypes[fqdn];
        }
        return null;
    }
}