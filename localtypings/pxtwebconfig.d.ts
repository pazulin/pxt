declare namespace pxt {
    interface WebConfig {
        relprefix: string; // "/beta---",
        workerjs: string;  // "/beta---worker",
        monacoworkerjs: string; // "/beta---monacoworker",
        pxtVersion: string; // "?",
        pxtRelId: string; // "9e298e8784f1a1d6787428ec491baf1f7a53e8fa",
        pxtCdnUrl: string; // "https://pxt.azureedge.net/commit/9e2...e8fa/",
        commitCdnUrl: string; // "https://pxt.azureedge.net/commit/9e2...e8fa/",
        blobCdnUrl: string; // "https://pxt.azureedge.net/commit/9e2...e8fa/",
        cdnUrl: string; // "https://pxt.azureedge.net"
        targetUrl: string; // "https://pxt.microbit.org"
        targetVersion: string; // "?",
        targetRelId: string; // "9e298e8784f1a1d6787428ec491baf1f7a53e8fa",
        targetId: string; // "microbit",
        simUrl: string; // "https://trg-microbit.userpxt.io/beta---simulator"
        partsUrl?: string; // /beta---parts
        runUrl?: string; // "/beta---run"
        docsUrl?: string; // "/beta---docs"
        isStatic?: boolean;
        verprefix?: string; // "v1"
    }
    let webConfig: WebConfig;
}