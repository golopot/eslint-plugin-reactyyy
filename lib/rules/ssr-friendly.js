/**
 * @fileoverview Disallow patterns problematic for server-side rendering.
 */

'use strict';

const Components = require('../util/Components');
const docsUrl = require('../util/docsUrl');

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

/**
 * @param {string} name
 * @returns {boolean}
 */
function isBrowserGlobal(name) {
  switch (name) {
    case 'window':
    case 'document':
      return true;
    default:
      return false;
  }
}

/**
 * Check if a function is a life cycle method that may be executed in SSR.
 * @param {object} utils Component utils
 * @param {ASTNode} node Expecting a function node
 * @return {boolean}
 */
function isSSRLifeCycle(utils, node) {
  return (
    node.parent.type === 'MethodDefinition' &&
    !node.parent.computed &&
    node.parent.key.type === 'Identifier' &&
    ['constructor', 'render', 'getDerivedStateFromProps'].indexOf(
      node.parent.key.name
    ) !== -1 &&
    utils.isES6Component(node.parent.parent.parent)
  );
}

module.exports = {
  meta: {
    docs: {
      description: 'Disallow patterns problematic for server-side rendering',
      category: 'Best Practices',
      recommended: false,
      url: docsUrl('ssr-friendly')
    }
  },

  create: Components.detect((context, components, utils) => {
    function checkUnlawfulReferences(scope) {
      for (const reference of scope.references) {
        if (isBrowserGlobal(reference.identifier.name)) {
          context.report({
            node: reference.identifier,
            message: 'Reference to browser global is not allowed here.'
          });
        }
      }

      for (const childScope of scope.childScopes) {
        if (childScope.type !== 'function') {
          checkUnlawfulReferences(childScope);
        }
      }
    }

    return {
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        if (
          !utils.getStatelessComponent(node) &&
          !isSSRLifeCycle(utils, node)
        ) {
          return;
        }

        const scope = context.getScope();
        checkUnlawfulReferences(scope);
      }
    };
  })
};
