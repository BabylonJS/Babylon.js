
// var compilerTriggerTimeoutID;
// function triggerCompile(d, func) {
//     if (compilerTriggerTimeoutID !== null) {
//         window.clearTimeout(compilerTriggerTimeoutID);
//     }
//     compilerTriggerTimeoutID = window.setTimeout(function () {
//         try {
             
//             var output = transpileModule(d, {
//                 module: ts.ModuleKind.AMD,
//                 target: ts.ScriptTarget.ES5,
//                 noLib: true,
//                 noResolve: true,
//                 suppressOutputPathCheck: true
//             });
//             if (typeof output === "string") {
//                 func(output);
//             }
//         }
//         catch (e) {
//             showError(e.message, e);
//         }
//     }, 100);
// }
// function transpileModule(input, options) {
//     var inputFileName = options.jsx ? "module.tsx" : "module.ts";
//     var sourceFile = ts.createSourceFile(inputFileName, input, options.target || ts.ScriptTarget.ES5);
//     // Output
//     var outputText;
//     var program = ts.createProgram([inputFileName], options, {
//         getSourceFile: function (fileName) { return fileName.indexOf("module") === 0 ? sourceFile : undefined; },
//         writeFile: function (_name, text) { outputText = text; },
//         getDefaultLibFileName: function () { return "lib.d.ts"; },
//         useCaseSensitiveFileNames: function () { return false; },
//         getCanonicalFileName: function (fileName) { return fileName; },
//         getCurrentDirectory: function () { return ""; },
//         getNewLine: function () { return "\r\n"; },
//         fileExists: function (fileName) { return fileName === inputFileName; },
//         readFile: function () { return ""; },
//         directoryExists: function () { return true; },
//         getDirectories: function () { return []; }
//     });
//     // Emit
//     program.emit();
//     if (outputText === undefined) {
//         throw new Error("Output generation failed");
//     }
//     return outputText;
// }

// function getRunCode(jsEditor, callBack) {
//     triggerCompile(jsEditor.getValue(), function(result) {
//         callBack(result + "var createScene = function() { return Playground.CreateScene(engine, engine.getRenderingCanvas()); }")
//     });
// }
