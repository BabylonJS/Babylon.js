import { PropertyLine } from "./propertyLine";
import { useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { NumberInputPropertyLineProps } from "./inputPropertyLine";
import { TextInput } from "../../primitives/textInput";

export type HexPropertyLineProps = NumberInputPropertyLineProps & {
    numBits?: 32 | 24 | 16 | 8;
};

const MaskValidatorFn = (valueString: string) => {
    if (valueString.substring(0, 2) != "0x") {
        if (valueString.substring(0, 1) != "0") {
            valueString = "0x" + valueString;
        } else {
            valueString = "0x" + valueString.substring(1);
        }
    }

    const valueSubstr = valueString.substring(2);
    if (valueSubstr != "" && /^[0-9A-Fa-f]+$/g.test(valueSubstr) == false) {
        return false;
    }

    if (valueString.length > 10) {
        return false;
    }

    return true;
};

const GetHexValFromNumber = (val: number, numBits?: number): string => {
    const numDigits = (numBits ?? 32) >> 2;
    let valueAsHex = val.toString(16);
    let hex0String = "";
    for (let i = 0; i < numDigits - valueAsHex.length; i++) {
        // padding the '0's
        hex0String = "0" + hex0String;
    }
    const finalHexValue = hex0String + valueAsHex;
    valueAsHex = "0x" + finalHexValue.substring(finalHexValue.length - numDigits);
    return valueAsHex;
};

/**
 * Takes a number representing a Hex value and converts it to a hex string then wraps the TextInput in a PropertyLine
 * @param props - PropertyLineProps
 * @returns property-line wrapped textbox that converts to/from hex number representation
 */
export const HexPropertyLine: FunctionComponent<HexPropertyLineProps> = (props) => {
    HexPropertyLine.displayName = "HexPropertyLine";
    const [hexVal, setHexVal] = useState(GetHexValFromNumber(props.value, props.numBits));

    const onStrValChange = (val: string) => {
        const numBits = props.numBits ?? 32;
        setHexVal(val);
        props.onChange(parseInt(val) & (2 ** numBits - 1));
    };

    useEffect(() => {
        setHexVal(GetHexValFromNumber(props.value, props.numBits));
    }, []);

    return (
        <PropertyLine {...props}>
            <TextInput {...props} validator={MaskValidatorFn} value={hexVal} onChange={onStrValChange} validateOnlyOnBlur={true} />
        </PropertyLine>
    );
};
