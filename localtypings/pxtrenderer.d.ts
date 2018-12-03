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

    interface RenderCompilationResult {
        success: boolean;
        outputName: string; // binary.hex, binary.uf2, ... file
        outfiles: pxt.Map<string>;
    }

    interface RenderMessage {
        id: string;
        type: string;
    }

    interface RenderRequest extends RenderMessage {
        code?: string;
        options?: {
            packageId?: string;
            package?: string;
            snippetMode?: boolean;
        }
    }

    interface RenderResponse extends RenderMessage {
        editUrl?: string;
    }

    interface RenderBlocksRequest extends RenderRequest {
        type: "renderblocks",
    }

    interface RenderBlocksResponse extends RenderResponse {
        source: "makecode",
        type: "renderblocks",
        svg?: string;
        width?: number;
        height?: number;
        compileJS?: RenderCompilationResult;
        compileBlocks?: RenderCompilationResult;
        editUrl?: string;
    }

    interface RenderSignatureRequest extends RenderRequest {
        type: "rendersig";
    }

    interface RenderSignatureResponse extends RenderResponse {
        type: "rendersig";
        svg?: string;
        width?: number;
        height?: number;
        js?: string;
    }
}