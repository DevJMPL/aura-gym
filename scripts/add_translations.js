const fs = require('fs')
const path = require('path')

const newTranslationsEs = JSON.parse(process.argv[2])
const newTranslationsEn = JSON.parse(process.argv[3])

const esPath = path.join(__dirname, '../src/renderer/src/locales/es.json')
const enPath = path.join(__dirname, '../src/renderer/src/locales/en.json')

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'))
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'))

// Deep merge
function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]))
    }
  }
  Object.assign(target || {}, source)
  return target
}

mergeDeep(esData, newTranslationsEs)
mergeDeep(enData, newTranslationsEn)

fs.writeFileSync(esPath, JSON.stringify(esData, null, 2))
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2))
