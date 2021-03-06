// Dependencies =========================
var Twit = require('twit');
var ura = require('unique-random-array');
var config = require('./config');
var strings = require('./helpers/strings');
var sentiment = require('./helpers/sentiment');

var Twitter = new Twit(config);

// Frequency in minutes -- Changed to random value between 1-100
var retweetFrequency = RandomNumber(); 
var favoriteFrequency = RandomNumber();

// RANDOM QUERY STRING  =========================
var qs = ura(strings.queryString);
var qsSq = ura(strings.queryStringSubQuery);
var rt = ura(strings.resultType);

function RandomNumber()
{
  return (Math.random() * 100);
}

// https://dev.twitter.com/rest/reference/get/search/tweets
// A UTF-8, URL-encoded search query of 500 characters maximum, including operators.
// Queries may additionally be limited by complexity.

// RETWEET BOT ==========================

// find latest tweet according the query 'q' in params

// result_type: options, mixed, recent, popular
// * mixed : Include both popular and real time results in the response.
// * recent : return only the most recent results in the response
// * popular : return only the most popular results in the response.

var retweet = function () {
  var paramQS = qs();
  paramQS += qsSq();
  var paramRT = rt();
  var params = {
    q: paramQS,
    result_type: paramRT,
    lang: 'en'
  };

  Twitter.get('search/tweets', params, function (err, data) {
    // if there no errors
    if (!err) {
      // grab ID of tweet to retweet
      try {
        // run sentiment check ==========
        var tweets = data.statuses;
        var randomTweet = ranDom(tweets); 
        var retweetId = randomTweet.id_str;
        var retweetText = randomTweet.text;

        // setup http call
        var httpCall = sentiment.init();

        httpCall.send('txt=' + retweetText).end(function (result) {
          var sentim = result.body.result.sentiment;
          var confidence = parseFloat(result.body.result.confidence);
          console.log(confidence, sentim);
          // if sentiment is Negative and the confidence is above 75%
          if (sentim === 'Negative' && confidence >= 75) {
            console.log('RETWEET NEG NEG NEG', sentim, retweetText)
            return
          }
        })
      } catch (e) {
        console.log('retweetId DERP!', e.message, 'Query String:', paramQS + ' TweetId: ' + retweetId + ' Tweet: ' + retweetText);
        return
      }
      // Tell TWITTER to retweet
      Twitter.post('statuses/retweet/:id', {
        id: retweetId
      }, function (err, response) {
        if (response) {
          console.log('RETWEETED!', ' Query String:', paramQS + ' TweetId: ' + retweetId + ' Tweet: ' + retweetText)
        }
                // if there was an error while tweeting
        if (err) {
          console.log('RETWEET ERROR! Duplication maybe...:', err, 'Query String:', paramQS + ' TweetId: ' + retweetId + ' Tweet: ' + retweetText);
        }
      })
    } else { console.log('Something went wrong while SEARCHING... ' + err.message) }
  })
}

// retweet on bot start
retweet();
// retweet in every x minutes
setInterval(retweet, 1000 * 60 * retweetFrequency);

// FAVORITE BOT====================

// find a random tweet and 'favorite' it
var favoriteTweet = function () {
  var paramQS = qs();
  paramQS += qsSq();
  var paramRT = rt();
  var params = {
    q: paramQS + paramBls(),
    result_type: paramRT,
    lang: 'en'
  };

  // find the tweet
  Twitter.get('search/tweets', params, function (err, data) {
    // find tweets
    var tweet = data.statuses;
    var randomTweet = ranDom(tweet); // pick a random tweet

    // if random tweet exists
    if (typeof randomTweet !== 'undefined') {
      // run sentiment check ==========
      // setup http call
      var httpCall = sentiment.init();
      var favoriteText = randomTweet['text'];

      httpCall.send('txt=' + favoriteText).end(function (result) {
        var sentim = result.body.result.sentiment;
        var confidence = parseFloat(result.body.result.confidence);
        console.log(confidence, sentim)
        // if sentiment is Negative and the confidence is above 75%
        if (sentim === 'Negative' && confidence >= 75) {
          console.log('FAVORITE NEG NEG NEG', sentim, favoriteText)
          return
        }
      })

      // Tell TWITTER to 'favorite'
      Twitter.post('favorites/create', {
        id: randomTweet.id_str
      }, function (err, response) {
        // if there was an error while 'favorite'
        if (err) {
          console.log('CANNOT BE FAVORITED... Error: ', err, ' Query String: ' + paramQS + ' TweetId: ' + randomTweet.id_str + ' TweetText: ' + randomTweet.text);
        } else {
          console.log('FAVORITED... Success!!!', ' Query String: ' + paramQS + ' TweetId: ' + randomTweet.id_str + ' TweetText: ' + randomTweet.text);
        }
      })
    }
  })
}

// favorite on bot start
favoriteTweet();
// favorite in every x minutes
setInterval(favoriteTweet, 1000 * 60 * favoriteFrequency);

// function definition to tweet back to USER who followed
function tweetNow (tweetTxt) {
  var tweet = {
    status: tweetTxt
  }

  // HARCODE user name in and check before RT
  var n = tweetTxt.search(/@DesignPuddle/i)

  if (n !== -1) {
    console.log('TWEET SELF! Skipped!!')
  } else {
    Twitter.post('statuses/update', tweet, function (err, data, response) {
      if (err) {
        console.log('Cannot Reply to Follower. ERROR!: ' + err)
      } else {
        console.log('Reply to follower. SUCCESS!')
      }
    })
  }
}

// function to generate a random tweet tweet
function ranDom (arr) {
  var index = Math.floor(Math.random() * arr.length);
  console.log('Random Value:' + index + " of ArraySize " + arr.length);
  return arr[index];
}

function paramBls () {
  var ret = '';
  var arr = strings.blockedStrings;
  var i;
  var n;
  for (i = 0, n = arr.length; i < n; i++) {
    ret += ' -' + arr[i];
  }
  return ret;
}