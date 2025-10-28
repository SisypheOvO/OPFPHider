import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src-ts/main.ts',
    output: {
        file: 'dist/opfphider.user.js',
        format: 'iife',
        banner: `// ==UserScript==
// @name         OPFPHider
// @name:zh-CN   OPFP隐藏器
// @namespace    URL
// @version      2.2.0
// @description  Hide Osu! Profile sections optionally
// @description:zh-CN  可选地隐藏Osu!个人资料的各个不同部分
// @author       Sisyphus
// @license      MIT
// @homepage     https://github.com/SisypheOvO
// @match        https://osu.ppy.sh/users/*
// @run-at       document-end
// @grant        none
// @downloadURL https://raw.githubusercontent.com/SisypheOvO/OPFPHider/main/dist/opfphider.user.js
// @updateURL https://raw.githubusercontent.com/SisypheOvO/OPFPHider/main/dist/opfphider.user.js
// ==/UserScript==

`,
    },
    plugins: [
        typescript({
            tsconfig: './tsconfig.json'
        })
    ]
};