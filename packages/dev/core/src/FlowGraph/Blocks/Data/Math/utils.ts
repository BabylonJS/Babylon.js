export function _getClassNameOf(v: any) {
    if (v.getClassName) {
        return v.getClassName();
    }
    return "";
}
