import fs from "fs";
import typescript from "rollup-plugin-typescript";

const header_plugin = {
    banner() {
        return fs.readFileSync("src/header.txt", { encoding: "utf-8" });
    }
}

export default {
    input: "./src/main.ts",
    plugins: [
        typescript(),
        header_plugin,
    ],
    watch: {
        include: "src/**",
    },
    output: {
        file: "dist/script.user.js",
        format: "iife",
    },
}