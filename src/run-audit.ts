import { createHash } from "node:crypto";
import { audit, defaultRules, type AuditResult, type RuleDefinition } from "bettera11y";
import type { BetterA11yPostcssNormalizedOptions, BetterA11yPostcssOptions } from "./types";

const DEFAULT_COLOR_CONTRAST_RULES: RuleDefinition[] = defaultRules.filter((rule) => rule.meta.id === "color-contrast");

export type CssAuditRun = {
    result: AuditResult;
    summary: { errors: number; warnings: number };
};

export function normalizePostcssOptions(partial: BetterA11yPostcssOptions): BetterA11yPostcssNormalizedOptions {
    return {
        failOnError: partial.failOnError ?? false,
        logLevel: partial.logLevel ?? "warn",
        cache: partial.cache ?? true,
        rules: partial.rules ?? DEFAULT_COLOR_CONTRAST_RULES,
        ruleOptions: partial.ruleOptions,
        normalizers: partial.normalizers
    };
}

export function hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex");
}

export async function runCssAudit(
    css: string,
    filepath: string,
    options: BetterA11yPostcssNormalizedOptions
): Promise<CssAuditRun> {
    const result = await audit(css, {
        filepath,
        format: "css",
        rules: options.rules,
        ruleOptions: options.ruleOptions,
        normalizers: options.normalizers
    });

    let errors = 0;
    let warnings = 0;
    for (const diagnostic of result.diagnostics) {
        if (diagnostic.severity === "error") {
            errors += 1;
        } else {
            warnings += 1;
        }
    }

    return { result, summary: { errors, warnings } };
}

export function formatDiagnosticMessage(diagnostic: AuditResult["diagnostics"][number]): string {
    const rule = diagnostic.ruleId ? ` [${diagnostic.ruleId}]` : "";
    return `${diagnostic.message}${rule}`;
}
