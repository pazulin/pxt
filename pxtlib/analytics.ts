/// <reference path="../localtypings/mscc.d.ts" />

namespace pxt {
    // These functions are defined in docfiles/pxtweb/cookieCompliance.ts
    export declare function aiTrackEvent(id: string, data?: any, measures?: any): void;
    export declare function aiTrackException(err: any, kind: string, props: any): void;
}

namespace pxt {
    export interface PxtOptions {
        debug?: boolean;
        light?: boolean; // low resource device
        wsPort?: number;
    }
    export let options: PxtOptions = {};

    // general error reported
    export let debug: (msg: any) => void = typeof console !== "undefined" && !!console.debug
        ? (msg) => {
            if (pxt.options.debug)
                console.debug(msg);
        } : () => { };
    export let log: (msg: any) => void = typeof console !== "undefined" && !!console.log
        ? (msg) => {
            console.log(msg);
        } : () => { };

    export let reportException: (err: any, data?: Map<string>) => void = function (e, d) {
        if (console) {
            console.error(e);
            if (d) {
                try {
                    // log it as object, so native object inspector can be used
                    console.log(d)
                    //pxt.log(JSON.stringify(d, null, 2))
                } catch (e) { }
            }
        }
    }
    export let reportError: (cat: string, msg: string, data?: Map<string>) => void = function (cat, msg, data) {
        if (console) {
            console.error(`${cat}: ${msg}`);
            if (data) {
                try {
                    pxt.log(JSON.stringify(data, null, 2))
                } catch (e) { }
            }
        }
    }
}

namespace pxt.analytics {
    const defaultProps: Map<string> = {};
    const defaultMeasures: Map<number> = {};
    let enabled = false;

    export function addDefaultProperties(props: Map<string | number>) {
        Object.keys(props).forEach(k => {
            if (typeof props[k] == "string") {
                defaultProps[k] = <string>props[k];
            } else {
                defaultMeasures[k] = <number>props[k];
            }
        });
    }

    export function enable() {
        if (!pxt.aiTrackException || !pxt.aiTrackEvent || enabled) return;

        enabled = true;
        pxt.debug('setting up app insights')

        const te = pxt.tickEvent;
        pxt.tickEvent = function (id: string, data?: Map<string | number>, opts?: TelemetryEventOptions): void {
            if (te) te(id, data, opts);

            if (opts && opts.interactiveConsent && typeof mscc !== "undefined" && !mscc.hasConsent()) {
                mscc.setConsent();
            }
            if (!data) pxt.aiTrackEvent(id);
            else {
                const props: Map<string> = defaultProps || {};
                const measures: Map<number> = defaultMeasures || {};
                Object.keys(data).forEach(k => {
                    if (typeof data[k] == "string") props[k] = <string>data[k];
                    else measures[k] = <number>data[k];
                });
                pxt.aiTrackEvent(id, props, measures);
            }
        };

        const rexp = pxt.reportException;
        pxt.reportException = function (err: any, data: pxt.Map<string>): void {
            if (rexp) rexp(err, data);
            const props: pxt.Map<string> = {
                target: pxt.appTarget.id,
                version: pxt.appTarget.versions.target
            }
            if (data) Util.jsonMergeFrom(props, data);
            pxt.aiTrackException(err, 'exception', props)
        };

        const re = pxt.reportError;
        pxt.reportError = function (cat: string, msg: string, data?: pxt.Map<string>): void {
            if (re) re(cat, msg, data);
            try {
                throw msg
            }
            catch (err) {
                const props: pxt.Map<string> = {
                    target: pxt.appTarget.id,
                    version: pxt.appTarget.versions.target,
                    category: cat,
                    message: msg
                }
                if (data) Util.jsonMergeFrom(props, data);
                pxt.aiTrackException(err, 'error', props);
            }
        };
    }

    export function isCookieBannerVisible() {
        return typeof mscc !== "undefined" && !mscc.hasConsent();
    }

    export function enableCookies() {
        if (isCookieBannerVisible()) {
            mscc.setConsent();
        }
    }
}