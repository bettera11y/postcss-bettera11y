# postcss-bettera11y

PostCSS plugin that runs [BetterA11y](https://github.com/bettera11y/bettera11y) on your CSS so you can catch accessibility issues (for example low contrast) in the stylesheet that your build actually emits.

## Install

```bash
npm install postcss-bettera11y bettera11y postcss
```

Peer dependencies: `bettera11y` and `postcss`.

## Usage

Register **`bettera11yPostcss`** in your PostCSS config. Place it **after** any plugins that expand or transform CSS (framework pipelines, `@import` resolution, etc.) so the audit sees the final declarations.

**`postcss.config.mjs`**

```javascript
import bettera11y from "postcss-bettera11y";

export default {
    plugins: [bettera11y()]
};
```

With options:

```javascript
import bettera11y from "postcss-bettera11y";

export default {
    plugins: [
        bettera11y({
            failOnError: false,
            logLevel: "warn"
        })
    ]
};
```

### Using with Tailwind CSS

If you use Tailwind’s PostCSS plugin, list **`postcss-bettera11y` after** it so utilities are expanded before the audit:

```javascript
import tailwindcss from "@tailwindcss/postcss";
import bettera11y from "postcss-bettera11y";

export default {
    plugins: [tailwindcss(), bettera11y()]
};
```

Tailwind remains your dependency; this package does not ship or require it.

## Options

The plugin is a standard PostCSS plugin factory: `bettera11yPostcss(options?)`.

| Option        | Type                          | Default            | Description                                                                                                                           |
| ------------- | ----------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `failOnError` | `boolean`                     | `false`            | When `true`, throws if any diagnostic uses BetterA11y severity `"error"`. (Built-in contrast rule is `"warn"`.)                       |
| `logLevel`    | `"error" \| "warn" \| "info"` | `"warn"`           | Filters which severities are forwarded to PostCSS warnings. `"info"` surfaces all diagnostics and a “no issues” line when applicable. |
| `cache`       | `boolean`                     | `true`             | Skip re-auditing when the CSS string for a given `from` path is unchanged.                                                            |
| `rules`       | `RuleDefinition[]`            | `[color-contrast]` | Override BetterA11y rules (defaults to the `color-contrast` rule from `defaultRules`).                                                |
| `ruleOptions` | object                        | —                  | Per-rule options passed to `audit()`.                                                                                                 |
| `normalizers` | object                        | —                  | Custom normalizers passed to `audit()`.                                                                                               |

Presets from BetterA11y are re-exported: `recommendedPreset`, `strictPreset`, `wcagAaBaselinePreset`.

## Scope and limitations

BetterA11y’s **CSS** contrast check only considers declaration blocks where **both** `color` and `background` / `background-color` appear **in the same rule**. That matches plain CSS and many layered or composed styles, but **not** the typical atomic-utility pattern where foreground and background utilities compile to **different** selectors on the same element.

For markup and component-level checks, use **[vite-plugin-bettera11y](https://www.npmjs.com/package/vite-plugin-bettera11y)** (or run `audit()` on your HTML/TSX sources) alongside this plugin.

Output from utility frameworks often uses nested at-rules; BetterA11y’s flat CSS parser does not walk every nested block. Treat results as a **best-effort signal**, not a full substitute for manual review or browser contrast tooling.

## API

```typescript
import bettera11yPostcss, { hashContent, normalizePostcssOptions, runCssAudit } from "postcss-bettera11y";
```

- **Default export** — same as `bettera11yPostcss` (PostCSS `PluginCreator`).
- **`runCssAudit`** — runs the same CSS audit the plugin uses (returns BetterA11y `AuditResult` plus error/warning counts).
- **`normalizePostcssOptions`** — merges partial plugin options with the same defaults as the PostCSS plugin (including default **`color-contrast`** rules).
- **`hashContent`** — stable SHA-256 hash of a CSS string (used by the plugin’s cache; useful for custom tooling).

Types: **`BetterA11yPostcssOptions`**, **`BetterA11yPostcssNormalizedOptions`**, **`BetterA11yPostcssLogLevel`**.

### Stricter contrast thresholds (`ruleOptions`)

Per-rule options are passed through to BetterA11y’s `audit()` call. The built-in CSS contrast rule accepts thresholds such as `minContrastNormal` and `minContrastLarge` (see that rule’s `optionsSchema` in the core package).

```javascript
import bettera11y from "postcss-bettera11y";

export default {
    plugins: [
        bettera11y({
            ruleOptions: {
                "color-contrast": {
                    minContrastNormal: 7,
                    minContrastLarge: 4.5
                }
            }
        })
    ]
};
```

### Custom rules (`rules`)

By default the plugin audits with BetterA11y’s **`color-contrast`** rule only (the same subset `runCssAudit` uses). Override **`rules`** with any **`RuleDefinition[]`** from **`bettera11y`** or your own definitions.

For **raw CSS** (`format: "css"` inside the engine), rules that rely on a DOM document typically emit nothing; contrast (and your own CSS-aware rules) are the natural fit. For authoring rules in general, see the BetterA11y [**rule authoring guide**](https://github.com/bettera11y/bettera11y/blob/main/docs/rule-authoring.md).

**Example:** combine the stock contrast rule with a small custom rule that inspects the stylesheet text:

```javascript
import bettera11y from "postcss-bettera11y";
import { defaultRules } from "bettera11y";

const colorContrast = defaultRules.filter((rule) => rule.meta.id === "color-contrast");

/** @type {import("bettera11y").RuleDefinition} */
const warnOnOutlineNone = {
    meta: {
        id: "demo-outline-none",
        description: "Example: warn when outline is removed in plain CSS.",
        category: "style",
        defaultSeverity: "warn",
        tags: ["custom"],
        wcagAlignment: "heuristic",
        wcagNotes: "Illustrative static check; a real rule would verify compensating :focus-visible styles."
    },
    check({ input }) {
        if (input.format !== "css") {
            return [];
        }
        if (!/outline\s*:\s*none/i.test(input.content)) {
            return [];
        }
        return [
            {
                ruleId: "demo-outline-none",
                severity: "warn",
                category: "style",
                message: "Stylesheet contains outline: none; confirm focus is still visible for keyboard users.",
                remediation: "Pair removals with a visible :focus-visible ring or equivalent."
            }
        ];
    }
};

export default {
    plugins: [
        bettera11y({
            rules: [...colorContrast, warnOnOutlineNone]
        })
    ]
};
```

### Presets (`recommendedPreset`, `strictPreset`, `wcagAaBaselinePreset`)

These are re-exported from **`bettera11y`** for convenience. You can pass them as **`rules`**, but on **CSS-only** input most preset rules are markup-oriented and return **no diagnostics** while still being evaluated. For PostCSS pipelines, the default contrast-only set—or **`[...colorContrast, …custom]`** as above—is usually clearer than dropping in a full preset unchanged.

```javascript
import bettera11y, { recommendedPreset } from "postcss-bettera11y";

export default {
    plugins: [bettera11y({ rules: recommendedPreset })]
};
```

### Programmatic audit without PostCSS

Use **`runCssAudit`** when you already have a CSS string (for example from a design-token pipeline) and want the same logic as the plugin:

```javascript
import { normalizePostcssOptions, runCssAudit } from "postcss-bettera11y";

const css = `.bad { color: #777777; background-color: #888888; }`;

const { result, summary } = await runCssAudit(
    css,
    "virtual/tokens.css",
    normalizePostcssOptions({
        ruleOptions: {
            "color-contrast": { minContrastNormal: 4.5 }
        }
    })
);

console.log(summary, result.diagnostics);
```

### Content fingerprint (`hashContent`)

```javascript
import { hashContent } from "postcss-bettera11y";

const a = hashContent(cssString);
```

The PostCSS plugin uses this (with the input path) when **`cache: true`** to skip re-auditing unchanged CSS.

## Examples

See [examples/README.md](examples/README.md). From the repo root, run **`npm run example:build`** to build the plugin and exercise the **postcss-cli** demo (contrast warnings in the terminal).

## License

MIT
