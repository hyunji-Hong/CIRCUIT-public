const puppeteer = require('puppeteer-core');
const CDP = require('chrome-remote-interface');
const chromeLauncher = require( 'chrome-launcher');
const util = require( 'util' );
const request = require( 'request' );
const usage = require( 'usage' );
const fs = require('fs');
const path = require( 'path' );
const urlExists = require('url-exists');

function urlCheck ( _inputUrl ) {
  let httpCheck = /(http:\/\/)|(https:\/\/)/;
  urlExists( _inputUrl, function( err, exists ) {
    if ( !exists ) {
      _inputUrl = 'https://' + _inputUrl;
    }
  })
  return _inputUrl;
}

const args = process.argv.slice( 2 );
const url = urlCheck( args[ 0 ] );

async function detector( url) {
	const target = url.replace(/(http:\/\/)|(https:\/\/)/, '');
	// Get chrome & start
	const chrome = await chromeLauncher.launch( {
    	port : 9222,
    	chromeFlags: [ '--disable-gpu']
  	});

	CDP( async function ( client ) {
		const { Network, Page, HeapProfiler, Performance } = client;
	    const resp = await util.promisify(request)(`http://localhost:${chrome.port}/json/version`);
	    const {webSocketDebuggerUrl} = JSON.parse(resp.body);
	    const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});
	    const [ page ] = await browser.pages();
	    await page.setViewport( { width : 1980, height : 1080 } );
	    try{
	    	await Network.enable();
	    	await Performance.enable();
	    	await Page.enable();
	    	await HeapProfiler.enable();

	    	if ( await Network.canClearBrowserCache() ) {
	    		await Network.clearBrowserCache();
	    	}

	    	if ( await Network.canClearBrowserCookies() ) {
	    		await Network.clearBrowserCookies();
	    	}
	    	await Promise.all( [
	    		page.goto( url ),
	    		page.waitForNavigation( { waitUntil : 'load' } )
    		])

    		await page.waitFor( 2000 );
	    } catch ( err ) {
	    	client.close();
	    	browser.close();
	    	return -1;
	    }

	    await page.evaluate( () => {
	    	window.map = new Map();
	    })

	    const workerPrototype = await page.evaluateHandle( () => {
	    	return Worker.prototype;
	    })

	    const workerInstances = await page.queryObjects( workerPrototype );
	    //const count = await page.evaluate( workers => workers.lenght, workerInstances );
	    await page.evaluate( ( _workerInstances ) => {
	    	eval( _workerInstances ).forEach( ( worker ) => {
	    		worker.addEventListener( 'message', ( event ) => {
	    			console.log( event.data );
	    		});	
	    	})
	    }, workerInstances )
		
		const handle = await page.evaluateHandle(() => ({worker, document}));
		const properties = await handle.getProperties();
		const windowHandle = properties.get('worker');
		const documentHandle = properties.get('document');

		await page.evaluate( ( temp ) => {
			console.log( temp );
		}, windowHandle);

		await handle.dispose();
	    
	    await workerInstances.dispose();
	    await workerPrototype.dispose();

	    
	})
}

detector( url );
    