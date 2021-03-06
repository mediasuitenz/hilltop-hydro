'use strict'
/* global Given, When ,Then, describe */
const expect = require('chai').expect
const nock = require('nock')
const fs = require('fs')
const mockHostname = 'http://mockhostforhilltop.wat'
const mockDataAPIEndpoint = '/data.hts'
const hostname = mockHostname + mockDataAPIEndpoint

describe('when using getSitesForMeasurement', () => {
  var ht
  var mockHttp

  Given(() => {
    ht = require('./index')(hostname)
  })
  Then('It should have a hilltop object', () => expect(ht).to.exist)
  Then('It should expose the url of the service', () => expect(ht.url).to.be.a('string'))

  describe('when invoking', () => {
    var measurementName
    var successCase
    var failCase

    Given(() => {
      measurementName = ''
    })

    Given(function (done) {
      fs.readFile('./test-fixtures/sites-for-measurement.xml', 'utf8', (err, xmlData) => {
        if (err) {
          console.error('error getting test fixture', err)
          done(err)
          throw err
        }
        mockHttp = nock(mockHostname)
          .get(mockDataAPIEndpoint)
          .query({
            Service: 'Hilltop',
            Request: 'SiteList',
            Site: '',
            Measurement: measurementName,
            From: '',
            To: '',
            Interval: ''

          })
          .reply(200, xmlData, {
            'Content-Type': 'text/xml'
          })
        done()
      })
    })

    When((done) => {
      ht.getSitesForMeasurement(measurementName)
        .then(
          success => {
            successCase = success
            console.log('pass')
            done()
          },
          fail => {
            console.log('fial', fail)
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
        expect(datum.name).to.be.a.string
      })
      mockHttp.done()
    })
  })
})
