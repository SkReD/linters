const path = require('path');
const _get = require('lodash/get');

const FN_NODE_TYPES = new Set([
    'ArrowFunctionExpression',
    'FunctionDeclaration',
    'MethodDefinition',
    'FunctionExpression',
]);

function getFunctionNode(node) {
    while (!FN_NODE_TYPES.has(node.type)) {
        node = node.parent;
    }

    return node;
}

module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Function with return keyword should specify return type',
            category: 'Stylistic Issues',
            recommended: false,
            url: 'https://github.com/TinkoffCreditSystems/linters',
        },
        messages: {
            typeRequired: 'Function with return keyword should specify return type.',
            returnRequired: 'Function with return type should have return keyword.',
        },
    },
    create(context) {
        const fileExt = path.extname(context.getFilename());

        if (fileExt !== '.ts') {
            return {};
        }

        function createReportMissingType(functionNodeType) {
            return function reportMissingType(returnNode) {
                const {argument: returnArgument} = returnNode;
                const fnNode = getFunctionNode(returnNode);

                if (
                    !returnArgument ||
                    returnArgument.name === 'undefined' ||
                    returnArgument.operator === 'void' ||
                    fnNode.type !== functionNodeType || // Don't fail when return belongs to nested function with different types
                    _get(fnNode, 'returnType.type') === 'TSTypeAnnotation' // Don't fail when return belongs to nested function with same types
                ) {
                    return;
                }

                context.report({
                    node: fnNode,
                    messageId: 'typeRequired',
                });
            };
        }

        return {
            'FunctionDeclaration:not([returnType.type="TSTypeAnnotation"]) ReturnStatement': createReportMissingType(
                'FunctionDeclaration',
            ),
            // MethodDefinition always contains FunctionExpression so we'll check only them
            'MethodDefinition FunctionExpression:not([returnType.type="TSTypeAnnotation"]) ReturnStatement': createReportMissingType(
                'FunctionExpression',
            ),
        };
    },
};
