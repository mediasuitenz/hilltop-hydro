'use strict'
/* global Given, When, Then, describe */
const expect = require('chai').expect
const nock = require('nock')
const fs = require('fs')
const mockHostname = 'http://mockhostforhilltop.wat'
const mockDataAPIEndpoint = '/data.hts'
const hostname = mockHostname + mockDataAPIEndpoint

describe('when using getData', () => {
  var ht
  var mockHttp

  Given(() => {
    ht = require('./index')(hostname)
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
          done(err)
          throw err
        }
        mockHttp = nock(mockHostname)
          // .log(console.log)
          .get(mockDataAPIEndpoint)
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
      console.log('leinvoke lemock')
      ht.getData(siteName, measurementName, dateStart, dateEnd, interval)
        .then(
          success => {
            successCase = success
            done()
          },
          fail => {
            console.log('error happened WAT', fail)
            failCase = fail
            done()
          })
    })

    Then('it should not have an error', () => {
      expect(failCase).not.to.exist
      mockHttp.done()
    })
    Then('it should return an array of datums', () => {
      expect(successCase).to.exist

      successCase.forEach(datum => {
        expect(datum.time).to.be.a.string
        expect(datum.value).to.be.a.number
      })

      mockHttp.done()
    })
  })
})
