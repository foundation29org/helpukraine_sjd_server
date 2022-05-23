'use strict'
const config = require('../config')
const request = require('request')

function getToken (){
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
      console.log(JSON.parse(response.body));
      resolve(JSON.parse(response.body))

    });
  });
  return decoded
}

function composite (access_token, host, data){

  var url = host+'/services/data/'+config.SALES_FORCE.version+'/composite/graph';
  var body = JSON.stringify(data)
  var authorization = 'Bearer '+access_token;
  var options = {
    'method': 'POST',
    'url': url,
    'headers': {
      'Authorization': authorization,
      'Content-Type': 'application/json'
    },
     body: body
  };
  
  const decoded = new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) {
        console.error(error)
        resolve(error)
      } 
      console.log(JSON.parse(response.body));
      resolve(JSON.parse(response.body))

    });
  });
  return decoded
}

function deleteSF (access_token, host, SobjectName, SobjectId){

  var url = host+'/services/data/'+config.SALES_FORCE.version+'/sobjects/'+SobjectName+'/'+SobjectId;
  var authorization = 'Bearer '+access_token;
  var options = {
    'method': 'Delete',
    'url': url,
    'headers': {
      'Authorization': authorization,
      'Content-Type': 'application/json'
    }
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

function setCaseData(url, user, patient, type){
  var data  = {
    "graphs":[
       {
        "graphId":"graph1",
        "compositeRequest":[
         {
          "method":"PATCH",
          "url":url,
          "referenceId":"newCase",
          "body":{
             "SuppliedName":user.userName,
             "IP_WebLastName__c":user.lastName,
             "VH_IdiomaContacto__c":user.lang,
             "SuppliedEmail":user.email,
             "VH_PrefijoTelefono__c":user.countryselectedPhoneCode,
             "SuppliedPhone":user.phone,
             "IP_WebBirthdate__c":patient.birthDate,
             "VH_Rol__c":user.iscaregiver,
             "IP_InformacionPatologia__c":null,
             "VH_Patologia__c":user.group,
             "VH_Geolocalizacion__latitude__s":patient.lat,
             "VH_Geolocalizacion__longitude__s":patient.lng,
             "VH_Pais__c": patient.country,
             "VH_CentroMedicoReferencia__c":patient.referralCenter,
             "VH_NecesidadAsistencia__c":patient.needAssistance,
             "VH_Pais__c":patient.country,
             "Description":null,
             "Type": type,
             "RecordType":{
              "Name":"Virtual Hub Paciente - Profesional"
             },
             "Status":patient.status,
             "Origin":"Web",
             "IP_Web_TimeStamp__c":null
          }
         }
        ]
       }
    ]
   };

   return data;
}



module.exports = {
	getToken,
  composite,
  setCaseData,
  deleteSF
}
