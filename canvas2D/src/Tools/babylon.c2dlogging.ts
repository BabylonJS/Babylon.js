module BABYLON {
    // logging stuffs
    export class C2DLogging {
        // Set to true to temporary disable logging.
        public static snooze = true;
        public static logFrameRender(frameCount: number) {
            C2DLogging.snooze = true;
            C2DLogging._logFramesCount = frameCount;
        }
        public static setPostMessage(message: () => string) {
            if (C2DLoggingInternals.enableLog) {
                C2DLoggingInternals.postMessages[C2DLoggingInternals.callDepth-1] = message();
            }
        }

        public static _startFrameRender() {
            if (C2DLogging._logFramesCount === 0) {
                return;
            }
            C2DLogging.snooze = false;
        }

        public static _endFrameRender() {
            if (C2DLogging._logFramesCount === 0) {
                return;
            }
            C2DLogging.snooze = true;
            --C2DLogging._logFramesCount;
        }

        private static _logFramesCount = 0;
    }

    class C2DLoggingInternals {
        //-------------FLAG TO CHANGE TO ENABLE/DISABLE LOGGING ACTIVATION--------------
        // This flag can't be changed at runtime you must manually change it in the code
        public static enableLog = false;

        public static callDepth = 0;

        public static depths = [
            "|-", "|--", "|---", "|----", "|-----", "|------", "|-------", "|--------", "|---------", "|----------",
            "|-----------", "|------------", "|-------------", "|--------------", "|---------------", "|----------------", "|-----------------", "|------------------", "|-------------------", "|--------------------"
        ];
        public static postMessages = [];

        public static computeIndent(): string {
            // Compute the indent
            let indent: string = null;
            if (C2DLoggingInternals.callDepth < 20) {
                indent = C2DLoggingInternals.depths[C2DLoggingInternals.callDepth];
            } else {
                indent = "|";
                for (let i = 0; i <= C2DLoggingInternals.callDepth; i++) {
                    indent = indent + "-";
                }
            }
            return indent;
        }

        public static getFormattedValue(a): string {
            if (a instanceof Prim2DBase) {
                return a.id;
            }
            if (a == null) {
                return "[null]";
            }
            return a.toString();
        }
    }

    export function logProp<T>(message: string = "", alsoGet = false, setNoProlog=false, getNoProlog=false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
            if (!C2DLoggingInternals.enableLog) {
                return descriptor;
            }

            let getter = descriptor.get, setter = descriptor.set;

            if (getter && alsoGet) {
                descriptor.get = function (): T {
                    if (C2DLogging.snooze) {
                        return getter.call(this);
                    } else {
                        let indent = C2DLoggingInternals.computeIndent();
                        let id = this.id || "";

                        if (message !== null && message !== "") {
                            console.log(message);
                        }

                        let isSPP = this instanceof SmartPropertyPrim;
                        let flags = isSPP ? this._flags : 0;
                        let depth = C2DLoggingInternals.callDepth;
                        if (!getNoProlog) {
                            console.log(`${indent} [${id}] (${depth}) ==> get ${propName} property`);
                        }
                        ++C2DLoggingInternals.callDepth;
                        C2DLogging.setPostMessage(() => "[no msg]");

                        // Call the initial getter
                        let r = getter.call(this);

                        --C2DLoggingInternals.callDepth;
                        let flagsStr = "";
                        if (isSPP) {
                            let nflags = this._flags;
                            let newFlags = this._getFlagsDebug((nflags & flags) ^ nflags);
                            let removedFlags = this._getFlagsDebug((nflags & flags) ^ flags);
                            flagsStr = "";
                            if (newFlags !== "") {
                                flagsStr = ` +++[${newFlags}]`;
                            }
                            if (removedFlags !== "") {
                                if (flagsStr !== "") {
                                    flagsStr += ",";
                                }
                                flagsStr += ` ---[${removedFlags}]`;
                            }
                        }
                        console.log(`${indent} [${id}] (${depth})${getNoProlog ? "" : " <=="} get ${propName} property => ${C2DLoggingInternals.getFormattedValue(r)}${flagsStr}, ${C2DLoggingInternals.postMessages[C2DLoggingInternals.callDepth]}`);

                        return r;
                    }
                }
            }

            // Overload the property setter implementation to add our own logic
            if (setter) {
                descriptor.set = function (val) {
                    if (C2DLogging.snooze) {
                        setter.call(this, val);
                    } else {
                        let indent = C2DLoggingInternals.computeIndent();
                        let id = this.id || "";

                        if (message !== null && message !== "") {
                            console.log(message);
                        }
                        let isSPP = this instanceof SmartPropertyPrim;
                        let flags = isSPP ? this._flags : 0;
                        let depth = C2DLoggingInternals.callDepth;
                        if (!setNoProlog) {
                            console.log(`${indent} [${id}] (${depth}) ==> set ${propName} property with ${C2DLoggingInternals.getFormattedValue(val)}`);
                        }
                        ++C2DLoggingInternals.callDepth;
                        C2DLogging.setPostMessage(() => "[no msg]");

                        // Change the value
                        setter.call(this, val);

                        --C2DLoggingInternals.callDepth;
                        let flagsStr = "";
                        if (isSPP) {
                            let nflags = this._flags;
                            let newFlags = this._getFlagsDebug((nflags & flags) ^ nflags);
                            let removedFlags = this._getFlagsDebug((nflags & flags) ^ flags);
                            flagsStr = "";
                            if (newFlags !== "") {
                                flagsStr = ` +++[${newFlags}]`;
                            }
                            if (removedFlags !== "") {
                                if (flagsStr !== "") {
                                    flagsStr += ",";
                                }
                                flagsStr += ` ---[${removedFlags}]`;
                            }
                        }
                        console.log(`${indent} [${id}] (${depth})${setNoProlog ? "" : " <=="} set ${propName} property, ${C2DLoggingInternals.postMessages[C2DLoggingInternals.callDepth]}${flagsStr}`);
                    }
                }
            }

            return descriptor;
        }
    }

    export function logMethod(message: string = "", noProlog = false) {
        return (target, key, descriptor) => {
            if (!C2DLoggingInternals.enableLog) {
                return descriptor;
            }

            if (descriptor === undefined) {
                descriptor = Object.getOwnPropertyDescriptor(target, key);
            }
            var originalMethod = descriptor.value;

            //editing the descriptor/value parameter
            descriptor.value = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                if (C2DLogging.snooze) {
                    return originalMethod.apply(this, args);
                } else {
                    var a = args.map(a => C2DLoggingInternals.getFormattedValue(a) + ", ").join();
                    a = a.slice(0, a.length - 2);

                    let indent = C2DLoggingInternals.computeIndent();
                    let id = this.id || "";

                    if (message !== null && message !== "") {
                        console.log(message);
                    }

                    let isSPP = this instanceof SmartPropertyPrim;
                    let flags = isSPP ? this._flags : 0;
                    let depth = C2DLoggingInternals.callDepth;
                    if (!noProlog) {
                        console.log(`${indent} [${id}] (${depth}) ==> call: ${key} (${a})`);
                    }
                    ++C2DLoggingInternals.callDepth;
                    C2DLogging.setPostMessage(() => "[no msg]");

                    // Call the method!
                    var result = originalMethod.apply(this, args);

                    --C2DLoggingInternals.callDepth;
                    let flagsStr = "";
                    if (isSPP) {
                        let nflags = this._flags;
                        let newFlags = this._getFlagsDebug((nflags & flags) ^ nflags);
                        let removedFlags = this._getFlagsDebug((nflags & flags) ^ flags);
                        flagsStr = "";
                        if (newFlags !== "") {
                            flagsStr = ` +++[${newFlags}]`;
                        }
                        if (removedFlags !== "") {
                            if (flagsStr !== "") {
                                flagsStr += ",";
                            }
                            flagsStr += ` ---[${removedFlags}]`;
                        }
                    }
                    console.log(`${indent} [${id}] (${depth})${noProlog ? "" : " <=="} call: ${key} (${a}) Res: ${C2DLoggingInternals.getFormattedValue(result)}, ${C2DLoggingInternals.postMessages[C2DLoggingInternals.callDepth]}${flagsStr}`);

                    return result;
                }
            };

            // return edited descriptor as opposed to overwriting the descriptor
            return descriptor;
        }
        
    }

}