export function ClassNames(names: any, styleObject: any) {
    console.log(styleObject);
    let string = "";
    for (const name in names) {
        if (names[name]) {
            string += styleObject[name] + " ";
        }
    }
    return string;
}
