import type Image from "@11ty/eleventy-img";

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

export type { MarkupValues, createHTMLProps };