// rollup.config.js
import fs from 'fs'
import path from 'path'
import vue from 'rollup-plugin-vue'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import babel from '@rollup/plugin-babel'
import ttypescript from 'ttypescript'
import typescript from 'rollup-plugin-typescript2'
import minimist from 'minimist'

// Get browserslist config and remove ie from es build targets
const esbrowserslist = fs
  .readFileSync('./.browserslistrc')
  .toString()
  .split('\n')
  .filter(entry => entry && entry.substring(0, 2) !== 'ie')

// Extract babel preset-env config, to combine with esbrowserslist
const babelPresetEnvConfig = require('../babel.config').presets.filter(
  entry => entry[0] === '@babel/preset-env'
)[0][1]

const argv = minimist(process.argv.slice(2))

const projectRoot = path.resolve(__dirname, '..')

const baseConfig = {
  input: 'src/entry.ts',
  plugins: {
    preVue: [
      alias({
        entries: [
          {
            find: '@',
            replacement: `${path.resolve(projectRoot, 'src')}`
          }
        ]
      })
    ],
    replace: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    vue: {
      css: true,
      template: {
        isProduction: true
      }
    },
    postVue: [
      resolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue']
      }),
      commonjs()
    ],
    babel: {
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
      babelHelpers: 'bundled'
    }
  }
}

// ESM/UMD/IIFE shared settings: externals
// Refer to https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
const external = [
  // list external dependencies, exactly the way it is written in the import statement.
  // eg. 'jquery'
  'vue',
  'vue-property-decorator',
  'vue-class-component',
  'svg2roughjs'
]

// Customize configs for individual targets
const buildFormats = []
if (!argv.format || argv.format === 'es') {
  const esConfig = {
    ...baseConfig,
    input: 'src/entry.esm.ts',
    external,
    output: {
      file: 'dist/sketch-svg.esm.js',
      format: 'esm',
      exports: 'named'
    },
    plugins: [
      replace(baseConfig.plugins.replace),
      ...baseConfig.plugins.preVue,
      vue(baseConfig.plugins.vue),
      ...baseConfig.plugins.postVue,
      // Only use typescript for declarations - babel will
      // do actual js transformations
      typescript({
        typescript: ttypescript,
        useTsconfigDeclarationDir: true,
        emitDeclarationOnly: true
      }),
      babel({
        ...baseConfig.plugins.babel,
        presets: [
          [
            '@babel/preset-env',
            {
              ...babelPresetEnvConfig,
              targets: esbrowserslist
            }
          ]
        ]
      })
    ]
  }
  buildFormats.push(esConfig)
}

// Export config
export default buildFormats
