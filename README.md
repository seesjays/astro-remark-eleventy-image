# Astro Remark Eleventy Image 🖼

One thing I really missed when I migrated my blog from [Gatsby](https://www.gatsbyjs.com/) to [Astro](https://astro.build/) was the automatic image processing + optimization that [gatsby-remark-images](https://www.gatsbyjs.com/plugins/gatsby-remark-images/) did for the images linked in my posts. It was like SEO magic, and made my image-heavy pages load “blazingly fast” with very little effort on my end.

This drop-in remark plugin replicates that functionality by using [Eleventy Image](https://www.11ty.dev/docs/plugins/image/) to optimize the images in your markdown automatically.

## Installation

```shell
npm install astro-remark-eleventy-image
```

## Usage

### Updating `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import { remarkEleventyImage } from "astro-remark-eleventy-image";

// https://astro.build/config
export default defineConfig({
    ...
    markdown: {
        remarkPlugins: [remarkEleventyImage]
    }
});
```

Make sure to import the plugin and add it to your markdown.remarkPlugins array, similar to what they show in the [Astro docs for Markdown.](https://docs.astro.build/en/guides/markdown-content/#markdown-plugins)

### Configuration

Configuration isn’t required for the plugin to function, but is available if you want to tweak a few things.

```js
import { defineConfig } from "astro/config";
import { remarkEleventyImage } from "astro-remark-eleventy-image";

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkEleventyImage],
    remarkImages: {
      sizes: "(max-width: 700px) 100vw, 700px",
      eleventyImageConfig: {
        widths: ["auto", 600, 1000, 1400],
        sharpOptions: {
          animated: false,
        },
      },
    },
  },
});
```

`remarkImages` contains the configuration for the plugin.

`sizes` is the `sizes` attribute that gets passed to the HTML. If you don’t know how to set this, you can [read up on how it works on MDN.](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/sizes)

`eleventyImageConfig` is the configuration object that gets passed to [Eleventy Image.](https://www.11ty.dev/docs/plugins/image/) You can use it to configure the underlying `sharp` settings, the widths the plugin generates (more widths, more processing time), and more.

> You cannot, however, configure where images are output and what they’re named. The names for the optimized images are generated based on what the original images are named, and the optimized images are placed in the same output directories as the original images.
> This is all to make sure the images are properly linked to in the generated HTML

### Default Values

When you don’t configure the plugin, these are the default values that get subbed in. I wanted to make them sensible and widely-applicable.

```js
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkEleventyImage],
    remarkImages: {
      sizes: "(max-width: 700px) 100vw, 700px",
      eleventyImageConfig: {
        widths: ["auto", 600, 1000],
        sharpOptions: {
          animated: true,
        },
        useCache: false,
      },
    },
  },
});
```

## Why should you use this plugin?

It doesn’t require you to turn all your files into .mdx so you can import and use a custom Image component. It aims to do one thing well, and offers ample control over the eleventy-image generator config (but doesn’t require much configuring).

It’s also actively being used on [my site,](https://cjohanaja.com/) so I have good reason to support it.

Overall, if you want a quick and painless way to automatically optimize all of your post images, it wouldn’t hurt to try this out.

## Caveats

- This package hasn’t been tested with server-side rendering.
- Like with [gatsby-remark-images,](https://www.gatsbyjs.com/plugins/gatsby-remark-images/) the process of optimizing images is time consuming. This plugin is specifically intended to run during the **build** step of your Astro site to reduce that issue.
