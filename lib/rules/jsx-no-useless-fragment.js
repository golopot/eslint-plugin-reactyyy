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
 * @param {ASTNode} node
 * @returns {boolean}
 */
function isJSXTextOrJSXCurly(node) {
  return isJSXText(node) || node.type === 'JSXExpressionContainer';
}

/**
 * @param {string} text
 */
function isOnlyWhitespace(text) {
  return text.trim().length === 0;
}

/**
 * @param {string} text
 * @returns {string}
 */
function trimLikeReact(text) {
  const leadingSpaces = /^\s*/.exec(text)[0];
  const trailingSpaces = /\s*$/.exec(text)[0];

  const start = leadingSpaces.includes('\n') ? leadingSpaces.length : 0;
  const end = trailingSpaces.includes('\n') ? text.length - trailingSpaces.length : text.length;

  return text.slice(start, end);
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
        (+isPaddingSpaces(node.children[0])) -
        (+isPaddingSpaces(node.children[node.children.length - 1]))
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
     * @param {ASTNode} node
     * @returns {boolean}
     */
    function canFix(node) {
      // Fragments that are child elements can always be fixed
      if (!(node.parent.type === 'JSXElement' || node.parent.type === 'JSXFragment')) {
        // const a = <></>
        if (node.children.length === 0) {
          return false;
        }

        // const a = <>cat {meow}</>
        if (node.children.some(isJSXTextOrJSXCurly)) {
          return false;
        }
      }

      return true;
    }

    /**
     * @param {ASTNode} node
     * @returns {((fixer: object) => object) | undefined}
     */
    function getFix(node) {
      if (!canFix(node)) {
        return undefined;
      }

      return function fix(fixer) {
        const opener = node.type === 'JSXFragment' ? node.openingFragment : node.openingElement;
        const closer = node.type === 'JSXFragment' ? node.closingFragment : node.closingElement;
        const childrenText = context.getSourceCode().getText().slice(opener.range[1], closer.range[0]);

        return fixer.replaceText(node, trimLikeReact(childrenText));
      };
    }

    function checkNode(node) {
      if (isKeyedElement(node)) {
        return;
      }

      if (hasLessThanTwoChildren(node)) {
        context.report({
          node,
          messageId: 'NeedsMoreChidren',
          fix: getFix(node)
        });
      }

      if (isChildOfHtmlElement(node)) {
        context.report({
          node,
          messageId: 'ChildOfHtmlElement',
          fix: getFix(node)
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
