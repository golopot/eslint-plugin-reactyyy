'use strict';

const RuleTester = require('eslint').RuleTester;

const rule = {
  create(context) {
    return {
      FunctionDeclaration(node) {
        console.log(context.getScope().childScopes.map(x => x.type));
      }
    };
  }
};

const parserOptions = {
  ecmaVersion: 2018,
  sourceType: 'module',
  ecmaFeatures: {
    jsx: true
  }
};

const ruleTester = new RuleTester({parserOptions});

ruleTester.run('style-prop-object', rule, {
  valid: [
    {
      code: `
function ff(){
  if (true) {
    aaaa
  }

  for (let a of b) {
    zzzz
  }

  function ggg() {
    bbbb
  }

  try {} catch (e) {}
}
`
    }
  ],
  invalid: []
});
