---
applyTo: "packages/dev/**/*.{ts,tsx},packages/tools/**/*.{ts,tsx}"
---

# React Conventions

## Component Declaration

Always explicitly declare function components using `FunctionComponent` (or `FC`) from React, with a named props type or inline type. Do not use implicit return types or untyped arrow functions for components.

```tsx
// ✅ Good
const MyComponent: FunctionComponent<MyComponentProps> = (props) => {
    const { value, onChange } = props;
    // ...
};

// ❌ Bad — no explicit FunctionComponent type
const MyComponent = (props: MyComponentProps) => {
    // ...
};

// ❌ Bad — using function declaration without FunctionComponent
function MyComponent(props: MyComponentProps) {
    // ...
}
```

## Props Destructuring

Destructure props on the first line of the component body, not inline in the parameter list. This keeps the component signature clean and makes it easy to see all consumed props at a glance.

```tsx
// ✅ Good — destructure on the first line of the body
const MyComponent: FunctionComponent<MyComponentProps> = (props) => {
    const { title, value, onChange, children } = props;
    // ...
};

// ❌ Bad — destructuring inline in the parameter
const MyComponent: FunctionComponent<MyComponentProps> = ({ title, value, onChange, children }) => {
    // ...
};
```
