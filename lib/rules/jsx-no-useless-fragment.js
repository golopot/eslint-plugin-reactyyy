/**
 * @fileoverview Disallow useless fragments
 */

'use strict';

const pragmaUtil = require('../util/pragma');
const jsxUtil = require('../util/jsx');
const docsUrl = require('../util/docsUrl');

function isJSXText(node) {
  return !!node && (node.type === 'JSXText' || node.type === 'Literal');
}

/**
 * @param {string} text
 */
function isOnlyWhitespace(text) {
  return text.trim().length === 0;
}

/**
 * Test if node is like `<Fragment key={_}>_</Fragment>`
 * @param {JSXElement} node
 * @returns {boolean}
 */
function isKeyedElement(node) {
  return node.type === 'JSXElement' &&
    node.openingElement.attributes &&
    node.openingElement.attributes.some(attribute => (
      attribute.type === 'JSXAttribute' &&
      attribute.name &&
      attribute.name.type === 'JSXIdentifier' &&
      attribute.name.name === 'key'
    ));
}

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
      return isJSXText(node) &&
        isOnlyWhitespace(node.raw) &&
        node.raw.includes('\n');
    }

    /**
     * Test whether a JSXElement has less than two children, excluding paddings spaces.
     * @param {JSXElement|JSXFragment} node
     */
    function hasLessThanTwoChildren(node) {
      if (!node || !node.children || node.children.length < 2) {
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

    /**
     * Avoid fixing cases that involve tricky whitespaces changes like:
     * ```jsx
     * <div>
     *   pine<>
     *     apple
     *   </>
     * </div>
     * ```
     * Give up fixing if one neighboring node is JSXText and is not only whitespaces
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

      if (
        (isJSXText(previousChild) && !isOnlyWhitespace(previousChild.value)) ||
        (isJSXText(nextChild) && !isOnlyWhitespace(nextChild.value))
      ) {
        return false;
      }

      return true;
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
      if (isKeyedElement(node)) {
        return;
      }

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
