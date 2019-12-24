// monaco is using 'define' for module dependencies and service lookup.
// hopefully typescript is self-contained
var ts = null;
var define = (id, dependencies, callback) => ts = callback();

importScripts("../node_modules/monaco-editor/dev/vs/language/typescript/lib/typescriptServices.js");

// store deprecated names
var deprecatedCandidates = [];

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

function onFindDeprecatedCandidate(node) {
    const name = relatedName(node);
    if (name)
        deprecatedCandidates.push(name);
}

function relatedName(node) {
    if (canHaveJsDoc(node) && node.name)
        return node.name.escapedText;

    if (node.parent)
        return relatedName(parent);

    return undefined;
}

function visit(node) {

    if (node.jsDoc) {
        for (const jsDocEntry of node.jsDoc) {
            if (jsDocEntry.tags) {
                for (const tag of jsDocEntry.tags) {
                    if (tag.tagName && tag.tagName.escapedText == 'deprecated')
                        onFindDeprecatedCandidate(node);
                }
            }
        }
    }

    ts.forEachChild(node, visit);
}

function processDefinition(code) {
    if (deprecatedCandidates.length == 0) {
        const sourceFile = ts.createSourceFile('babylon.js', code, ts.ScriptTarget.ESNext, true);
        ts.forEachChild(sourceFile, visit);
    }

    self.postMessage({ result: deprecatedCandidates });
}

self.addEventListener('message', event => {
    const { code } = event.data;
    processDefinition(code);
});