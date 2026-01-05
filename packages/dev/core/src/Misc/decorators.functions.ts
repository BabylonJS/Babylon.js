const MergedStore = {};

const DecoratorInitialStore = {};

/** @internal */
export function GetDirectStore(target: any): any {
    const classKey = target.getClassName();

    if (!(<any>DecoratorInitialStore)[classKey]) {
        (<any>DecoratorInitialStore)[classKey] = {};
    }

    return (<any>DecoratorInitialStore)[classKey];
}

/**
 * @returns the list of properties flagged as serializable
 * @param target host object
 */
export function GetMergedStore(target: any): any {
    const classKey = target.getClassName();

    if ((<any>MergedStore)[classKey]) {
        return (<any>MergedStore)[classKey];
    }

    (<any>MergedStore)[classKey] = {};

    const store = (<any>MergedStore)[classKey];
    let currentTarget = target;
    let currentKey = classKey;
    while (currentKey) {
        const initialStore = (<any>DecoratorInitialStore)[currentKey];
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
