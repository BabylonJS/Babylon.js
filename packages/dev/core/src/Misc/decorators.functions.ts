// eslint-disable-next-line @typescript-eslint/naming-convention
const __mergedStore = {};

// eslint-disable-next-line @typescript-eslint/naming-convention
const __decoratorInitialStore = {};

/** @internal */
export function GetDirectStore(target: any): any {
    const classKey = target.getClassName();

    if (!(<any>__decoratorInitialStore)[classKey]) {
        (<any>__decoratorInitialStore)[classKey] = {};
    }

    return (<any>__decoratorInitialStore)[classKey];
}

/**
 * @returns the list of properties flagged as serializable
 * @param target host object
 */
export function GetMergedStore(target: any): any {
    const classKey = target.getClassName();

    if ((<any>__mergedStore)[classKey]) {
        return (<any>__mergedStore)[classKey];
    }

    (<any>__mergedStore)[classKey] = {};

    const store = (<any>__mergedStore)[classKey];
    let currentTarget = target;
    let currentKey = classKey;
    while (currentKey) {
        const initialStore = (<any>__decoratorInitialStore)[currentKey];
        for (const property in initialStore) {
            store[property] = initialStore[property];
        }

        let parent: any;
        let done = false;

        do {
            parent = Object.getPrototypeOf(currentTarget);
            if (!parent.getClassName) {
                done = true;
                break;
            }

            if (parent.getClassName() !== currentKey) {
                break;
            }

            currentTarget = parent;
        } while (parent);

        if (done) {
            break;
        }

        currentKey = parent.getClassName();
        currentTarget = parent;
    }

    return store;
}
