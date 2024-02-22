# BrowserDiffusion

BrowserDiffusion is a chrome extension that runs stable diffusion with LCM at near real-time on page images.

(Demo Video)

Built by [Justin](https://twitter.com/justoutquan) and [Michael](https://twitter.com/michaelbzhu) at [Mapo Labs](https://www.mapolabs.com/)

[demo here]

## Getting Started

After cloning the repo, install dependencies.

```
pnpm install
```

This implementation uses Fal AI's serverless GPUs for generations to make it accessible to users without their own compute.
Create a free account at [Fal AI](https://fal.ai/), which should start you with $10 in free credits.
Go to Fal's [keys page](https://fal.ai/dashboard/keys) and create a new API key with the API scope.
Copy the revealed key value to the `.env` file at root.

```
VITE_FAL_CREDENTIALS="insert_key_value_here"
```

Then run

```
pnpm run build
```

The build will be in `./dist`.

To add it to your browser, open Google Chrome and click on the extensions puzzle icon on the top right > manage extension (Or navigate to [`chrome://extensions/`](chrome://extensions/)).

Make sure Developer Mode is on (check toggle in top right corner). Click 'Load unpacked' and select the `./dist` folder in the project directory.

The extension will now show up as a card on the screen and in your extensions bar to the right of the tab search bar! If you don't see it, you can click on the extensions puzzle icon, find BrowserDiffusion, and pin it.

You're all set! Try visiting a site, typing a style, e.g. "((anime))", and it'll start to transform the site's images.

Note: If you're using Fal, generation times may vary depending on their load.

## Making Changes

While making changes to the code, on the Manage Extensions page, you can click the refresh icon on the card after making updates to ensure that its been reset.

## Current Limitations

- Not all sites work. For example, it works on Instagram, but not Twitter at the moment, since Twitter uses an unusual pattern for images in its DOM.
- It doesn't work on videos.
- In this version, the extension popup must be open for conversions to take place. It is possible to do this by making the Fal requests in a background.ts file, but it's flakey because of Google's [manifest v3 updates](https://discourse.mozilla.org/t/impossible-to-upgrade-to-manifest-v3-for-extensions-that-require-constant-persistent-listeners/125942).
- Your Fal key is exposed in the browser environment, which is okay for personal use, but bad practice for production. You should use a server proxy for sending Fal requests in production.
- This example uses vanilla SD 1.5 without any fine-tuning or style Loras, so results aren't as good as more specialized models.

## Common Issues

**I made changes to the code, but they're not reflecting.**

If you've made changes to code and rebuilt with `pnpm run build` but the changes aren't reflecting, try clicking the refresh button in the extension card in 'Manage Extensions', and refreshing the page that you're testing the extension on.

**It's not altering the images on the site**

It can't convert on all sites. See [Current Limitations](#current-limitations)
