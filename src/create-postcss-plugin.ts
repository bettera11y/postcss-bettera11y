import type { Severity } from "bettera11y";
import type { Plugin, PluginCreator } from "postcss";
import type { BetterA11yPostcssOptions } from "./types";
import { formatDiagnosticMessage, hashContent, normalizePostcssOptions, runCssAudit } from "./run-audit";

const PLUGIN_NAME = "postcss-bettera11y";

function shouldEmit(severity: Severity, logLevel: "error" | "warn" | "info"): boolean {
    if (logLevel === "info") {
        return true;
    }
    if (logLevel === "error") {
        return severity === "error";
    }
    return severity !== "info";
}

/**
 * PostCSS plugin that audits CSS with BetterA11y (contrast in the same declaration blocks by default).
 * Register after earlier PostCSS plugins so the audit runs on their output (e.g. after a CSS framework pipeline).
 */
export const bettera11yPostcss: PluginCreator<BetterA11yPostcssOptions> = (
    userOptions: BetterA11yPostcssOptions = {}
) => {
    const normalized = normalizePostcssOptions(userOptions);
    const lastHashByFile = new Map<string, string>();

    return {
        postcssPlugin: PLUGIN_NAME,
        async OnceExit(root, { result }) {
            const filepath = result.opts.from ?? "input.css";
            const css = root.toString();

            if (normalized.cache) {
                const nextHash = hashContent(css);
                if (lastHashByFile.get(filepath) === nextHash) {
                    return;
                }
                lastHashByFile.set(filepath, nextHash);
            }

            const { result: auditResult, summary } = await runCssAudit(css, filepath, normalized);

            if (auditResult.diagnostics.length === 0 && normalized.logLevel === "info") {
                result.warn(`No accessibility issues in ${filepath}`, { plugin: PLUGIN_NAME });
                return;
            }

            for (const diagnostic of auditResult.diagnostics) {
                if (!shouldEmit(diagnostic.severity, normalized.logLevel)) {
                    continue;
                }

                const text = `${filepath}${formatLocationSuffix(diagnostic)} ${formatDiagnosticMessage(diagnostic)}`;
                result.warn(text, { plugin: PLUGIN_NAME });
            }

            if (normalized.failOnError && summary.errors > 0) {
                throw new Error(`Accessibility errors in ${filepath} (BetterA11y)`);
            }
        }
    };
};

bettera11yPostcss.postcss = true;

function formatLocationSuffix(diagnostic: { location?: { start?: { line?: number; column?: number } } }): string {
    const start = diagnostic.location?.start;
    if (typeof start?.line !== "number" || typeof start?.column !== "number") {
        return "";
    }
    return ` (${start.line}:${start.column})`;
}
