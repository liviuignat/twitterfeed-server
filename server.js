var util = require('util');
var koa = require('koa');
var q = require('q');
var route = require('koa-route');
var cors = require('koa-cors');
var config = require('config').config;
var Twitter = require('twitter');
var port = process.env.PORT || 4000;
var app = koa();

app.use(cors());

function * getTwitterFeeds(name, count) {
  var deferred = q.defer();
  var client = new Twitter({
    consumer_key: config.consumerKey,
    consumer_secret: config.consumerSecret,
    access_token_key: config.accessToken,
    access_token_secret: config.accessTokenSecret
  });

  var params = {
    screen_name: name,
    count: count || 30
  };

  client.get('statuses/user_timeline', params, function(error, tweets, response) {
    if (!error) {
      if(tweets && tweets.map) {
        var formattedTweets = tweets.map(function (tweet) {
          tweet.created_at_formatted = new Date(tweet.created_at);
          return tweet;
        });
      }
      deferred.resolve(formattedTweets)
    }
    deferred.reject(error);
  });

  return deferred.promise;
}

app.use(route.get('/feed', function * () {
  var feedCount = parseInt(this.request.query.count) || 30;
  var userNames = (this.request.query.user_names || 'AppDirect,laughingsquid,techcrunch').split(',');

  var feeds = [];
  try {
    for (var counter = 0 ; counter < userNames.length; counter++) {
      feeds = feeds.concat(yield getTwitterFeeds(userNames[counter], feedCount));
    };
  } catch (err) {
    if (err && err.statusCode) {
      this.throw(err.body, err.statusCode);
    } else {
      this.throw(err, 500);
    }
  }

  this.body = feeds;
}));

app.listen(port);

console.log('server started on ' + (process.env.NODE_ENV || 'development') + ' port ' + port);
