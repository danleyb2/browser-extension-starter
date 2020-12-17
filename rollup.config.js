import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import copy from 'rollup-plugin-copy'
import path from 'path'

const Api = path.resolve(__dirname, 'api.js');

export default [
    {
        input: [
            'src/content/index.js',

        ],
        output: {
            file: 'build/content.js',
            format: 'es',
            sourcemap: false
        },
        plugins: [
            resolve(),
            babel(),
            copy({
                targets: [
                    {src: 'manifest.json', dest: 'build'},
                    {src: ['src/popup/index.css', 'src/content/content.css'], dest: 'build'},
                    {src: 'src/popup/index.html', dest: 'build/html'},
                    {src: ['src/api.js', 'src/background/background.html'], dest: 'build' },
                    {src: 'img/**/*', dest: 'build/img'},
                    {src: 'fonts/**/*', dest: 'build/fonts'},
                    {src: 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js', dest: 'build'}
                ]
            })
        ]
    },
    {
        input: [
            'src/background/background.js'
        ],
        output: {
            file: 'build/background.js',
            format: 'es',
            sourcemap: false
        },
        plugins: [
            // resolve({
            //     only: ['lit-element', 'lit-html' ]
            // }),
        ],
        external: [Api]
    },
    {
        input: [
            'src/popup/index.js'
        ],
        output: {
            file: 'build/index.js',
            format: 'es',
            sourcemap: false
        },
        plugins: [
            resolve({
                only: ['lit-element', 'lit-html' ]
            }),
        ],
        external: [Api]
    }
];
