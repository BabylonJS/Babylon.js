/**
 * Script to parse the JSON output of TypeDoc
 * and check for missing comments on public
 * members.
 * @see https://github.com/TypeStrong/typedoc/blob/master/src/lib/models/reflections/kind.ts#L7
 */
const KINDS = {
    0x1: "PROJECT",
    0x2: "MODULE",
    0x4: "NAMESPACE",
    0x8: "ENUM",
    0x10: "ENUM_MEMBER",
    0x20: "VARIABLE",
    0x40: "FUNCTION",
    0x80: "CLASS",
    0x100: "INTERFACE",
    0x200: "CONSTRUCTOR",
    0x400: "PROPERTY",
    0x800: "METHOD",
    0x1000: "CALL_SIGNATURE",
    0x2000: "INDEX_SIGNATURE",
    0x4000: "CONSTRUCTOR_SIGNATURE",
    0x8000: "PARAMETER",
    0x10000: "TYPE_LITERAL",
    0x20000: "TYPE_PARAMETER",
    0x40000: "ACCESSOR",
    0x80000: "GET_SIGNATURE",
    0x100000: "SET_SIGNATURE",
    0x200000: "TYPE_ALIAS",
    0x400000: "REFERENCE",
};

const kindToCheckFunction = {
    CLASS: (child, parent) => checkBaseComments("CLASS", child, parent),
    PROPERTY: checkPropertyComments,
    METHOD: checkMethodComments,
    INTERFACE: (child, parent) => checkBaseComments("INTERFACE", child, parent),
};

const TestResultType = {
    PASS: "PASS",
    MISSING_COMMENT: "Missing comment",
    MISSING_PARAM_COMMENT: "Missing param documentation",
};

function getKind(child) {
    const kind = KINDS[child.kind];
    if (kind === undefined) {
        throw new Error(`Unknown kind: ${child.kind}`);
    }
    return kind;
}

function checkBaseComments(type, child, parent) {
    return traverseChildrenLookingForComments(child, parent);
}

function isInternal(child) {
    return child.comment?.modifierTags?.find((tag) => tag === "@internal");
}

function traverseChildrenLookingForComments(child, parent, isSignature = false) {
    if (!child) {
        return;
    }
    const result = {
        componentName: child.name,
        componentType: getKind(child),
        parentName: parent?.name,
        fileName: child.sources[0]?.fileName + ":" + child.sources[0]?.line + ":" + child.sources[0]?.character,
        url: child.sources[0]?.url,
    };
    // underscored names are ignored
    if (child.name.startsWith("_")) {
        result.result = TestResultType.PASS;
        return result;
    }
    if (isInternal(child)) {
        result.result = TestResultType.PASS;
        return result;
    }
    // check if parent is a class and this is a method
    if (isInternal(parent) && (getKind(parent) === "CLASS" || getKind(parent) === "INTERFACE") && !child.comment) {
        result.result = TestResultType.PASS;
        return result;
    }
    if (child.comment) {
        if (child.parameters) {
            result.missingParamNames = result.missingParamNames || [];
            for (const param of child.parameters) {
                if (!param.comment) {
                    result.missingParamNames.push(param.name);
                    result.result = TestResultType.MISSING_PARAM_COMMENT;
                }
            }
            if (result.result === TestResultType.MISSING_PARAM_COMMENT) return result;
        }
        result.result = TestResultType.PASS;
        return result;
    } else if (child.signatures || child.type?.declaration?.signatures) {
        const signatureResult = traverseChildrenLookingForComments(child.signatures?.length > 0 ? child.signatures[0] : child.type.declaration.signatures[0], parent, true);
        // const signatureResults = child.signatures[0]
        //     .map((sig) => traverseChildrenLookingForComments(sig, parent, true))
        //     .flat()
        //     .filter((sigResult) => {
        //         return sigResult.result !== TestResultType.PASS;
        //     });
        return signatureResult;
    }
    result.result = TestResultType.MISSING_COMMENT;
    return result;
}

function isVisible(child, parent) {
    const parentKind = getKind(parent);
    return child.flags.isPublic || (!child.flags.isPrivate && !child.flags.isProtected && parentKind === "INTERFACE");
}

function checkPropertyComments(child, parent) {
    if (isVisible(child, parent)) {
        return traverseChildrenLookingForComments(child, parent);
    }
}

function checkMethodComments(child, parent) {
    if (isVisible(child, parent)) {
        return traverseChildrenLookingForComments(child, parent);
    }
}

function sourceInNodeModules(child) {
    return child.sources && child.sources[0].fileName.includes("node_modules");
}

function addErrorToArray(error, errorArray) {
    if (error) {
        errorArray.push(error);
    }
    // console.log(error);
}

// Define a recursive function to iterate over the children
function checkCommentsOnChild(child, parent, namesToCheck = []) {
    if (isInternal(child)) return [];
    const errors = [];
    // Check if the child is a declaration
    if ((namesToCheck.length === 0 || namesToCheck.includes(child.name)) && !sourceInNodeModules(child)) {
        const childKind = getKind(child);
        if (childKind in kindToCheckFunction) {
            addErrorToArray(kindToCheckFunction[childKind](child, parent), errors);
        }
    }

    // If the child has its own children, recursively call this function on them
    if (child.children) {
        child.children.forEach((grandchild) => addErrorToArray(checkCommentsOnChild(grandchild, child, namesToCheck), errors));
    }
    // console.log(errors.flat().filter((e) => e.result !== TestResultType.PASS));
    return errors.flat().filter((e) => e.result !== TestResultType.PASS);
}

/**
 * Given a JSON data object, check for missing comments on public members.
 * @param {*} data the JSON data that is output from typedoc
 */
module.exports = {
    commentAnalyzer: function (data, namesToCheck = []) {
        return checkCommentsOnChild(data, null, namesToCheck);
    },
};
