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
    CLASS: (child, parent, context) => checkBaseComments("CLASS", child, parent, context),
    PROPERTY: checkPropertyComments,
    METHOD: checkMethodComments,
    INTERFACE: (child, parent, context) => checkBaseComments("INTERFACE", child, parent, context),
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

function checkBaseComments(type, child, parent, context) {
    return traverseChildrenLookingForComments(child, parent, context);
}

function isInternal(child) {
    return child.comment?.modifierTags?.find((tag) => tag === "@internal");
}

function getReferenceName(reference) {
    if (!reference) {
        return undefined;
    }

    if (reference.name) {
        return reference.name;
    }

    if (reference.target?.qualifiedName) {
        return reference.target.qualifiedName;
    }

    return undefined;
}

function getReferencedReflection(reference, context) {
    if (!reference) {
        return undefined;
    }

    if (typeof reference.target === "number" && reference.target > 0) {
        return context.reflectionsById.get(reference.target);
    }

    const referenceName = getReferenceName(reference);
    return referenceName ? context.reflectionsByQualifiedName.get(referenceName) : undefined;
}

function getInheritanceReferences(child) {
    return [child.overwrites, child.inheritedFrom, child.implementationOf].filter(Boolean);
}

function getParameters(child) {
    return child.parameters ?? child.signatures?.[0]?.parameters ?? child.type?.declaration?.signatures?.[0]?.parameters ?? [];
}

function inheritedCommentCoversParameters(child, referencedReflection) {
    const childParameters = getParameters(child);
    if (childParameters.length === 0) {
        return true;
    }

    const inheritedParameterNames = new Set(getParameters(referencedReflection).map((param) => param.name));
    return childParameters.every((param) => inheritedParameterNames.has(param.name));
}

function hasCompleteOwnComment(child) {
    if (child.comment) {
        for (const param of getParameters(child)) {
            if (!param.comment) {
                return false;
            }
        }

        return true;
    }

    const signature = child.signatures?.[0] ?? child.type?.declaration?.signatures?.[0];
    return signature ? hasCompleteOwnComment(signature) : false;
}

function hasInheritedComment(child, context, checkedReflections = new Set()) {
    for (const reference of getInheritanceReferences(child)) {
        const referenceName = getReferenceName(reference);
        const referencedReflection = getReferencedReflection(reference, context);

        if (!referencedReflection) {
            // TypeDoc sets target to -1 when the referenced member is outside the model
            // (e.g. a non-exported intermediate base class). Accept those overrides when
            // the override has no parameters, since there is nothing to verify.
            // If target was a valid positive ID but wasn't found in the index, that is an
            // indexing miss — continue checking other inheritance references instead.
            if (typeof reference.target !== "number" || reference.target <= 0) {
                return getParameters(child).length === 0;
            }
            continue;
        }

        const reflectionKey = referencedReflection.id ?? referenceName;
        if (reflectionKey !== undefined) {
            if (checkedReflections.has(reflectionKey)) {
                continue;
            }
            checkedReflections.add(reflectionKey);
        }

        if (
            inheritedCommentCoversParameters(child, referencedReflection) &&
            (hasCompleteOwnComment(referencedReflection) || hasInheritedComment(referencedReflection, context, checkedReflections))
        ) {
            return true;
        }
    }

    return false;
}

function traverseChildrenLookingForComments(child, parent, context) {
    if (!child) {
        return;
    }
    const source = child.sources?.[0] ?? parent?.sources?.[0];
    const result = {
        componentName: child.name,
        componentType: getKind(child),
        parentName: parent?.name,
        fileName: source ? `${source.fileName}:${source.line}:${source.character}` : undefined,
        url: source?.url,
    };
    if (!source) {
        result.result = TestResultType.PASS;
        return result;
    }
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
    } else if (hasInheritedComment(child, context)) {
        result.result = TestResultType.PASS;
        return result;
    } else if (child.signatures || child.type?.declaration?.signatures) {
        const signatureResult = traverseChildrenLookingForComments(child.signatures?.length > 0 ? child.signatures[0] : child.type.declaration.signatures[0], parent, context);
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

function checkPropertyComments(child, parent, context) {
    if (isVisible(child, parent)) {
        return traverseChildrenLookingForComments(child, parent, context);
    }
}

function checkMethodComments(child, parent, context) {
    if (isVisible(child, parent)) {
        return traverseChildrenLookingForComments(child, parent, context);
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

function collectReflections(child, parent, context) {
    if (!child) {
        return;
    }

    if (child.id !== undefined) {
        context.reflectionsById.set(child.id, child);
    }

    if (parent?.name) {
        context.reflectionsByQualifiedName.set(`${parent.name}.${child.name}`, child);
    }

    if (child.children) {
        child.children.forEach((grandchild) => collectReflections(grandchild, child, context));
    }

    if (child.signatures) {
        child.signatures.forEach((signature) => collectReflections(signature, child, context));
    }
}

function createContext(data) {
    const context = {
        reflectionsById: new Map(),
        reflectionsByQualifiedName: new Map(),
    };

    collectReflections(data, null, context);
    return context;
}

// Define a recursive function to iterate over the children
function checkCommentsOnChild(child, parent, namesToCheck = [], context) {
    if (isInternal(child)) return [];
    const errors = [];
    // Check if the child is a declaration
    if ((namesToCheck.length === 0 || namesToCheck.includes(child.name)) && !sourceInNodeModules(child)) {
        const childKind = getKind(child);
        if (childKind in kindToCheckFunction) {
            addErrorToArray(kindToCheckFunction[childKind](child, parent, context), errors);
        }
    }

    // If the child has its own children, recursively call this function on them
    if (child.children) {
        child.children.forEach((grandchild) => addErrorToArray(checkCommentsOnChild(grandchild, child, namesToCheck, context), errors));
    }
    // console.log(errors.flat().filter((e) => e.result !== TestResultType.PASS));
    return errors.flat().filter((e) => e.result !== TestResultType.PASS);
}

export const commentAnalyzer = (data, namesToCheck = []) => {
    return checkCommentsOnChild(data, null, namesToCheck, createContext(data));
};
