const cheerio = require('cheerio');
const Wreck = require('wreck');
const jsonfile = require('jsonfile');

const extractEventTitles = function($) {
    const events = {};
    $('div.event').filter((i, el) => {
        const $element = $(el);
        const eventId = $element.attr('event_id');
        const [date, title] = $element.find('div.date').text().trim().split(' / ');

        console.log(`Store event ${eventId} with title ${title}`);
        events[eventId] = {
            date,
            title
        };
    });
    return events;
};

const extractSummary = function($) {
    const events = {};
    $('div.content').filter((i, el) => {
        const $element = $(el);
        const eventId = $element.attr('event_id');
        const summary = $element.find('div.text').text().trim();

        const event = events[eventId];
        events[eventId] = {summary};
    });
    return events;
};

const fetchEvents = function(callback) {
    Wreck.get('https://senacor.com/news-events/', {
        timeout: 2000,
        maxBytes: 100000
    }, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            callback(error);
        }
        const $ = cheerio.load(body);

        const titles = extractEventTitles($);
        const summaries = extractSummary($);

        // titles.map()
        // events[eventId] = Object.assign(event, {summary});
        // console.log("Calling callback with result", events);
        callback(null, Object.assign(titles, summaries));
    }
    );
};

// module.exports = {
//     'handler': function(event, context, callback) {
//         fetchEvents(callback);
//     },
// };

exports.handler = (event, context, callback) => {
    fetchEvents(callback);
};


// fetchEvents( (err, data) => {
//     console.log(data);
// });