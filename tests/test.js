const prettier = require('prettier')
const path = require('path')
const { execSync } = require('child_process')

function format(str, options = {}) {
  return prettier
    .format(str, {
      plugins: [path.resolve(__dirname, '..')],
      semi: false,
      singleQuote: true,
      printWidth: 9999,
      parser: 'html',
      ...options,
    })
    .trim()
}

function formatFixture(name) {
  let binPath = path.resolve(__dirname, '../node_modules/.bin/prettier')
  let filePath = path.resolve(__dirname, `fixtures/${name}/index.html`)
  return execSync(`${binPath} ${filePath}`).toString().trim()
}

let yes = '__YES__'
let no = '__NO__'
let testClassName = 'sm:p-0 p-0'
let testClassNameSorted = 'p-0 sm:p-0'

function t(strings, ...values) {
  let input = ''
  strings.forEach((string, i) => {
    input += string + (values[i] ? testClassName : '')
  })

  let output = ''
  strings.forEach((string, i) => {
    let value = values[i] || ''
    if (value === yes) value = testClassNameSorted
    else if (value === no) value = testClassName
    output += string + value
  })

  return [input, output]
}

let html = [
  t`<div class="${yes}"></div>`,
  t`<div class="${no} {{ 'p-0 sm:p-0 m-0' }}"></div>`,
  t`<div not-class="${no}"></div>`,
]

let css = [t`@apply ${yes};`, t`@not-apply ${no};`]

let javascript = [
  t`;<div class="${yes}"></div>`,
  t`;<div not-class="${no}"></div>`,
  t`;<div class={\`${yes} \${'${yes}'} \${'${yes}' ? '${yes}' : '${yes}'}\`}></div>`,
  t`;<div class={'${yes}'}></div>`,
  t`;<div class={'${yes}' + '${yes}'}></div>`,
  t`;<div class={'${yes}' ? '${yes}' + '${yes}' : '${yes}'}></div>`,
  t`;<div class={clsx('${yes}', ['${yes}'])}></div>`,
  t`;<div class={clsx({ '${yes}': '${yes}' })}></div>`,
  t`;<div class={{ '${yes}': '${yes}' }['${yes}']}></div>`,
]
javascript = javascript.concat(
  javascript.map((test) => test.map((t) => t.replace(/class=/g, 'className=')))
)

let vue = [
  ...html,
  t`<div :class="'${yes}'"></div>`,
  t`<div :class="'${yes}' + '${yes}'"></div>`,
  t`<div :class="['${yes}', '${yes}']"></div>`,
  t`<div :class="[cond ? '${yes}' : '${yes}']"></div>`,
  t`<div :class="{ '${yes}': true }"></div>`,
  t`<div :class="clsx('${yes}')"></div>`,
]

let tests = {
  html,
  lwc: html,
  vue,
  angular: vue.map((test) =>
    test.map((t) => t.replace(/:class=/g, '[ngClass]='))
  ),
  css,
  scss: css,
  less: css,
  babel: javascript,
  typescript: javascript,
  'babel-ts': javascript,
  flow: javascript,
  'babel-flow': javascript,
  espree: javascript,
  meriyah: javascript,
}

describe('parsers', () => {
  for (let parser in tests) {
    test(parser, () => {
      for (let [input, expected] of tests[parser]) {
        expect(format(input, { parser })).toEqual(expected)
      }
    })
  }
})

test('non-tailwind classes', () => {
  expect(
    format('<div class="sm:lowercase uppercase potato text-sm"></div>')
  ).toEqual('<div class="potato text-sm uppercase sm:lowercase"></div>')
})

test('inferred config path', () => {
  expect(formatFixture('basic')).toEqual(
    '<div class="bg-red-500 sm:bg-tomato"></div>'
  )
})

test('inferred config path (.cjs)', () => {
  expect(formatFixture('cjs')).toEqual(
    '<div class="bg-red-500 sm:bg-hotpink"></div>'
  )
})

test('explicit config path', () => {
  expect(
    format('<div class="sm:bg-tomato bg-red-500"></div>', {
      tailwindConfig: path.resolve(
        __dirname,
        'fixtures/basic/tailwind.config.js'
      ),
    })
  ).toEqual('<div class="bg-red-500 sm:bg-tomato"></div>')
})

test('plugins', () => {
  expect(formatFixture('plugins')).toEqual(
    '<div class="uppercase line-clamp-1 sm:line-clamp-2"></div>'
  )
})