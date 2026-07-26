---
layout: home

hero:
    name: Stars Components
    text: Build the Star Network
    tagline: Typed, composable packages for Discord interactions, infrastructure, integrations, and testing.
    image:
        src: /logo.svg
        alt: WolfStar
    actions:
        - theme: brand
          text: Get started
          link: /guide/getting-started
        - theme: alt
          text: Explore packages
          link: /packages/

features:
    - icon: ⚡
      title: HTTP-first Discord bots
      details: Handle Discord interactions without a gateway connection and register commands through typed decorators.
      link: /packages/http-framework
    - icon: 🧩
      title: Composable packages
      details: Adopt one focused utility or combine the framework, i18n, shared pieces, and metrics as a complete stack.
      link: /guide/architecture
    - icon: 🧪
      title: Interaction testing
      details: Exercise commands with typed fixtures, a local test harness, and dedicated Vitest matchers.
      link: /guide/testing
    - icon: 🌍
      title: Internationalization
      details: Load locale resources from disk and resolve typed translations for users and guilds.
      link: /packages/http-framework-i18n
    - icon: 🛡️
      title: Safer infrastructure
      details: Parse environment variables, wrap fetch in Result values, and reuse structured logging utilities.
      link: /packages/env-utilities
    - icon: 📚
      title: Searchable API
      details: Browse an API reference generated directly from every public TypeScript export.
      link: /api/
---

## One workspace, fifteen focused packages

Stars Components contains the shared building blocks used across the Star Network. Start with the scaffolding CLI for a
new bot, or add only the utility your project needs.

::: tip Recommended path
Create a project with `pnpm create @wolfstar/http-framework my-bot`, then continue with the
[getting started guide](/guide/getting-started).
:::
