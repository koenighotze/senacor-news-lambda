const cheerio = require('cheerio');
const Wreck = require('wreck');
const jsonfile = require('jsonfile');

const extractEventTitles = function($) {
    return new Promise( (resolve, reject) => {
        const events = {};
        $('div.event').filter((i, el) => {
            const $element = $(el);
            const eventId = $element.attr('event_id');
            const [date, title] = $element.find('div.date').text().trim().split(' / ');

            events[eventId] = {
                date,
                title
            };
        });
        resolve(events);
    });
};

const extractSummary = function($) {
    return new Promise( (resolve, reject) => {
        const events = {};
        $('div.content').filter((i, el) => {
            const $element = $(el);
            const eventId = $element.attr('event_id');
            const summary = $element.find('div.text').text().trim();

            const event = events[eventId];
            events[eventId] = {summary};
        });
        resolve(events);
    });
};

const mergeEvents = function (titles, summaries) {
    const mergedEvents = {};
    for (let entryId in titles) {
        mergedEvents[entryId] = Object.assign({}, titles[entryId], summaries[entryId]);
    }
    return mergedEvents;
};

const fetchPage = function(callback) {
    Wreck.get('https://senacor.com/news-events/', {
        timeout: 2000,
        maxBytes: 100000
    }, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            callback(error);
        }
        callback(null, body);
    });
};

const extractEvents = function (page) {
    const $ = cheerio.load(page);

    return Promise.all([ extractEventTitles($), extractSummary($) ])
         .then( results => {
            const [titles, summaries] = results;
            return mergeEvents(titles, summaries);
         })
         .catch( rejection => { throw rejection; } );
};

const handler = function (event, context, callback) {
    fetchPage( (err, body) => {
        if (err) {
            callback(err);
        }
        else {
            extractEvents(body)
                .then(events => callback(null, events))
                .catch(error => callback(error));
        }
    });
};

module.exports = {
    'handler': handler,
    'extractEventTitles': extractEventTitles,
    'extractSummary': extractSummary,
    'mergeEvents': mergeEvents
};

if (process.env.NODE_ENV === 'development') {
    handler(null, null, (err, events) => {
        if (err) {
            console.warn(err);
        }
        console.log(events);
    } );
}
