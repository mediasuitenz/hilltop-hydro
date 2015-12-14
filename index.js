'use strict'
var R = require('ramda')
var request = require('request')
var xml = require('xml2js')
var chalk = require('chalk')
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
var getData = R.pipe(
  getFromApi('GetData'),
  then(getDatumsFromResponse)
)

/**
 * Get all sites for a measurmenet
 * @param {String} Name of ameasurement IE 'MR_Water'
 * @return {[Object]} Array of the form {name: <string> }
 */
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

function getDatumsFromResponse (result) {
  return result.Hilltop.Measurement[0].Data[0].E
    .map((point) => {
      return {time: point.T[0], value: point['I1'][0]}
    })
}

module.exports = {
  url: API_URL,
  getData: getData,
  getSitesForMeasurement: getSitesForMeasurement
}
