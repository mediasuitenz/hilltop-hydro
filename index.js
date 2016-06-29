//
// # hilltop hydro
//
// Provides api access to a hilltop API service, see http://www.hilltop.co.nz/
//
// ## Installation
//
// ```
// npm install --save hilltop-hydro
// ```
//
// ## Debugging
//
// Use `DEBUG=hilltophydro node <yourApp>` to enable tracing for the hilltop module
'use strict'
var R = require('ramda')
var request = require('request')
var xml = require('xml2js')
var chalk = require('chalk')
var debug = require('debug')('hilltophydro')

var then = R.curry((cb, p) => p.then(cb))

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

// Config options
// ----
//
//  - API_URL this is the hostname + endpoint for the hilltop service
//
function buildLibrary (API_URL) {
  var getFromApi = R.curry(function (requestType, site, measurement, from, to, interval, alignment) {
    var defaultQsParams = {
      Service: 'Hilltop',
      Request: requestType
    }
    debug(chalk.blue('\nurl: ', API_URL, '\nrequestType: ', requestType, '\nsite: ', site, '\nmeasurement: ', measurement, '\nfrom: ', from, '\nto: ', to, '\ninterval: ', interval, '\n alignment', alignment))

    return new Promise((resolve, reject) => {
      let queryParams = Object.assign(defaultQsParams, {
        Site: site,
        Measurement: measurement,
        From: from,
        To: to,
        Interval: interval
      })

      if (alignment) {
        queryParams = Object.assign(queryParams, {Alignment: alignment})
      }
      request(API_URL, {
        method: 'get',
        qs: queryParams
      }, (err, response, body) => {
        if (err) {
          debug(chalk.red('error getting the url:', API_URL, ' msg:', err))
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
  // ` site -> measurement -> from -> to -> Optional<Alignment> -> Promise<[]datums>`
  //
  // params:
  //
  // - site, the name of the site to get data for
  // - measurement, the name of the measurement to query for
  // - from, the iso8061 string for the date to query from
  // - to, the iso8061 string for the date to query from
  // - an alignment for the results, I.E for a 1 day interval you may want to align the query for 00:00 to get 24 hours of results from that time
  //
  // returns:
  //
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
    getFromApi('SiteList', null, R.__, null, null, null, null),
    then(
      R.pipe(
        R.path(['HilltopServer', 'Site']),
        R.map(d => {
          return { name: d['$'].Name }
        })
      )
    )
  )

  return {
    url: API_URL,
    getData: getData,
    getSitesForMeasurement: getSitesForMeasurement
  }
}

module.exports = buildLibrary
