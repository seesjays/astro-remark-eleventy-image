import { MarkupValues, CreateHTMLProps } from "./types";
import path from "path";
import Image from "@11ty/eleventy-img";

export function createHTML({ imageDir, metadata, alt, sizes, isRemote, mdFilePath, markup }: CreateHTMLProps)
{
    let baseSource: Image.MetadataEntry[];
    let highsrc: Image.MetadataEntry;

    // picking the src for the base <img> tag
    if (metadata.jpeg && metadata.jpeg.length > 0)
    {
        baseSource = metadata.jpeg;
        highsrc = metadata.jpeg[metadata.jpeg.length - 1];
    }
    else
    {
        // when the image is remote, there's no jpeg, so just use the first format there is
        baseSource = Object.values(metadata)[0] as Image.MetadataEntry[];
        highsrc = baseSource[baseSource.length - 1];
    }

    function generateSrcsets(metadata: Image.Metadata)
    {
        function correctSrcset(entry: Image.MetadataEntry)
        {
            const filename = path.join(imageDir, path.basename(entry.url)) + ` ${entry.width}w`;
            return filename;
        }

        return Object.values(metadata).map(imageFormat =>
        {
            return `    <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map(entry => correctSrcset(entry)).join(", ")}" sizes="${sizes}">\n`;
        }).join("\n");
    }

    return markup({ src: path.join(imageDir, path.basename(highsrc.url)), width: highsrc.width, height: highsrc.height, alt: alt, format: baseSource[0].format, sources: generateSrcsets(metadata), isRemote: isRemote, mdFilePath: mdFilePath });
}

export function defaultMarkup({ src, sources, width, height, alt }: MarkupValues)
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
    </picture>`;
}
