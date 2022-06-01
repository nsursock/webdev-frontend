const { devMode, statPwd } = require('./src/_data/env')
// const { Appsignal } = require('@appsignal/nodejs')

// const appsignal = new Appsignal({
//   active: !devMode,
//   name: 'CrackingDaCode',
// })

const { strictEqual } = require('assert')
const yaml = require('js-yaml')
const format = require('date-fns/format')
const fetch = require('node-fetch-commonjs')

module.exports = (config) => {
  config.addFilter('date', function (date, dateFormat) {
    return format(date, dateFormat)
  })

  function filterTagList(tags) {
    return (tags || []).filter((tag) => ['all', 'blog'].indexOf(tag) === -1)
  }
  config.addFilter('filterTagList', filterTagList)
  config.addCollection('tagList', function (collection) {
    let tagSet = new Set()
    collection.getAll().forEach((item) => {
      ;(item.data.tags || []).forEach((tag) => tagSet.add(tag))
    })

    return filterTagList([...tagSet]).sort()
  })

  config.addFilter('isPaginated', (url) => new RegExp('^/[0-9]+/$').test(url))

  function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1)
  }

  // config.addCollection('stats', async function (collection) {
  //   let data = await fetch(
  //     'https://plausible.io/api/v1/stats/aggregate?site_id=nsursock.netlify.app&period=6mo&metrics=visitors,pageviews,bounce_rate,visit_duration',
  //     {
  //       method: 'GET',
  //       headers: {
  //         // Authorization: `Bearer ${process.env.PLAUSIBLE_KEY}`,
  //         Authorization: `Bearer 2K985BK3VVcjSZIpdUo6mbWti2118_DoDvoi9k2nxxZwMPoOmrYFYpARCPUhbR97`,
  //       },
  //     }
  //   )
  //   let json = (await data.json()).results
  //   let stats = []
  //   for (const prop in json) {
  //     stats.push({
  //       name: prop
  //         .split('_')
  //         .map((w) => capitalize(w))
  //         .join(' '),
  //       value: json[prop].value,
  //     })
  //   }
  //   stats.push({
  //     name: 'Views / Visitor',
  //     value: (json.pageviews.value / json.visitors.value).toFixed(2),
  //   })
  //   return stats
  // })

  config.addPassthroughCopy({ public: './' })
  config.setBrowserSyncConfig({
    files: ['dist/**/*'],
    open: true,
    // Tweak for Turbolinks & Browserstack Compatibility
    snippetOptions: {
      rule: {
        match: /<\/head>/i,
        fn: function (snippet, match) {
          return snippet + match
        },
      },
    },
  })
  config.setDataDeepMerge(true)
  config.addDataExtension('yaml', (contents) => yaml.load(contents))

  // config.addPassthroughCopy({
  //   './assets/main.bundle.js': './static/js/main.bundle.js',
  // })
  config.addPassthroughCopy('./src/static')

  config.addFilter('split', function (str, sep) {
    return (str + '').split(sep)
  })

  // config.addNunjucksAsyncFilter('views', async function (posts, callback) {
  //   let data = await fetch(
  //     'https://plausible.io/api/v1/stats/breakdown?site_id=nsursock.netlify.app&period=6mo&property=event:page',
  //     {
  //       method: 'GET',
  //       headers: {
  //         // Authorization: `Bearer ${process.env.PLAUSIBLE_KEY}`,
  //         Authorization: `Bearer 2K985BK3VVcjSZIpdUo6mbWti2118_DoDvoi9k2nxxZwMPoOmrYFYpARCPUhbR97`,
  //       },
  //     }
  //   )
  //   let json = (await data.json()).results
  //   let views = json?.filter((item) => item.page.includes('/blog/'))

  //   callback(
  //     null,
  //     views?.map((view) => {
  //       const index = posts.findIndex((post) => post.url === view.page)
  //       if (index !== -1) return { post: posts[index], views: view.visitors }
  //     })
  //   )
  // })

  // config.addNunjucksAsyncFilter('top', async function (posts, callback) {
  //   let data = await fetch(
  //     'https://plausible.io/api/v1/stats/breakdown?site_id=nsursock.netlify.app&period=6mo&property=event:page',
  //     {
  //       method: 'GET',
  //       headers: {
  //         // Authorization: `Bearer ${process.env.PLAUSIBLE_KEY}`,
  //         Authorization: `Bearer 2K985BK3VVcjSZIpdUo6mbWti2118_DoDvoi9k2nxxZwMPoOmrYFYpARCPUhbR97`,
  //       },
  //     }
  //   )
  //   let json = (await data.json()).results
  //   let tops = json?.filter((item) => item.page.includes('/blog/')).slice(0, 3)

  //   callback(
  //     null,
  //     tops?.map((top) => {
  //       const index = posts.findIndex((post) => post.url === top.page)
  //       if (index !== -1) return posts[index]
  //     })
  //   )
  // })

  config.addNunjucksAsyncFilter('top', async function (posts, callback) {
    let token = await fetch(
      'https://statumami-production.up.railway.app/api/auth/login',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: statPwd,
        }),
      }
    )
    token = (await token.json()).token

    let endAt = new Date().getTime()
      startAt = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)

    let data = await fetch(
      `https://statumami-production.up.railway.app/api/website/1/metrics?start_at=${startAt}&end_at=${endAt}&type=url`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    let json = await data.json()
    let tops = json?.filter((item) => item.x.includes('/blog/')).slice(0, 3)

    callback(
      null,
      tops?.map((top) => {
        const index = posts.findIndex((post) => post.url === top.x)
        if (index !== -1) return posts[index]
      })
    )
  })

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
    htmlTemplateEngine: 'njk',
  }
}
