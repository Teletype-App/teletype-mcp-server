# Teletype brand assets

Source artwork retrieved from the official Teletype website on 2026-10-08:

- `logo.svg`: <https://teletype.app/images/logo_TeletypeApp.svg>
- `icon.svg`: the symbol and its gradient extracted from `logo.svg`, with a square viewport. The original paths and colors are unchanged.
- `icon.png`: 512 × 512 PNG exported from `icon.svg` for plugins and the desktop bundle.
- `icon-400.png`: 400 × 400 PNG exported from `icon.svg` for the Cline Marketplace.

These files identify the Teletype plugin and MCP server in directory listings and the desktop bundle.

The landing page and optional OAuth connection page use the original logo and the site's blue and neutral palette. Their text uses Manrope, available under the SIL Open Font License. `fonts/manrope.woff2` is a WOFF2 export of [the variable font from Google Fonts](https://github.com/google/fonts/tree/main/ofl/manrope). The license is included in `fonts/OFL.txt`. Logo and font are served locally through `/assets/` and, when OAuth is enabled, `/oauth/assets/`.
