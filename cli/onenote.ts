namespace pxt.docs.onenote {
    const TEMPLATE =
        `<html>
    <head>
    </head>
    <body>
        @BODY@
    </body>
</html>
    `;
    export function renderAsync(markdown: string): Promise<string> {
        const opts: pxt.docs.RenderOptions = {
            template: TEMPLATE,
            markdown,
            onenote: true
        }
        const r = pxt.docs.renderMarkdown(opts);
        return Promise.resolve(r);
    }
}