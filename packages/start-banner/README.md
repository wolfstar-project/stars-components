<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/start-banner

**A banner generator utility for your CLI startup messages.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/start-banner)](https://npmx.dev/package/@wolfstar/start-banner)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/start-banner)](https://npmx.dev/package/@wolfstar/start-banner)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A banner generator utility for your CLI, generates a string to be printed into the console given a logo, name, and extras.

The full layout is similar to the following:

```
#####################################################################
#          #                                                        #
#          #                                                        #
#   LOGO   #                          NAME                          #
#          #                                                        #
#          #                                                        #
#####################################################################
############                                                        #
############                         EXTRAS                         #
############                                                        #
############                                                        #
#####################################################################
```

It consists of two sections, "left" and "right". The left section is present only if a non-empty logo is given, otherwise only the right section will be shown. The right section consists of the "name" and "extras" fields, both of which are optional, and if none of them is given, then only the logo will be shown.

The width of the left section depends on the width of the "logo" field without the ANSI codes, which allows users to use coloured logos with ANSI codes and the width will still be correct, displaying the banner as intended.

If the height of the right section is higher than the height of the logo, then an empty padding with the logo's width will be used.

## Installation

You can use the following command to install this package, or replace `npm install` with your package
manager of choice.

```sh
npm install @wolfstar/start-banner
```

## Usage

To use the module, you import the `createBanner` function from the package, and then pass arrays with the lines.
