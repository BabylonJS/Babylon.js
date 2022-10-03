export function ClassNames(names: any, styleObject: any) {
    let string = "";
    for (const name in names) {
        if (names[name]) {
            string += styleObject[name] + " ";
        }
    }
    return string;
}

export function JoinClassNames(styleObject: any, ...names: string[]) {
    let string = "";
    for (const name of names) {
        if (name && styleObject[name]) {
            string += styleObject[name] + " ";
        }
    }
    return string;
}
