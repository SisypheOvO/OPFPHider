# OPFP Hider

![License](https://img.shields.io/badge/license-MIT-green.svg)

![Showcase](./assets/showcase.gif)

A userscript that allows you to selectively hide different sections of osu! profile pages for a cleaner viewing experience.

## Features

- Hide specific sections of osu! user profiles:
  - Me (profile overview)
  - Beatmaps
  - Recent Activity
  - Top Ranks
  - Medals
  - Historical data
  - Kudosu
- Compatible with osu-web enhanced plugin
- Persistent settings across page refreshes
- Simple toggle buttons for each section

## Installation

> [!IMPORTANT]
> v4 is recommended for better performance.

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Choose one of the script variants: (note that senior versions build upon previous ones)
   - `default.user.js` - Basic functionality
   - `withAutoCollapse.user.js` - v2: Auto-collapse features (remembers last state)
   - `withA-Delete.user.js` - v3: Enhanced with delete functionality that allows you to remove the sections
   - `withAD-i18n.user.js` - v4: Internationalization(i18n) support
3. Create a new userscript in your manager and copy-paste the code from the chosen variant
4. Save and enable the script
5. Visit any osu! user profile page to see it in action. You are all set then.

## Contributing

Feel free to submit issues and pull requests to improve the script.
