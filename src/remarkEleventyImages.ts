import type { AstroIntegration } from 'astro';
import { RemarkImagesConfig } from "./types.js";

import { configureRemarkEleventyImages } from "./astro-remark-images";
import { fileURLToPath } from 'url';
import { defaultMarkup } from './markupUtil.js';

const PKG_NAME = 'astro-remark-eleventy-image';

const createPlugin = (options?: Partial<RemarkImagesConfig>): AstroIntegration =>
{
    return {
        name: PKG_NAME,

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
                            widths: ["auto", 600, 1000, 1400],
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

                    const remarkPlugin = configureRemarkEleventyImages(pluginConfig);

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

export default createPlugin;