import { getOptions } from 'loader-utils'

const isFunc = (o: any) => typeof o === 'function'

type Func<T> = (...args: any[]) => T;
type ConditionType = RegExp | string | Func<boolean>;

interface LoaderOption {
  test (s: string): boolean;
  include: ConditionType | Array<ConditionType>;
  exclude: ConditionType | Array<ConditionType>;
}

const evalCondition = (condition: ConditionType | ConditionType[], path: string): boolean => {
  const c = condition as any
  if (typeof c === 'string') {
    return path.startsWith(c)
  } if (isFunc(c.test)) {
    return c.test(path)
  } if (isFunc(c)) {
    return c(path) === true
  } if (Array.isArray(c)) {
    return !c.some(t => !evalCondition(t, path))
  }
  return false
}

const checkLoaderConditions = (loader: LoaderOption, resource: string): boolean => {
  const { test, include, exclude } = loader
  if (!test || evalCondition(test, resource)) {
    if (!exclude || !evalCondition(exclude, resource)) {
      return !include || evalCondition(include, resource)
    }
  }
  return false
}

module.exports = function (this: any, content: string | Buffer): string | Buffer | undefined {
  this.cacheable && this.cacheable()

  // Loader Options
  const options = getOptions(this) || {}

  const resourcePath = this.resourcePath
  const oneOf = options.oneOf

  if (!oneOf || !oneOf.length) {
    throw new Error('oneOf not valid')
  }

  for (let i = -1, conf; conf = oneOf[++i];) {
    if (checkLoaderConditions(conf, resourcePath)) {
      const { loader, options } = conf
      const loaderFn = require(loader)
      const childContext = {
        ...this,
        query: {
          ...options,
          esModule: false
        }
      }
      if (!loaderFn.raw && Buffer.isBuffer(content)) {
        content = content.toString('utf8')
      }
      return loaderFn.call(childContext, content)
    }
  }

  return content
}

module.exports.raw = true
