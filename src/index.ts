/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type * as webpack from 'webpack'
import { getOptions } from 'loader-utils'

const isFunc = (o: any) => typeof o === 'function'

type RegExpLike = RegExp | { test (o: string): boolean; }
type Func<T> = (...args: any[]) => T;
type RuleSetCondition = webpack.RuleSetCondition
type LoaderDefinitionFunction = webpack.LoaderDefinitionFunction;

interface SourceMap {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
  names?: string[];
}

interface RuleSetRule {
  test: webpack.RuleSetCondition;
  exclude?: webpack.RuleSetCondition | undefined;
  include?: webpack.RuleSetCondition | undefined;
  loader?: string | undefined;
  options?: Kv;
  /**
   * Modifiers applied to the module when rule is matched
   */
  use?: webpack.RuleSetUse | undefined;
}

export interface LoaderOptions extends RuleSetRule {
  oneOf: Array<RuleSetRule>;
}

const evalCondition = (c: RuleSetCondition, path: string): boolean => {
  let re: RegExpLike
  if (typeof c === 'string') {
    return path.startsWith(c)
  } if (isFunc((re = c as RegExpLike).test)) {
    return re.test(path)
  } if (isFunc(c)) {
    return (c as Func<boolean>)(path) === true
  } if (Array.isArray(c)) {
    return c.some(t => evalCondition(t, path))
  }
  return false
}

const checkLoaderConditions = (loader: RuleSetRule, resource: string): boolean => {
  const { test, include, exclude } = loader
  if (!test || evalCondition(test, resource)) {
    if (!exclude || !evalCondition(exclude, resource)) {
      return !include || evalCondition(include, resource)
    }
  }
  return false
}

// https://webpack.js.org/api/loaders/
const loader: LoaderDefinitionFunction = function (contents, map, meta): string | void {
  this.cacheable && this.cacheable()

  // Loader Options
  const options: LoaderOptions = getOptions(this) || {}

  const resourcePath = this.resourcePath
  const oneOf = options.oneOf

  if (!oneOf || !oneOf.length) {
    throw new Error('options oneOf invalid')
  }

  let list: RuleSetRule[] = []
  for (let i = -1, conf: RuleSetRule; conf = oneOf[++i];) {
    if (checkLoaderConditions(conf, resourcePath)) {
      const { loader, use } = conf
      if (loader) {
        list.push(conf)
      } else if (use && Array.isArray(use)) {
        list = use.map(ld => (typeof ld === 'string' ? { loader: ld } : ld) as RuleSetRule)
      }
      break
    }
  }

  if (list.length > 0) {
    // use async mode
    const callback = this.async()

    const next = (content: string | Buffer, map?: string | SourceMap, meta?: Kv) => {
      const internalCb = (err: Error | null, ...args: any) => {
        if (!err && list.length > 0) {
          next.apply(this, args)
        } else {
          callback(err, ...args)
        }
      }

      if (!list.length) {
        return internalCb(null, content, map, meta)
      }

      const conf = list.pop()
      const { loader, options } = conf!

      const childContext = {
        ...this,
        async: () => internalCb,
        query: { ...options }
      }

      const loaderFn = require(loader!)
      if (!loaderFn.raw && Buffer.isBuffer(content)) {
        content = content.toString('utf8')
      }

      try {
        const ret = loaderFn.call(childContext, content, map, meta)
        // compatible with sync mode
        if (ret !== undefined) {
          next(ret, map, meta)
        }
      } catch (ex) {
        internalCb(ex as Error, content, map, meta)
      }
    }

    return next(contents, map, meta)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return contents
};

(loader as any).raw = true

export default loader
