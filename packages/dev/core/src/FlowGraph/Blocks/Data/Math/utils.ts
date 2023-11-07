/**
 * @internal
 * @param v
 * @returns
 */
export function _getClassNameOf(v: any) {
    if (v.getClassName) {
        return v.getClassName();
    }
    return "";
}

/**
 * @internal
 * @param className
 * @param className2
 * @returns
 */
export function _areSameVectorClass(className: string, className2: string) {
    return (className === "Vector2" && className2 === "Vector2") || (className === "Vector3" && className2 === "Vector3") || (className === "Vector4" && className2 === "Vector4");
}
