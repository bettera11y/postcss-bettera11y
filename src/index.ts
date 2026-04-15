export { bettera11yPostcss } from "./create-postcss-plugin";
export { hashContent, normalizePostcssOptions, runCssAudit } from "./run-audit";
export type { BetterA11yPostcssLogLevel, BetterA11yPostcssOptions, BetterA11yPostcssNormalizedOptions } from "./types";
export { recommendedPreset, strictPreset, wcagAaBaselinePreset } from "bettera11y";

import { bettera11yPostcss } from "./create-postcss-plugin";

export default bettera11yPostcss;
