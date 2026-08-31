<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/twitch-helpers

**Twitch helper functions shared across Star Network bots.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/twitch-helpers)](https://npmx.dev/package/@wolfstar/twitch-helpers)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/twitch-helpers)](https://npmx.dev/package/@wolfstar/twitch-helpers)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

Very basic Twitch helper functions for several Star bots to ensure we do not duplicate code.

## Installation

You can use the following command to install this package, or replace `npm install` with your package
manager of choice.

```sh
npm install @wolfstar/twitch-helpers
```

## Features

- Powered by the `@wolfstar/safe-fetch` package

## Usage

First of all, you should make sure to define the following environment variables for your process:

- `TWITCH_CLIENT_ID`: The Client ID of your Twitch application (generated at [Twitch Dev Console](https://dev.twitch.tv/console/apps/))
- `TWITCH_CLIENT_SECRET`: The Client Secret from your Twitch application (generated at [Twitch Dev Console](https://dev.twitch.tv/console/apps/))
- `TWITCH_EVENT_SUB_CALLBACK`: A public HTTP callback URL that can be used for the [Twitch EventSub](https://dev.twitch.tv/docs/eventsub)
- `TWITCH_EVENT_SUB_SECRET`: A unique secret key that is sent to the EventSub system and returned by Twitch then used to validate whether a request is from Twitch or not.

After this, you can use the functions exported from this package to interact with the Twitch API.
