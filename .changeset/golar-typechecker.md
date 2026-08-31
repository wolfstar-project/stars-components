---
'basic': patch
'with-i18n': patch
'with-subcommands': patch
'with-testing': patch
'@wolfstar/create-http-framework': patch
'@wolfstar/env-utilities': patch
'@wolfstar/http-framework-i18n': patch
'@wolfstar/http-framework-test-utils': patch
'@wolfstar/http-framework': patch
'@wolfstar/i18next-backend': patch
'@wolfstar/i18next-type-generator': patch
'@wolfstar/influx-utilities': patch
'@wolfstar/logger': patch
'@wolfstar/reddit-helpers': patch
'@wolfstar/safe-fetch': patch
'@wolfstar/shared-http-pieces': patch
'@wolfstar/shared-influx-pieces': patch
'@wolfstar/start-banner': patch
'@wolfstar/twitch-helpers': patch
'@wolfstar/weather-helpers': patch
---

build: replace tsc with golar as typechecker, bump typescript to 7.0.2

`typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output.
