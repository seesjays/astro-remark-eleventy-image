import { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import configureRemarkEleventyImagesPlugin from "./src/remark-plugin";

import { createHTML, defaultMarkup } from "./src/markupUtil";
import { RemarkImagesConfig } from "./src/types";

export type { createHTMLProps, MarkupValues } from "./src/types";

export default function remarkEleventyImages(options: Partial<RemarkImagesConfig> = {}): AstroIntegration
{
    return {
        name: 'astro-remark-eleventy-image',

        hooks: {
            'astro:config:setup': async ({ command, config, updateConfig }) =>
            {
                if (command == 'build')
                {
                    // Setup Default Plugin Settings
                    const defaults: RemarkImagesConfig & { publicDir: string, outDir: string; } = {
                        publicDir: fileURLToPath(config.publicDir),
                        outDir: fileURLToPath(config.outDir),
                        sizes: "(max-width: 700px) 100vw, 700px",
                        eleventyImageConfig: {
                            // This used to be JPEG and WebP, but too many issues arose
                            // around format conversion. Test out 'jpeg', 'webp', for an optimal
                            // solution, but if errors arise stick with just 'auto'
                            formats: ['auto'],
                            widths: ['auto', 600, 1000, 1400],
                            sharpOptions: {
                                animated: true,
                            },
                            useCache: false
                        },
                        altRequired: true,
                        remoteImages: false,
                        customMarkup: defaultMarkup
                    };
                    const pluginConfig = Object.assign({}, defaults, options);

                    /*
                        We need to expect some settings
                        For example, `widths` needs to contain 'auto' for the plugin to work
                        since Eleventy doesn't upscale rasters.
                        Also, the user isn't allowed to change the filename or outputdir. Sorry!
                    */
                    if (options?.eleventyImageConfig?.widths && !options.eleventyImageConfig.widths.includes('auto') && !options.eleventyImageConfig.widths.includes(null))
                    {
                        // user overwrote sizes but doesn't have 'auto'
                        // in there for the optimized original size
                        pluginConfig.eleventyImageConfig.widths = ['auto', ...options.eleventyImageConfig.widths];
                    }

                    const remarkPlugin = configureRemarkEleventyImagesPlugin(pluginConfig);

                    updateConfig({
                        markdown: {
                            remarkPlugins: [remarkPlugin]
                        },
                    });
                }
            }
        },
    };
};