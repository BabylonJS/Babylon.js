// > This worker will analyze the syntaxtree and return an array of tagged functions, like experimental or deprecated ones (but the goal is to do more in the future!)
// We need to do this because:
// - checking extended properties during completion is time consuming, so we need to prefilter potential candidates
// - we don't want to maintain a static list of members or to instrument this work on the CI
// - we have more plans involving syntaxtree analysis
// > This worker was carefully crafted to work even if the processing is super fast or super long. 
// In both cases the completion filter will start working after the worker is done.
// We will also need this worker in the future to compute Intellicode scores for completion using dedicated attributes.

// see monacoCreator.js/setupDefinitionWorker

// monaco is using 'define' for module dependencies and service lookup.
// hopefully typescript is self-contained
var ts = null;
var define = (id, dependencies, callback) => ts = callback();

importScripts("https://unpkg.com/monaco-editor@0.20.0/dev/vs/language/typescript/lib/typescriptServices.js");

const supportedTags = new Set(['deprecated', 'beta', 'experimental']);
var tagCandidates = [];

// optimize syntaxtree visitor, we don't care about non documented nodes
function canHaveJsDoc(node) {
    const kind = node.kind;
    switch (kind) {
        case ts.SyntaxKind.Parameter:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.PropertySignature:
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.ParenthesizedExpression:
        case ts.SyntaxKind.SpreadAssignment:
        case ts.SyntaxKind.ShorthandPropertyAssignment:
        case ts.SyntaxKind.PropertyAssignment:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.LabeledStatement:
        case ts.SyntaxKind.ExpressionStatement:
        case ts.SyntaxKind.VariableStatement:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.ClassExpression:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.ModuleDeclaration:
        case ts.SyntaxKind.ImportEqualsDeclaration:
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.ConstructorType:
        case ts.SyntaxKind.JSDocFunctionType:
        case ts.SyntaxKind.EndOfFileToken:
        case ts.SyntaxKind.ExportDeclaration:
            return true;
        default:
            return false;
    }
}

function onFindCandidate(node, tag) {
    const name = relatedName(node);
    if (name)
        tagCandidates.push({name: name, tagName: tag.tagName.escapedText});
}

function relatedName(node) {
    if (canHaveJsDoc(node) && node.name)
        return node.name.escapedText;

    if (node.parent)
        return relatedName(node.parent);

    return undefined;
}

function visit(node) {

    if (node.jsDoc) {
        for (const jsDocEntry of node.jsDoc) {
            if (jsDocEntry.tags) {
                for (const tag of jsDocEntry.tags) {
                    if (isCandidate(tag))
                        onFindCandidate(node, tag);
                }
            }
        }
    }

    ts.forEachChild(node, visit);
}

function isCandidate(tag) {
    return tag.tagName && supportedTags.has(tag.tagName.escapedText);
}

function processDefinition(code) {
    if (tagCandidates.length == 0) {
        const sourceFile = ts.createSourceFile('babylon.js', code, ts.ScriptTarget.ESNext, true);
        ts.forEachChild(sourceFile, visit);
    }

    self.postMessage({ result: tagCandidates });
}

self.addEventListener('message', event => {
    const { code } = event.data;
    processDefinition(code);
});
