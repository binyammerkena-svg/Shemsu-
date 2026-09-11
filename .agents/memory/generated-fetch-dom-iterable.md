---
name: Generated fetch DOM iterable types
description: TypeScript settings needed by Orval-generated browser fetch clients
---

Generated API clients use `Headers.entries()`. Any shared client library that compiles those files needs both `dom` and `dom.iterable` in its TypeScript `lib` list.

**Why:** The generated client can be valid at runtime but fail the workspace typecheck when iterable DOM types are omitted.

**How to apply:** When generated fetch helpers report missing `Headers` iterable methods, fix the library compiler settings rather than editing generated output.