export function ClassNames(names: any, styleObject: any) {
    let string = "";
    for (const name in names) {
        if (names[name]) {
            string += styleObject[name] + " ";
        }
    }
    return string;
}
