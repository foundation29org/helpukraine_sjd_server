'use strict'
const config = require('../config')
const request = require('request')
const { blobAccessToken } = require('../config')

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
      resolve(JSON.parse(response.body))

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
             "VH_Patologia__c":patient.group,
             "VH_Geolocalizacion__latitude__s":patient.lat,
             "VH_Geolocalizacion__longitude__s":patient.lng,
             "VH_CentroMedicoReferencia__c":patient.referralCenter,
             "VH_NecesidadAsistencia__c":patient.needAssistance,
             "VH_Pais__c":patient.country,
             "Description":null,
             "Type": type,
             "RecordType":{
              "Name":"Virtual Hub Paciente - Profesional"
             },
             "Origin":"Web",
             "IP_Web_TimeStamp__c":patient.creationDate,
             "ParentId":user.salesforceId
          }
         }
        ]
       }
    ]
   };

   if(patient.drugs.length>0){
    for(let i = 0; i < patient.drugs.length; i++){
      var urlDrug = "/services/data/"+config.SALES_FORCE.version+"/sobjects/VH_Farmacos__c/VH_WebExternalId__c/"+patient.drugs[i]._id;
      data.graphs[0].compositeRequest.push(
        {
          "method":"PATCH",
          "url":urlDrug,
          "referenceId":"newFarmacos"+i,
          "body":{
            "VH_Strength__c": patient.drugs[i].strength,
            "VH_Link__c": patient.drugs[i].link,
            "VH_Dose__c": patient.drugs[i].dose,
            "Name": patient.drugs[i].name,
            "VH_Case__c": "@{newCase.id}"
          }
        }
      )
    }
   }

   return data;
}

function setUserData(url, user, type){

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
             "IP_WebBirthdate__c": null,
             "VH_Rol__c":user.iscaregiver,
             "IP_InformacionPatologia__c":null,
             "VH_Patologia__c":user.group,
             "VH_Geolocalizacion__latitude__s":user.lat,
             "VH_Geolocalizacion__longitude__s":user.lng,
             "VH_CentroMedicoReferencia__c":"",
             "VH_NecesidadAsistencia__c":"",
             "VH_Pais__c":"",
             "Description":null,
             "Type": type,
             "RecordType":{
              "Name":"Virtual Hub Paciente - Profesional"
             },
             "Origin":"Web",
             "IP_Web_TimeStamp__c":user.signupDate
          }
         }
        ]
       }
    ]
   };

   return data;
}

function setMsgData(url, supportStored, salesforceId){
  var attachments = "";
  if(supportStored.files.length>0){
    supportStored.files.forEach(function(file) {
      
      var urlpath = blobAccessToken.blobAccountUrl+'filessupport/'+file+blobAccessToken.sasToken;
      attachments=attachments+urlpath+',';
    });
  }

  var data  = {
    "graphs":[
       {
        "graphId":"graph1",
        "compositeRequest":[
         {
          "method":"PATCH",
          "url":url,
          "referenceId":"newContactosWeb",
          "body":{
            "VH_Files__c":attachments,
            "VH_Description__c":supportStored.description,
            "VH_Subject__c":supportStored.subject,
            "VH_Type__c": "emailmessage",
            "VH_Platform__c":supportStored.platform,
            "VH_Date__c":supportStored.date,
            "VH_StatusDate__c":supportStored.statusDate,
            "VH_Status__c":supportStored.status,
            "VH_Case__c": salesforceId
          }
         }
        ]
       }
    ]
   };

   return data;
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
      resolve(response.statusCode)
    });
  });
  return decoded
}

function getCaseNumber (access_token, host, salesforceId){

  var url = host+'/services/data/'+config.SALES_FORCE.version+'/query/?q=Select+CaseNumber+From+Case+where+id+=+';
  url = url+"'"+salesforceId+"'";
  var authorization = 'Bearer '+access_token;
  var options = {
    'method': 'GET',
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
      resolve(JSON.parse(response.body))

    });
  });
  return decoded
}



module.exports = {
	getToken,
  composite,
  setCaseData,
  setUserData,
  setMsgData,
  deleteSF,
  getCaseNumber
}
