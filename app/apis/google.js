/**
 * Created by Jeremy on 12/15/2016.
 */
const https = require('https');
const util = require('util');
const config = require('../resources/config');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=1&videoDuration=short&q=%s&key=%s';
const YOUTUBE_VIDEO_BASE = 'https://www.youtube.com/watch?v=%s'

const searchYouTube = function(terms) {
    "use strict";
    return new Promise((resolve, reject) => {
        "use strict";
        //console.log('SEARCH URL: ' + util.format(YOUTUBE_API_BASE, terms, config.GOOGLE_API_KEY));
        https.get(util.format(YOUTUBE_API_BASE, terms, config.GOOGLE_API_KEY), (response) => {
            "use strict";
            //console.log('status code: ' + response.statusCode);
            var body = '';

            response.on('data', (chunk) => {
                body += chunk;
                console.log(body);
            });

            response.on('end', () => {
                const response = JSON.parse(body);
                if (response.items.length == 0) {
                    reject();
                } else {
                    resolve(util.format(YOUTUBE_VIDEO_BASE, response.items[0].id.videoId));
                }
            });
        }).on('error', (e) => { console.error(e); });
    });
};

module.exports = {
    searchYouTube: searchYouTube
};