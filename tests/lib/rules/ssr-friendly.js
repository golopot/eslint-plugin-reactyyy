/**
 * @fileoverview
 */

'use strict';

const RuleTester = require('eslint').RuleTester;
const rule = require('../../../lib/rules/ssr-friendly');
const parsers = require('../../helpers/parsers');

const parserOptions = {
  ecmaVersion: 2018,
  sourceType: 'module',
  ecmaFeatures: {
    jsx: true
  }
};

const ruleTester = new RuleTester({parserOptions});
ruleTester.run('ssr-friendly', rule, {
  valid: [
    {
      code: `
function Foo() {
  function handleClick() {
    window.alert();
  }
  return <button onClick={handleClick} />;
}
`
    },
    {
      code: `
function Foo() {
  [1, 2, 3].forEach(x => {
    window.a(x);
  });
  return <p />;
}
`
    },

    {
      code: `
class Foo extends Component {
  handleClick() {
    window.alert();
  }
  handleMouseOver = () => {
    window.alert();
  }
  render() {
    return <button onClick={this.handleClick} onMouseOver={this.handleMouseOver} />;
  }
}
`,
      parser: parsers.BABEL_ESLINT
    }
  ],

  invalid: [
    {
      code: `
function Foo() {
  window.a();
  document.b();
  if (window) {}
  if (window.fetch) {}
  if (typeof window) {}
  return <p />;
}
`,
      errors: [
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        }
      ]
    },
    {
      code: `
function Foo() {
  document.addEventlistener('click', console.log);
  return <p></p>;
}
`,
      errors: [
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        }
      ]
    },
    {
      code: `
class Foo extends Component {
  constructor() {
    window.a()
  }
  render() {
    window.b()
  }
}
      `,
      errors: [
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        }
      ]
    },
    {
      code: `
class Foo extends Component {
  constructor() {
    window.a();
  }
  render()  {
    window.b();
  }
  static getDerivedStateFromProps() {
    window.c();
  }
}
      `,
      errors: [
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        },
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        }
      ]
    },

    {
      code: `
function Foo() {
  if (true) {
    window.a();
  }
  return <p />;
}
`,
      errors: [
        {
          message: 'Reference to browser global is not allowed here.',
          node: 'Identifier'
        }
      ]
    }
  ]
});
