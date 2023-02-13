# Astro Remark Eleventy Image 🖼

One thing I really missed when I migrated my blog from [Gatsby](https://www.gatsbyjs.com/) to [Astro](https://astro.build/) was the automatic image processing + optimization that [gatsby-remark-images](https://www.gatsbyjs.com/plugins/gatsby-remark-images/) did for the images linked in my posts. It was like SEO magic, and made my image-heavy pages load “blazingly fast” with very little effort on my end.

This drop-in Astro Integration replicates that functionality by using [Eleventy Image](https://www.11ty.dev/docs/plugins/image/) to optimize the images in your markdown automatically.

## Installation

`npm install astro-remark-eleventy-image`

### Migrating to v2.0

For better UX + ease of future development, this package was converted from a Remark plugin (v1.0) to an Integration (that adds a Remark plugin behind the scenes)
You’ll find that configuration is kept exactly the same, the only real difference is that remarkEleventyImage is now an integration, and the `remarkImages` config object should be passed into it. Remove remarkEleventyImage from your remarkPlugins array and read the rest of the documentation.

## Usage

### Updating `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import remarkEleventyImage from "astro-remark-eleventy-image";

// https://astro.build/config
export default defineConfig({
  ...
  integrations: [remarkEleventyImage()]
});
```

Just import the plugin and add it to your integrations array, similar to what they show in the [Astro docs for Integrations](https://docs.astro.build/en/guides/integrations-guide/#using-integrations)

> _Why is it called astro-REMARK-eleventy-images if it’s an integration and not a remark plugin?_
> This package was _previously_ a remark plugin, but to improve the configuration experience, use fewer tricks for functionality, and make future development easier, I converted it to an integration.

### Configuration

Configuration isn’t required for the plugin to function, but is available if you want to tweak a few things.

```js
import { defineConfig } from 'astro/config';
import remarkEleventyImage from "astro-remark-eleventy-image";

export function customMarkup({ src, sources, width, height, alt })
{
  return `
  <picture>
  ${sources}
  <img
    src="${src}"
    width="${width}"
    height="${height}"
    alt="${alt}"
    loading="lazy"
    decoding="async">
   </picture>
   `;
}

// https://astro.build/config
export default defineConfig({
  integrations: [remarkEleventyImage({
    sizes: "(max-width: 700px) 100vw, 700px",
    remoteImages: false,
    altRequired: true,
    customMarkup: customMarkup,
    eleventyImageConfig: {
      formats: ['auto'],
      widths: ['auto', 600, 1000, 1400],
      sharpOptions: {
        animated: true
      }
    },
  })],
});
```

> These are the default values

The configuration object for the plugin is passed into it as a parameter, similar to how other integrations are configured.

`remoteImages` controls whether or not remote images (the kind hosted on other websites like GitHub) are optimized on your site. This is mostly stable, but if problems arise please submit an issue.

`sizes` is the `sizes` attribute that gets passed to the HTML. If you don’t know how to set this, you can [read up on how it works on MDN.](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/sizes)

`eleventyImageConfig` is the configuration object that gets passed to [Eleventy Image.](https://www.11ty.dev/docs/plugins/image/) You can use it to configure the underlying `sharp` settings, the widths the plugin generates (more widths, more processing time), and more.

#### Custom Markup

See [PR #4](https://github.com/ChrisOh431/astro-remark-eleventy-image/pull/4) for detailed information on how to write custom markup.

> You cannot, however, configure where images are output and what they’re named. The names for the optimized images are generated based on what the original images are named, and the optimized images are placed in the same output directories as the original images. Changing either of these settings _will break your images._

## Why should you use this plugin?

It doesn’t require you to turn all your files into .mdx so you can import and use a custom Image component. It aims to do one thing well, and offers ample control over the eleventy-image generator config (but doesn’t require much configuring).

It’s also actively being used on [my site,](https://cjohanaja.com/) so I have good reason to support it.

Overall, if you want a quick and painless way to automatically optimize all of your post images, it wouldn’t hurt to try this out.

## Caveats

- This package hasn’t been tested with server-side rendering.
- Like with [gatsby-remark-images,](https://www.gatsbyjs.com/plugins/gatsby-remark-images/) the process of optimizing images is time consuming. This plugin is specifically intended to run during the **build** step of your Astro site to reduce that issue.
