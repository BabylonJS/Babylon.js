/** @hidden */
export class _DevTools {
    public static WarnImport(name: string) {
        return `${name} needs to be imported before as it contains a side-effect required by your code.`;
    }
}