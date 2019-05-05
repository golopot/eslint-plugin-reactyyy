# Disallow unnecessary fragments (react/jsx-no-useless-fragment)

A fragment is redundant if it contains only one child, or if it is the child of a html element.

**Fixable:** This rule is sometimes automatically fixable using the `--fix` flag on the command line.

## Rule Details

The following patterns are considered warnings:

```jsx
<>foo</>

<>{foo}</>

<><Foo /></>

<></>

<Fragment>foo</Fragment>

<React.Fragment>foo</React.Fragment>

<section>
  <>
    <div />
    <div />
  </>
</section>
```

The following patterns are **not** considered warnings:

```jsx
<>
  <Foo />
  <Bar />
</>

<>foo {bar}</>

<> {foo}</>

<SomeComponent>
  <>
    <div />
    <div />
  </>
</SomeComponent>
```
