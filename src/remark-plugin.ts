import path from "node:path";
import { visit } from "unist-util-visit";
import Image from "@11ty/eleventy-img";

import { createHTML } from "./markupUtil.js";
import { RemarkImagesConfig } from "./types.js";

/*
    ONlY do this work in prod; don't want to mess up the dev build in any way
    0. Visit every (valid) image node in the MD tree.
    1. Pull the path to the file from the node.url.
    2. Use Eleventy Image to generate the optimized image
    3. Take the optimized images and replace the node.value with their <picture> markup.
    4. Automagically optimized images!
*/

// Closures are so neat.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
const configureRemarkEleventyImagesPlugin = (config: Required<RemarkImagesConfig> & { publicDir: string, outDir: string; }) =>
{
    return function remarkEleventyImages()
    {
        const publicDir = config.publicDir;
        const outDir = config.outDir;

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
                if (!config.remoteImages && Image.Util.isRemoteUrl(node.url))
                {
                    return;
                }

                /*
                    Use alt text. Accessibility is good! :)
                */
                if (!node.alt)
                {
                    if (!config.altRequired)
                    {
                        node.alt = "";
                        nodesToChange.push(node);
                        return;
                    }

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
                const tempConfig: Image.ImageOptions = {};

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
                        tempConfig.formats = ['auto'];
                        tempConfig.filenameFormat = (id, src, width, format) =>
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

                        tempConfig.filenameFormat = (id, src, width, format) =>
                        {
                            return `${path.parse(node.url).name}-${width}.${format}`;
                        };
                    }

                    // the directory the image should be in
                    tempConfig.outputDir = outputImageDir;

                    const stats: Image.Metadata = await Image(originalImagePath, Object.assign(tempConfig, config.eleventyImageConfig));
                    const responsiveHTML = createHTML({
                        imageDir: outputImageDirHTML,
                        metadata: stats,
                        alt: node.alt,
                        sizes: config.sizes,
                        isRemote: Image.Util.isRemoteUrl(node.url),
                        mdFilePath: file.path,
                        markup: config.customMarkup,
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
    };
};

export default configureRemarkEleventyImagesPlugin;