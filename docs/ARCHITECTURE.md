# Architecture and project conventions

## Organization

The project is organized by feature, with explicit responsibilities inside each feature:

```text
src/
  app/                         Expo Router route entry points and root providers
  components/                  Shared screen primitives and adjacent *.styles.ts
  config/                      Application-wide library configuration
  theme/                       Semantic colors, spacing and Paper theme
  features/
    auth/services/             Native OS authentication boundary
    transfers/
      components/              Presentation and adjacent *.styles.ts
      hooks/                   Form subscriptions, query state and submission workflow
      screens/                 Screen composition and adjacent *.styles.ts
      services/                SQLite ledger and simulated asynchronous transport
      domain/                  Money, validation, types and domain errors
      constants/               Fictional fixtures, shared limits and query keys
__tests__/                     Domain, SQLite and interaction/workflow tests
```

Routes stay thin. Screens compose features; components receive explicit props; hooks own React state/lifecycle; domain modules have no React dependency. SQL and native APIs stay out of presentation. Dependencies point toward domain types, not from domain logic into screens. Local service connection types remain next to the integration that uses them.

Add new domains as features rather than growing a global components/hooks/utils dumping ground. Avoid pass-through wrappers, unused barrel exports, generalized repositories and a second global state framework. Split a component when it has an independently meaningful responsibility, not to meet an arbitrary line limit.

## Native styling

React Native renders native views; regular browser CSS files are not its standard styling mechanism. Use typed `StyleSheet.create` in an adjacent `Component.styles.ts`, semantic tokens from `theme/tokens.ts`, and the shared Paper theme. No static inline JSX styles or component-local style sheets. ESLint enforces the inline-style restriction. Dynamic data-driven avatar colors are calculated in the style module.

This separation is a project convention, not a claim that colocated `StyleSheet` definitions are intrinsically wrong. It makes styles easy to find and keeps render functions focused. Keep accessibility font scaling; avoid fixed text heights and do not disable font scaling to hide layout problems.

References: [React Native styles](https://reactnative.dev/docs/style), [typed StyleSheet](https://reactnative.dev/docs/stylesheet.html).

## Dependency decisions

| Need                 | Choice                                                           | Reason                                                                                    |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Native application   | React Native + Expo native builds                                | Established RN framework and native module tooling; SDK-compatible versions stay together |
| Navigation           | Expo Router / React Navigation                                   | Native stack and file-based route entry points                                            |
| UI components        | React Native Paper                                               | Established native Material components, accessible controls and theming                   |
| Forms                | React Hook Form + Zod                                            | Field subscriptions, clear schema errors and typed input/output                           |
| Async state          | TanStack Query                                                   | Account/history caching, explicit mutations, loading/error states and invalidation        |
| Authentication       | Expo LocalAuthentication                                         | Native Face ID/Touch ID/Android biometrics and system credentials                         |
| Local simulated bank | Expo SQLite                                                      | Atomic integer debit/receipt and durable idempotency references                           |
| System contacts      | Expo Contacts + libphonenumber-js                                | Native permissions and standard phone normalization                                       |
| Verification         | TypeScript, ESLint, Prettier, Jest, React Native Testing Library | Reproducible gates and behavior-focused checks                                            |

These are widely adopted choices appropriate to this scope; we do not claim every package is the single most popular option. Prefer compatibility and established maintenance over chasing the newest version independently. The lockfile pins the resolved tree. Check dependency advisories and native compatibility before SDK upgrades.

TDesign's published React Mobile library targets browser React/ReactDOM, not React Native. It is not used as a native component library. See [TDesign's platform list](https://github.com/Tencent/tdesign) and [React Mobile repository](https://github.com/Tencent/tdesign-mobile-react).

## Payment boundaries

Money is integer sen. The form validates current displayed funds; the ledger independently validates payee identity, amount, note and the debit condition. Review creates a snapshot. Native authorization grants permission for one attempt only. UI locking and lifecycle checks protect submission; SQLite transactions and a unique request key protect debit consistency.

Transport failure after commit is an uncertain outcome, not proof that nothing happened. Retain its reference, block editing/resending and resolve status before another attempt. The local mock can resolve its SQLite ledger after a restart; a real bank implementation needs server authorization, signed transaction challenges, durable server idempotency and reconciliation. Neither a local database nor a successful OS prompt supplies those server guarantees.
