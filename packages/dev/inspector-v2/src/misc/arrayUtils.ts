export function GroupBy<T, K>(items: T[], getKey: (item: T) => K): { key: K; items: T[] }[] {
    const map = items.reduce((map, item) => {
        const key = getKey(item);
        let group = map.get(key);
        if (!group) {
            map.set(key, (group = []));
        }
        group.push(item);
        return map;
    }, new Map<K, T[]>());

    return Array.from(map, ([key, items]) => ({ key, items }));
}
