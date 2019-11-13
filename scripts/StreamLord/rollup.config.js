import fs from "fs";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
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
        commonjs({
            include: "node_modules/**",
        }),
        resolve(),
        header_plugin,
    ],
    watch: {
        include: "src/**",
    },
    output: {
        file: "dist/script.user.js",
        format: "iife",
        strict: false,
    },
}