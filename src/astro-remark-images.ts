import path from "path";
import { visit } from "unist-util-visit";
import Image from "@11ty/eleventy-img";

// @ts-ignore
import config from "./astro.config.mjs";
import { createHTML } from "./markupUtil.js";
import { MarkupValues } from "./types.js";

/*
    ONlY do this work in prod; don't want to mess up the dev build in any way
    0. Visit every (valid) image node in the MD tree.
    1. Pull the path to the file from the node.url.
    2. Use Eleventy Image to generate the optimized image
    3. Take the optimized images and replace the node.value with their <picture> markup.
    4. Automagically optimized images!
*/

type RemarkImagesConfig = {
    sizes?: string,
    remoteImages?: boolean,
    eleventyImageConfig?: Image.ImageOptions,
    customMarkup?: ((attributes: MarkupValues) => string),
};
function remarkEleventyImage()
{
    const publicDir = config.publicDir || "./public/";
    const outDir = config.outDir || "./dist/";

    const ricfg: RemarkImagesConfig = (config?.markdown?.remarkImages) ? config.markdown.remarkImages : null;
    const ricfgContainerSizes = (ricfg?.sizes) ? ricfg.sizes : "(max-width: 700px) 100vw, 700px";
    const ricfgRemoteEnabled = (ricfg?.remoteImages) ? ricfg.remoteImages : false;
    const ricfgCustomMarkup = (ricfg?.customMarkup) ? ricfg.customMarkup : null;
    const ricfgEleventyImageConfig = (ricfg?.eleventyImageConfig) ? ricfg.eleventyImageConfig : null;

    // setup eleventy image config obj, overwrite with settings from astro.config.mjs
    const baseEleventyConfig: Image.ImageOptions = Object.assign({
        widths: ['auto', 600, 1000],
        sharpOptions: {
            animated: true
        },
        useCache: false,
    }, ricfgEleventyImageConfig);


    /*
        We need to expect some settings
        For example, `widths` needs to contain 'auto' for the plugin to work
        since Eleventy doesn't upscale rasters.
        Also, the user isn't allowed to change the filename or outputdir. Sorry!
    */
    if (baseEleventyConfig.widths && !baseEleventyConfig.widths.includes('auto') && !baseEleventyConfig.widths.includes(null))
    {
        // user overwrote sizes but doesn't have 'auto'
        // in there for the optimized original size
        baseEleventyConfig.widths = ['auto', ...baseEleventyConfig.widths];
    }

    // @ts-ignore I don't entirely know how to fix this just yet
    if (import.meta.env.PROD)
    {
        return (ast: any, file: any) => new Promise<void>(async (resolve) =>
        {
            /* 
                According to some guidance, (https://www.huy.dev/2018-05-remark-gatsby-plugin-part-3/)
                it's best to collect nodes to modify through the visitor function 
                and modify them asynchronously afterwards
            */
            // will be an array of valid image nodes (non remote)
            const nodesToChange: { type: string, value: any, url: string, alt: string, }[] = [];

            const visitor = (node: any) =>
            {
                /*
                    Remote images are off by default. 
                    This is to prevent any stability issues, unnecessary errors, and longer processing times.
                    I'll add a portion in the README about turning it on
                */
                if (!ricfgRemoteEnabled && Image.Util.isRemoteUrl(node.url))
                {
                    return;
                }

                /*
                    Use alt text. Accessibility is good! :)
                */
                if (!node.alt)
                {
                    console.warn(`(astro-remark-images) Skipped image: ${node.url} in file ${path.basename(file.path)} due to missing alt text, which eleventy-image necessitates.`);
                    return;
                }

                nodesToChange.push(node);
            };

            visit(ast, 'image', visitor);

            // iterate through each image path in a md file
            for (const node of nodesToChange)
            {
                let originalImagePath;
                let outputImageDir;
                let outputImageDirHTML;
                const currentConfig: Image.ImageOptions = {};

                try
                {
                    console.log(`(astro-remark-images) Optimizing image: ${path.basename(node.url)} referenced in file: ${path.basename(file.path)}`);

                    if (Image.Util.isRemoteUrl(node.url)) 
                    {
                        // Remote image. In this case the optimized images are put
                        // in a subdirectory of '/arei-optimg/' based on the markdown file name.
                        originalImagePath = node.url;
                        outputImageDir = path.join(outDir, '/arei-optimg/');
                        outputImageDirHTML = path.join('/arei-optimg/');

                        // this is so the plugin doesn't crash when trying to optimize remote images
                        // ([Error: VipsJpeg: Maximum supported image dimension is 65500 pixels])
                        currentConfig.formats = ['auto'];
                        currentConfig.filenameFormat = (id, src, width, format) =>
                        {
                            return `${id}-${width}.${format}`;
                        };
                    }
                    else
                    {
                        // Local Image. In this case the optimized images are put
                        // where the original image would be in the final build
                        originalImagePath = path.join(publicDir, node.url);
                        outputImageDir = path.dirname(path.join(outDir, node.url));
                        outputImageDirHTML = path.dirname(node.url);

                        currentConfig.filenameFormat = (id, src, width, format) =>
                        {
                            return `${path.parse(node.url).name}-${width}.${format}`;
                        };
                    }

                    // the directory the image should be in
                    currentConfig.outputDir = outputImageDir;

                    const stats: Image.Metadata = await Image(originalImagePath, Object.assign(currentConfig, baseEleventyConfig));
                    const responsiveHTML = createHTML({
                        imageDir: outputImageDirHTML,
                        metadata: stats,
                        alt: node.alt,
                        sizes: ricfgContainerSizes,
                        isRemote: Image.Util.isRemoteUrl(node.url),
                        mdFilePath: file.path,
                        customMarkup: ricfgCustomMarkup,
                    });

                    if (responsiveHTML)
                    {
                        node.type = 'html';
                        node.value = responsiveHTML;
                    }
                } catch (error)
                {
                    console.error(`(astro-remark-images) Failed to optimize image: ${node.url} referenced in file: ${path.basename(file.path)}, error: ${error}`);
                }
            }

            resolve();
            return;
        });
    }
};

export { remarkEleventyImage };