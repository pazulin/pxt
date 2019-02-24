namespace pxt.onenote {
    export function renderAsync(template: string, markdown: string): Promise<string> {
        const opts: pxt.docs.RenderOptions = {
            template,
            markdown,
            onenote: true
        }
        const r = pxt.docs.renderMarkdown(opts);
        return Promise.resolve(r);
    }
}