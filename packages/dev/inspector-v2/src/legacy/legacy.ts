// eslint-disable-next-line @typescript-eslint/no-restricted-imports, @typescript-eslint/naming-convention
import * as INSPECTOR from "../index";

(<any>globalThis).BABYLON = (<any>globalThis).BABYLON || {};
(<any>globalThis).BABYLON.Inspector = INSPECTOR.Inspector;
(<any>globalThis).INSPECTOR = INSPECTOR;

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from "../index";
