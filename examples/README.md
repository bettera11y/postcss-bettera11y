# Examples

Optional demos that link the package from the repo root with **`file:../..`**.

## postcss-demo

Minimal **postcss-cli** pipeline. From the **repository root**:

```bash
npm run example:build
```

That builds `postcss-bettera11y`, installs dependencies in `examples/postcss-demo`, runs PostCSS on `input.css`, and writes `dist/output.css`. Watch the terminal for BetterA11y contrast warnings.

To work only inside the example after a root `npm run build`:

```bash
cd examples/postcss-demo
npm install
npm run build
```
