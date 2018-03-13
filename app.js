var firebase = require("firebase");
var axios = require("axios");
var cheerio = require("cheerio");
var forEach = require('async-foreach').forEach;
var md5 = require('md5');

var config = {
  apiKey: "AIzaSyD__AifyzDE067hwYsDPE-8XToR3vBWlEk",
  authDomain: "fb-firebase-7c5fb.firebaseapp.com",
  databaseURL: "https://fb-firebase-7c5fb.firebaseio.com",
  projectId: "fb-firebase-7c5fb",
  storageBucket: "fb-firebase-7c5fb.appspot.com",
  messagingSenderId: "1022436191845"
};

firebase.initializeApp(config);
var database = firebase.database();

var axiosConfig = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
    'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  }
};

function removeDuplicates(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}

function saveData(unique) {
  forEach(unique, (data) => {
    firebase.database().ref('/data/' + data.category + '/' + data.md5).set({
      href: data.href,
      text: data.text,
      md5: data.md5
    });
  });
}


database.ref('/config/categories').once('value').then((data) => {
  var categories = data.val();
  forEach(categories, (category) => {
    var catName = category.name;
    var keywords = category.keywords;
    forEach(category.urls, (url) => {
      axios.get(url,axiosConfig)
      .then((html) => {
        var $ = cheerio.load(html.data);
        var links = [];
        $('a').each((i,value) => {
          var href = $(value).attr('href');
          if (href !== undefined && keywords.some(function(v) { return href.indexOf(v) >= 0; })) {
            var found = {};
            found.href = href;
            found.text = $(value).text().trim();
            found.md5 = md5(href);
            found.category = catName;
            if (found.href.indexOf('http') >= 0) links.push(found);
          }
        });
        var unique = removeDuplicates(links,'md5');
        saveData(unique);
      })
      .catch((err) => {
        console.log(err);
      });
    });
  });
});
