// vim: set ft=javascript fdm=marker et ff=unix tw=80 sw=2:
// author: allex_wang <http://iallex.com>

import path from 'path'

import { version, name, author, license, description, dependencies } from './package.json'

const banner = (name, short = false) => {
  let s
  if (short) {
    s = `/*! ${name} v${version} | ${license} licensed | ${author.name || author} */`
  } else {
    s = `/**
 * ${name} v${version} - ${description}
 *
 * @author ${author}
 * Released under the ${license} license.
 */`
  }
  return s
}

const resolve = p => path.resolve(__dirname, '.', p)

const plugins = [
  'resolve',
  'typescript',
  'commonjs',
]

export default {
  destDir: resolve('lib'),
  dependencies: { events: true, ...dependencies },
  entry: [
    {
      input: resolve('src/index.ts'),
      plugins,
      output: [
        { format: 'cjs', file: 'index.js', banner: banner(name) }
      ]
    }
  ]
}
