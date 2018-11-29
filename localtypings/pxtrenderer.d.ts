declare namespace pxt.blocks {
    enum BlockLayout {
        Align = 1,
        // Shuffle deprecated
        Clean = 3,
        Flow = 4
    }

    interface BlocksRenderOptions {
        emPixels?: number;
        layout?: BlockLayout;
        clean?: boolean;
        aspectRatio?: number;
        packageId?: string;
        package?: string;
        snippetMode?: boolean;
        useViewWidth?: boolean;
        splitSvg?: boolean;
    }
}

declare namespace pxt.runner {
    interface RenderReadyResponseMessage {
        source: "makecode",
        type: "renderready"
    }

    interface RenderBlocksResponseMessage {
        source: "makecode",
        type: "renderblocks",
        id: string;
        svg?: string;
        width?: number;
        height?: number;
    }

    interface RenderBlocksRequestMessage {
        type: "renderblocks",
        id: string;
        code?: string;
        options?: {
            packageId?: string;
            package?: string;
            snippetMode?: boolean;
        }
    }
}