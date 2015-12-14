'use strict'
/* global Given, Then, describe */
const expect = require('chai').expect
const nock = require('nock')
const fs = require('fs')
const hostname = 'http://hydro.marlborough.govt.nz'

describe('when using getData', () => {
  var ht
  var mockHttp

  Given(() => {
    ht = require('./index')
  })
  Then('It should have a hilltop object', () => expect(ht).to.exist)
  Then('It should have a getDataFunction', () => expect(ht.getData).to.be.a('function'))
  Then('It should expose the url of the service', () => expect(ht.url).to.be.a('string'))

  describe('when invoking', () => {
    var siteName
    var measurementName
    var dateStart
    var dateEnd
    var interval
    var successCase
    var failCase

    Given(() => {
      siteName = '753'
      measurementName = 'MR_Water'
      dateStart = '2014-01-01'
      dateEnd = '2015-12-01'
      interval = '1 month'
    })

    Given(function (done) {
      fs.readFile('./test-fixtures/getData.xml', 'utf8', (err, xmlData) => {
        if (err) {
          console.error('error getting test fixture', err)
          throw err
          done(err)
          return
        }
        mockHttp = nock(hostname)
          // .log(console.log)
          .get('/data.hts')
          .query({
            Service: 'Hilltop',
            Request: 'GetData',
            Site: siteName,
            Measurement: measurementName,
            From: dateStart,
            To: dateEnd,
            Interval: interval
          })
          .reply(200, xmlData, {
            'Content-Type': 'text/xml'
          })
        done()
      })
    })

    When((done) => {
      ht.getData(siteName, measurementName, dateStart, dateEnd, interval)
        .then(
          success => {
            successCase = success
            done()
          },
          fail => {
            failCase = fail
            done()
          })
    })

    Then('it should not have an error', () => {
      expect(failCase).not.to.exist
      mockHttp.done()
    })
    Then('it should returned an array of datums', () => {
      expect(successCase).to.exist

      successCase.forEach(datum => {
        expect(datum.time).to.be.a.string
        expect(datum.value).to.be.a.number
      })

      mockHttp.done()
    })
  })
})
