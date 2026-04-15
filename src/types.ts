import type { AuditFunctionOptions } from "bettera11y";

export type BetterA11yPostcssLogLevel = "error" | "warn" | "info";

export type BetterA11yPostcssOptions = {
    /**
     * When true, diagnostics with severity "error" fail the PostCSS run.
     */
    failOnError?: boolean;
    /**
     * Controls which diagnostics are surfaced when logging.
     */
    logLevel?: BetterA11yPostcssLogLevel;
    /**
     * When true, skip auditing when the CSS string is unchanged (per input file).
     */
    cache?: boolean;
} & Pick<AuditFunctionOptions, "rules" | "ruleOptions" | "normalizers">;

export type BetterA11yPostcssNormalizedOptions = Required<
    Pick<BetterA11yPostcssOptions, "failOnError" | "logLevel" | "cache">
> & {
    rules: NonNullable<AuditFunctionOptions["rules"]>;
    ruleOptions: AuditFunctionOptions["ruleOptions"];
    normalizers: AuditFunctionOptions["normalizers"];
};
