import type Image from "@11ty/eleventy-img";
import { ImageOptions } from "@11ty/eleventy-img";

type MarkupValues = {
    src: string,
    width: number,
    height: number,
    alt: string,
    format: string,
    sources: string,
    isRemote: boolean,
    mdFilePath: string,
};

interface createHTMLProps
{
    imageDir: string,
    metadata: Image.Metadata,
    alt: string,
    sizes: string,
    isRemote: boolean,
    mdFilePath: string;
}

type RemarkImagesConfig = {
    sizes: string,
    remoteImages: boolean,
    eleventyImageConfig: ImageOptions,
    customMarkup: ((attributes: MarkupValues) => string),
    altRequired: boolean,
};

export type { MarkupValues, createHTMLProps, RemarkImagesConfig, ImageOptions };