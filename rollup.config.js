import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const babelled = babel({
  exclude: 'node_modules/**', // only transpile our source code
  plugins: ['@babel/plugin-proposal-private-methods'],
})

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: pkg.rollup.websurf.main,
        format: 'cjs',
      },
      {
        file: pkg.rollup.websurf.module,
        format: 'es',
      },
      {
        file: pkg.rollup.websurf.browser,
        format: 'iife',
        name: 'WebSurf',
      },
    ],
    plugins: [resolve(), babelled, commonjs(), terser()],
  },
  {
    input: 'src/Surfer.js',
    output: [
      {
        file: pkg.rollup.websurfer.main,
        format: 'cjs',
      },
      {
        file: pkg.rollup.websurfer.module,
        format: 'es',
      },
      {
        file: pkg.rollup.websurfer.browser,
        format: 'iife',
        name: 'Surfer',
      },
    ],
    plugins: [resolve(), babelled, commonjs(), terser()],
  },
]
