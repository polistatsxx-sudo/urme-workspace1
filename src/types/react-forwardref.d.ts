import type {
  ForwardRefExoticComponent,
  ForwardRefRenderFunction,
  PropsWithoutRef,
  RefAttributes,
} from 'react';

// The shadcn/ui components in this repo are plain JS, so their render functions
// carry no prop annotations and TypeScript infers `React.forwardRef`'s prop
// generic as `{}` — making every `<Button className=... >` usage an error.
// Defaulting that generic to `any` keeps checkJs useful for the rest of the app.
declare module 'react' {
  function forwardRef<T, P = any>(
    render: ForwardRefRenderFunction<T, P>
  ): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>;
}
