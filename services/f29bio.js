'use strict'

const config = require('../config')
const request = require('request')

function getTranslationDictionary2 (req, res){
  var lang = req.body.lang;
  var category = config.translationCategory;
  var info = req.body.info;
  var translationKey = config.translationKey;
  request.post({url:'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&&from='+lang+'&to=en&category='+category,json: true,headers: {'Ocp-Apim-Subscription-Key': translationKey},body:info}, (error, response, body) => {
    if (error) {
      console.error(error)
      res.status(500).send(error)
    }
    if(body=='Missing authentication token.'){
      res.status(401).send(body)
    }else{
      res.status(200).send(body)
    }

  });
}

module.exports = {
  getTranslationDictionary2
}
