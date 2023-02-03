import path from "path";
import { visit } from "unist-util-visit";
import Image from "@11ty/eleventy-img";

// @ts-ignore
import config from "./astro.config.mjs";

/*
    ONlY do this work in prod; don't want to mess up the dev build in any way
    0. Visit every (valid) image node in the MD tree.
    1. Pull the path to the file from the node.url.
    2. Use Eleventy Image to generate the optimized image
    3. Take the optimized images and replace the node.value with their <picture> markup.
    4. Automagically optimized images!
*/

function remarkEleventyImage()
{
    const publicDir = config.publicDir || "./public/";
    const outDir = config.outDir || "./dist/";

    const ricfg = config.markdown.remarkImages ? config.markdown.remarkImages : null;
    const ricfgContainerSizes = ricfg.sizes ? ricfg.sizes : "(max-width: 700px) 100vw, 700px";
    const ricfgEleventyImageConfig: Image.ImageOptions = ricfg.eleventyImageConfig ? ricfg.eleventyImageConfig : null;

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

    // this is so typescript stops crying
    if (!baseEleventyConfig.widths) baseEleventyConfig.widths = ['auto'];
    if (!baseEleventyConfig.widths.includes('auto') && !baseEleventyConfig.widths.includes(null))
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
                    Don't mess with external images.
                    There's probably a more elegant method to detect these
                    that I can't recall at the time.
                */
                if (node.url.indexOf("http") == 0) return;

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

                try
                {
                    console.log(`(astro-remark-images) Optimizing image: ${path.basename(node.url)} referenced in file: ${path.basename(file.path)}`);
                    originalImagePath = path.join(publicDir, node.url);
                    outputImageDir = path.dirname(path.join(outDir, node.url));

                    // the directory the image should be in
                    // and the filename changes with each image
                    baseEleventyConfig.outputDir = outputImageDir;
                    baseEleventyConfig.filenameFormat = (id, src, width, format) =>
                    {
                        return `${path.parse(node.url).name}-${width}.${format}`;
                    };

                    const stats = await Image(originalImagePath, baseEleventyConfig);

                    const responsiveHTML = createPicture(
                        {
                            imageDir: path.dirname(node.url),
                            metadata: stats as {
                                jpeg?: ImageMetadata[],
                                webp?: ImageMetadata[],
                            },
                            alt: node.alt,
                            sizes: ricfgContainerSizes
                        }
                    );

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

type ImageMetadata = {
    format: string,
    width: number,
    height: number,
    url: string,
    sourceType: string,
    srcset: string,
    filename: string,
    outputPath: string,
    size: number,
};

interface createPictureProps
{
    imageDir: string,
    metadata: {
        jpeg?: ImageMetadata[],
        webp?: ImageMetadata[],
    };
    alt: string,
    sizes: string,
}

function createPicture({ imageDir, metadata, alt, sizes }: createPictureProps)
{
    if (!metadata.jpeg || metadata.jpeg?.length == 0) return;
    let highsrc = metadata.jpeg[metadata.jpeg.length - 1];

    function correctSrcset(entry: ImageMetadata)
    {
        const filename = path.join(imageDir, entry.filename) + ` ${entry.width}w`;
        return filename;
    }

    return `
    <picture>
    ${Object.values(metadata).map(imageFormat =>
    {
        return `    <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map(entry => correctSrcset(entry)).join(", ")}" sizes="${sizes}">\n`;
    }).join("\n")}
      <img
        src="${path.join(imageDir, highsrc.filename)}"
        width="${highsrc.width}"
        height="${highsrc.height}"
        alt="${alt}"
        loading="lazy"
        decoding="async">
    </picture>`;
}