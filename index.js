'use strict'
var R = require('ramda')
var request = require('request')
var xml = require('xml2js')
var chalk = require('chalk')
// Use `DEBUG=hilltop node <yourApp>` to enable tracing for the hilltop module
var debug = require('debug')('hilltop')

var then = R.curry((cb, p) => p.then(cb))

const API_URL = 'http://hydro.marlborough.govt.nz/data.hts'

function parseXmlString (dataString) {
  return new Promise((resolve, reject) => {
    xml.parseString(dataString, function (err, result) {
      if (err) {
        reject(err)
      } else if (R.path(['HilltopServer', 'Error'], result)) {
        reject(result)
      } else if (R.path(['HillTopServer', 'Error'], result)) {
        reject(result)
      } else {
        resolve(result)
      }
    })
  })
}

var getFromApi = R.curry(function (requestType, site, measurement, from, to, interval) {
  var defaultQsParams = {
    Service: 'Hilltop',
    Request: requestType
  }
  debug(chalk.blue('requestType: ', requestType, '\nsite: ', site, '\nmeasurement: ', measurement, '\nfrom: ', from, '\nto: ', to, '\ninterval: ', interval))

  return new Promise((resolve, reject) => {
    let queryParams = Object.assign(defaultQsParams, {
      Site: site,
      Measurement: measurement,
      From: from,
      To: to,
      Interval: interval
    })
    request(API_URL, {
      method: 'get',
      qs: queryParams
    }, (err, response, body) => {
      if (err) {
        reject(err)
      } else {
        resolve(body)
      }
    })
  }).then(parseXmlString)
})

function getDatumsFromResponse (result) {
  return result.Hilltop.Measurement[0].Data[0].E
    .map((point) => {
      return {time: point.T[0], value: point['I1'][0]}
    })
}

// Get Data for a site
// ---
// get data for a measurement, this function is curried
//
// ` site -> measurement -> from -> to -> Promise<[]datums>`
//
// params:
//
// - site, the name of the site to get data for
// - measurement, the name of the measurement to query for
// - from, the iso8061 string for the date to query from
// - to, the iso8061 string for the date to query from
// - datums {[Object]} an array of measurements { time: iso8061 string, value: number}
//
// Usage:
// ```js
//  > var ht = require('ht')
//  > ht.getData('753', 'MR_Water', '2014-01-01', '2015-12-01', '1 month')
//    .then((data) console.log(data))
//
//    [
//     { time: '2014-02-01T00:00:00', value: 45.56 },
//     { time: '2014-03-01T00:00:00', value: 35417.84 },
//     { time: '2014-04-01T00:00:00', value: 46573 },
//    ]
// ```
// output
var getData = R.pipe(
  getFromApi('GetData'),
  then(getDatumsFromResponse)
)

//
// Get all sites for a measurmenet
// ---
// `measurement -> Promise<[]sites>`
//
// params:
//
// - measurement: the name of a measurement
// - []sites: the array of site names which have this measurement
//
// usage:
// ```js
// > var ht = require('ht')
// > ht.getSitesForMeasurement('MR_Water')
//     .then(res => console.log(res))
// [
//   {name: 'Detroit'},
//   {name: 'Whangarei'},
//   {name: 'Gore'}
// ]
// ```
//
var getSitesForMeasurement = R.pipe(
  getFromApi('SiteList', null, R.__, null, null, null),
  then(
    R.pipe(
      R.path(['HilltopServer', 'Site']),
      R.map(d => {
        return { name: d['$'].Name }
      })
    )
  )
)

module.exports = {
  url: API_URL,
  getData: getData,
  getSitesForMeasurement: getSitesForMeasurement
}
