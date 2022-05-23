'use strict'
const config = require('../config')
const request = require('request')

function getToken (req, res){
  var SL_URL = config.SALES_FORCE.url;
  var info = {
    grant_type: "password",
    client_id: config.SALES_FORCE.client_id,
    client_secret: config.SALES_FORCE.client_secret,
    username: config.SALES_FORCE.username,
    password: config.SALES_FORCE.password
  }

  var options = {
    'method': 'POST',
    'url': SL_URL,
    formData: info
  };

  const decoded = new Promise((resolve, reject) => {


    request(options, function (error, response) {
      if (error) {
        console.error(error)
        resolve(error)
      } 
      console.log(response.body);
      resolve(response.body)

    });
  });
  return decoded
}

function composite (req, res){
  
  const decoded = new Promise((resolve, reject) => {

  });
  return decoded
}



module.exports = {
	getToken,
  composite
}
