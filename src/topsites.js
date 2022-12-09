//
// Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
//
// Licensed under the MIT License. See the LICENSE accompanying this file
// for the specific language governing permissions and limitations under
// the License.
//

const rp   = require('request-promise')
const util = require('util');
const readline = require('readline');
const fs = require('fs');

const apiHost = 'ats.api.alexa.com'

global.fetch = require("node-fetch");

function callATS(apikey, country) {
  var uri = '/api?Action=TopSites&Count=5&Start=10000&CountryCode=' + country + '&ResponseGroup=Country&Output=json';

  var opts = {
    host: apiHost,
    path: uri,
    uri: 'https://' + apiHost + uri,
    json: true,
    headers: {'x-api-key': apikey},
        resolveWithFullResponse: true
  }

  rp(opts)
  .then( (html)=> console.log(`${JSON.stringify(html.body, null, 2)}`) )
  .catch( (e)=> console.log('failed:'+e))
}

if (process.argv.length != 4) {
  console.log(`Usage: node ${process.argv[1]} APIKEY COUNTRY`);
  process.exit(0);
}

callATS(process.argv[2], process.argv[3])
