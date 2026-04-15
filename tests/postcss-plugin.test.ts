import postcss, { type Plugin } from "postcss";
import { describe, expect, it } from "vitest";
import { bettera11yPostcss } from "../src/create-postcss-plugin";
import { normalizePostcssOptions, runCssAudit } from "../src/run-audit";

describe("runCssAudit", () => {
    it("reports low contrast when color and background share a rule block", async () => {
        const css = `.bad { color: #777777; background-color: #888888; }`;
        const { result } = await runCssAudit(css, "test.css", normalizePostcssOptions({}));
        expect(result.diagnostics.some((d) => d.ruleId === "color-contrast")).toBe(true);
    });

    it("returns no contrast diagnostics when only color is set in a block", async () => {
        const css = `.only-color { color: #111111; }`;
        const { result } = await runCssAudit(css, "test.css", normalizePostcssOptions({}));
        expect(result.diagnostics.filter((d) => d.ruleId === "color-contrast")).toHaveLength(0);
    });
});

describe("bettera11yPostcss", () => {
    it("emits PostCSS warnings for contrast issues", async () => {
        const css = `.bad { color: #777777; background-color: #888888; }`;
        const result = await postcss([bettera11yPostcss({ cache: false })]).process(css, {
            from: "fixtures/low-contrast.css"
        });
        expect(result.warnings().length).toBeGreaterThan(0);
        expect(result.warnings()[0]?.text).toContain("color-contrast");
    });

    it("does not throw for contrast warnings when failOnError is true (contrast defaults to warn severity)", async () => {
        const css = `.bad { color: #777777; background-color: #888888; }`;
        const result = await postcss([bettera11yPostcss({ cache: false, failOnError: true })]).process(css, {
            from: "fixtures/warn-only.css"
        });
        expect(result.warnings().length).toBeGreaterThan(0);
    });

    it("skips repeated runs when cache is enabled and CSS unchanged", async () => {
        const css = `.ok { color: #000000; background-color: #ffffff; }`;
        const plugin = bettera11yPostcss({ cache: true });
        const first = await postcss([plugin]).process(css, { from: "fixtures/cached.css" });
        const second = await postcss([plugin]).process(css, { from: "fixtures/cached.css" });
        expect(first.warnings()).toHaveLength(0);
        expect(second.warnings()).toHaveLength(0);
    });

    it("runs after an earlier PostCSS plugin in the chain", async () => {
        const prependComment: Plugin = {
            postcssPlugin: "test-prepend-comment",
            Once(root) {
                root.prepend(postcss.comment({ text: " noop " }));
            }
        };
        const css = `.bad { color: #777777; background-color: #888888; }`;
        const result = await postcss([prependComment, bettera11yPostcss({ cache: false })]).process(css, {
            from: "fixtures/chain.css"
        });
        expect(result.css).toContain("noop");
        expect(result.warnings().some((w) => w.text.includes("color-contrast"))).toBe(true);
    });
});
