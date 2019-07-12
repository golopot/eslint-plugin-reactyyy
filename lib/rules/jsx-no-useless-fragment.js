/**
 * @fileoverview Disallow useless fragments
 */

'use strict';

const pragmaUtil = require('../util/pragma');
const jsxUtil = require('../util/jsx');
const docsUrl = require('../util/docsUrl');


module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Disallow unnecessary fragments',
      category: 'Possible Errors',
      recommended: false,
      url: docsUrl('jsx-no-useless-fragment')
    },
    messages: {
      NeedsMoreChidren: 'Fragments should contain more than one child - otherwise, there‘s no need for a Fragment at all.',
      ChildOfHtmlElement: 'Passing a fragment to an HTML element is useless.'
    }
  },

  create(context) {
    const reactPragma = pragmaUtil.getFromContext(context);
    const fragmentPragma = pragmaUtil.getFragmentFromContext(context);

    /**
     * Test whether a node is an padding spaces trimmed by react runtime.
     * @param {ASTNode} node
     * @returns {boolean}
     */
    function isPaddingSpaces(node) {
      return (node.type === 'JSXText' || node.type === 'Literal') &&
        /^\s*$/.test(node.raw) &&
        node.raw.includes('\n');
    }

    /**
     * Test whether a JSXElement has less than two children, excluding paddings spaces.
     * @param {JSXElement|JSXFragment} node
     */
    function hasLessThanTwoChildren(node) {
      if (node.children.length < 2) {
        return true;
      }

      return (
        node.children.length -
        Number(isPaddingSpaces(node.children[0])) -
        Number(isPaddingSpaces(node.children[node.children.length - 1]))
      ) < 2;
    }

    /**
     * @param {JSXElement|JSXFragment} node
     * @returns {boolean}
     */
    function isChildOfHtmlElement(node) {
      return node.parent.type === 'JSXElement' &&
        node.parent.openingElement.name.type === 'JSXIdentifier' &&
        /^[a-z]+$/.test(node.parent.openingElement.name.name);
    }

    function isJSXText(node) {
      return !!node && (node.type === 'JSXText' || node.type === 'Literal');
    }

    /**
     * Avoid fixing case like:
     * ```jsx
     * <div>
     *   pine<>
     *     apple
     *   </>
     * </div>
     * ```
     * @param {JSXElement|JSXFragment} node
     * @returns {boolean}
     */
    function isSafeToFix(node) {
      if (!node.parent.children) {
        return false;
      }

      const i = node.parent.children.indexOf(node);
      const previousChild = node.parent.children[i - 1];
      const nextChild = node.parent.children[i + 1];

      return (
        (!isJSXText(previousChild) || /\s$/.test(previousChild.value)) &&
        (!isJSXText(nextChild) || /^\s/.test(nextChild.value))
      );
    }

    function fix(node, fixer) {
      return node.type === 'JSXFragment' ?
        [
          fixer.remove(node.openingFragment),
          fixer.remove(node.closingFragment)
        ] :
        [
          fixer.remove(node.openingElement),
          fixer.remove(node.closingElement)
        ];
    }

    function checkNode(node) {
      if (hasLessThanTwoChildren(node)) {
        context.report({
          node,
          messageId: 'NeedsMoreChidren',
          fix: isSafeToFix(node) ? (fixer => fix(node, fixer)) : null
        });
      }

      if (isChildOfHtmlElement(node)) {
        context.report({
          node,
          messageId: 'ChildOfHtmlElement',
          fix: isSafeToFix(node) ? (fixer => fix(node, fixer)) : null
        });
      }
    }

    return {
      JSXElement(node) {
        if (jsxUtil.isFragment(node, reactPragma, fragmentPragma)) {
          checkNode(node);
        }
      },
      JSXFragment: checkNode
    };
  }
};
