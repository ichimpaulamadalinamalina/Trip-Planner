const puppeteer = require("puppeteer");
const Mongo = require('mongodb');
const MongoUrl = "mongodb://localhost:27017/";


const { parentPort, workerData } = require("worker_threads");
parentPort.postMessage(crawler(workerData.search));

function crawler(search) {
  var atractions = [];
  (async () => {
    const browser = await puppeteer.launch({ headless: true }).then(async browser => {

      //Navigate to tripadvisor.com
      const page = await browser.newPage();
      await page.goto("https://www.tripadvisor.com/Search?q=" + search, { waitUntil: 'networkidle2' });

      //Skip cookies
      await page.waitForSelector('[id="onetrust-accept-btn-handler"]');
      await page.$eval('[id="onetrust-accept-btn-handler"]', element => element.click());

      //Locations
      await page.waitForSelector('[data-tab-name="Things to do"]');
      await page.$eval('[data-tab-name="Things to do"]', element => element.click());


      //Set City to Search location
      const waitTillHTMLRendered = async (page, timeout = 30000) => {
        const checkDurationMsecs = 1000;
        const maxChecks = timeout / checkDurationMsecs;
        let lastHTMLSize = 0;
        let checkCounts = 1;
        let countStableSizeIterations = 0;
        const minStableSizeIterations = 3;

        while (checkCounts++ <= maxChecks) {
          let html = await page.content();
          let currentHTMLSize = html.length;

          let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

          //console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

          if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
            countStableSizeIterations++;
          else
            countStableSizeIterations = 0; //reset the counter

          if (countStableSizeIterations >= minStableSizeIterations) {
            //console.log("Page rendered fully..");
            break;
          }

          lastHTMLSize = currentHTMLSize;
          await page.waitForTimeout(checkDurationMsecs);
        }
      };
      await waitTillHTMLRendered(page)

      await page.waitForSelector('#GEO_SCOPE_CONTAINER > div > span.where_neighbor.without_dropdown.ui_icon.caret-down')
      await page.click('#GEO_SCOPE_CONTAINER > div > span.where_neighbor.without_dropdown.ui_icon.caret-down');
      await page.click('#CLEAR_WHERE');
      await page.type('#GEO_SCOPE_CONTAINER > div > span.where_neighbor.without_dropdown.ui_icon.caret-down', search);
      await page.waitForSelector('#TYPEAHEAD_RESULTS_OVERLAY > div.ui_column.is-10.results_panel > div > div.where_results_wrapper.ui_column.is-5 > div > div > ul > li.displayItem.result.selected > div.main-content > div.first-row > span');
      await page.click('#TYPEAHEAD_RESULTS_OVERLAY > div.ui_column.is-10.results_panel > div > div.where_results_wrapper.ui_column.is-5 > div > div > ul > li.displayItem.result.selected > div.main-content > div.first-row > span')

      //Get number of pages
      await page.waitForSelector('[class=pageNumbers]');
      var nopages = await page.$eval('[class=pageNumbers]', element => element.childElementCount);

      page.on('console', async (msg) => {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
         // console.log(await msgArgs[i].jsonValue());
        }
      });
      for (i = 0; i < nopages; i++) {
        //Extract information
        await page.waitForFunction('document.querySelector("body").innerText.includes("Things to do matching")');
        var result = await page.evaluate(() => {
          var locations = [];
          var searchloc = document.body.querySelector('#MAIN_SEARCH_CONTAINER > div > div > span.input_highlight').innerText;
          var items = document.body.querySelectorAll('.result.inner-columns-wrapper');
          items.forEach((item) => {
            let name = item.querySelector('.result-title').firstElementChild.innerText;
            let address = item.querySelector('.address-text').innerText;
            let city = address.split(',');
            let parsedRating = 0;
            let reviewcnt = 0;
            let image = item.querySelector('.inner').style.backgroundImage.slice(4, -1).replace(/"/g, "");

           

            try {
              let ratingElement = item.querySelector('.ui_bubble_rating').getAttribute('class');
              let integer = ratingElement.replace(/[^0-9]/g, '');
              parsedRating = parseInt(integer) / 10;
              reviewcnt = item.querySelector('.review_count').innerText;
            }
            catch
            { }
            if ((((city.length == 5 || city.length == 3) && city[1].includes(searchloc)) || ((city.length == 4 || city.length == 2) && city[0].includes(searchloc))))
              locations.push({
                'location': name,
                'address': address,
                'review': reviewcnt,
                'rating': parsedRating,
                'image': image

              });
          });
          return locations;

        });
        await page.waitForSelector('a.ui_button.nav.next.primary');
        await page.$eval('a.ui_button.nav.next.primary', element => element.click());
        atractions.push(...result);
      }

      Mongo.MongoClient.connect(MongoUrl, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Travel");
        dbo.createCollection(search, function (err, res) {
          if (err) throw err;
          console.log("Collection created!");
        });
        dbo.collection(search).insertMany(atractions, function (err, res) {
          if (err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
          var myquery = { localitate: search };
          var newvalues = { $set: { status: "ok" } };
          dbo.collection("status").updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            console.log("1 document updated");
            db.close();

          });
        });
      });

      //Close the browser
      await browser.close();
    }).catch(function (error) {
      console.error(error);
    });
  })();

}

