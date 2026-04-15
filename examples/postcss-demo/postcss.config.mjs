import bettera11y from "postcss-bettera11y";

export default {
    plugins: [
        bettera11y({
            logLevel: "warn",
            cache: false
        })
    ]
};
