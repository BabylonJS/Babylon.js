// import * as React from "react";
// import { ValueAndUnit } from "gui/2D/valueAndUnit";
// import { conflictingValuesPlaceholder } from "shared-ui-components/lines/targetsProxy";
// import { ITextInputLineComponentProps, TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
// import { CoordinateHelper, DimensionProperties } from "gui-editor/diagram/coordinateHelper";
// import { Observable } from "core/Misc/observable";

// interface IFloatWithUnitsProps extends ITextInputLineComponentProps {
//     targets: any[];
//     propertyName: string;
// }

// // eslint-disable-next-line @typescript-eslint/naming-convention
// export const FloatWithUnitsComponent = (props: IFloatWithUnitsProps) => {
//     const { targets, propertyName, onPropertyChangedObservable } = props;
//     const getValue = () => {
//         const values = targets.map((target) => target[propertyName]._value);
//         const firstValue = values[0];
//         if (values.every((value: any) => value === firstValue)) {
//             const units = getUnitString();
//             if (units === "%") {
//                 return (firstValue * 100).toFixed(2);
//             } else if (units === "PX") {
//                 return firstValue.toFixed(2);
//             } else {
//                 return conflictingValuesPlaceholder;
//             }
//         } else {
//             return conflictingValuesPlaceholder;
//         }
//     };
//     const getUnitString = () => {
//         const units = targets.map((target) => target[propertyName]._unit);
//         const firstUnit = units[0];
//         if (units.every((unit: any) => unit === firstUnit)) {
//             if (firstUnit === ValueAndUnit.UNITMODE_PIXEL) {
//                 return "PX";
//             } else {
//                 return "%";
//             }
//         } else {
//             return conflictingValuesPlaceholder;
//         }
//     };
//     const increment = (amount: number, minimum?: number, maximum?: number) => {
//         for (const target of targets) {
//             const initialValue = target[propertyName];
//             const initialUnit = target["_" + propertyName]._unit;
//             let newValue: number = target[`${propertyName}InPixels`] + amount;
//             if (minimum !== undefined && newValue < minimum) newValue = minimum;
//             if (maximum !== undefined && newValue > maximum) newValue = maximum;
//             target[`${propertyName}InPixels`] = newValue;
//             if (initialUnit === ValueAndUnit.UNITMODE_PERCENTAGE) {
//                 CoordinateHelper.convertToPercentage(target, [propertyName]);
//             }
//             onPropertyChangedObservable?.notifyObservers({
//                 object: control,
//                 property: propertyName,
//                 initialValue: initialValue,
//                 value: control[propertyName],
//             });
//         }
//     };
//     const convertUnits = (unit: string, property: DimensionProperties) => {
//         for (const target of targets) {
//             if (unit === "PX") {
//                 CoordinateHelper.convertToPercentage(target, [property], this.props.onPropertyChangedObservable);
//             } else {
//                 CoordinateHelper.convertToPixels(target, [property], this.props.onPropertyChangedObservable);
//             }
//         }
//     };

//     return (
//         <TextInputLineComponent
//             numbersOnly={true}
//             delayInput={true}
//             value={getValue(props.targets, "_left")}
//             onChange={(newValue) => checkAndUpdateValues(props.targets, "left", newValue)}
//             unit={getUnitString(props.targets, "_left")}
//             onUnitClicked={(unit) => convertUnits(unit, "left")}
//             arrows={true}
//             arrowsIncrement={(amount) => increment("left", amount)}
//             {...props}
//         />
//     );
// };
