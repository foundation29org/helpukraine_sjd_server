// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const RequestClin = require('../../models/request-clin')
const crypt = require('../../services/crypt')
const User = require('../../models/user')
const serviceSalesForce = require('../../services/salesForce')
const config = require('../../config')

function getRequests (req, res){
	let userId= crypt.decrypt(req.params.userId);
	RequestClin.find({"createdBy": userId}, {"createdBy" : false},(err, eventsdb) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var listEventsdb = [];

		eventsdb.forEach(function(eventdb) {
			listEventsdb.push(eventdb);
		});
		res.status(200).send(listEventsdb)
	});
}

function getRequestsAdmin (req, res){
	let group = req.params.groupName;
	RequestClin.find({group: group},(err, patients) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		
		
		var totalPatients = 0;
		var patientsAddded = 0;
		var countpos = 0;
		var listPatients = [];
		if(!patients){
			res.status(200).send(listPatients)
		}else{
			if(patients.length==0){
				res.status(200).send(listPatients)
			}else{
				var temppatients = patients;
				for(var i = 0; i < patients.length; i++) {
					temppatients[i].found = false;
					User.findOne({"_id": patients[i].createdBy},(err, user) => {
						countpos++;
						if(user){
							totalPatients = totalPatients + 1;
								
								var enc = false;
								var lat = '';
								var lng = '';
								var country = '';
								var status = '';
								var referralCenter = '';
								var needAssistance = '';
								var notes = '';
								var group = '';
								var drugs = [];
								var idencrypt = '';
								var idUserDecrypt = user._id.toString();
								var userId = crypt.encrypt(idUserDecrypt);
								for(var j = 0; j < temppatients.length && !enc; j++) {
									if((temppatients[j].createdBy).toString() === (user._id).toString() && (!temppatients[j].found)){
										temppatients[j].found = true;
										lat = temppatients[j].lat
										lng = temppatients[j].lng
										country = temppatients[j].country
										status = temppatients[j].status
										group = temppatients[j].group
										referralCenter = temppatients[j].referralCenter
										needAssistance = temppatients[j].needAssistance
										notes = temppatients[j].notes
										drugs = temppatients[j].drugs
										var idPatientrDecrypt = temppatients[j]._id.toString();
										var idencrypt= crypt.encrypt(idPatientrDecrypt);
										enc = true;
									}
								}
								var userName = user.userName+' '+user.lastName;
								listPatients.push({userId: userId, userName: userName, email: user.email, lang: user.lang,phone: user.phone, countryPhoneCode: user.countryselectedPhoneCode, signupDate: user.signupDate, lastLogin: user.lastLogin, blockedaccount: user.blockedaccount, iscaregiver: user.iscaregiver, patientId:idencrypt, lat: lat, lng: lng, country: country, status: status, group: group, notes: notes, drugs: drugs, subgroup: user.subgroup, referralCenter: referralCenter, needAssistance: needAssistance});
								patientsAddded++;
						}else{
							listPatients.push({});
						}
						if(patientsAddded==totalPatients && countpos==patients.length){
							var result = [];
							for(var j = 0; j < listPatients.length; j++) {
								if(listPatients[j].patientId!=undefined){
									result.push(listPatients[j]);
								}
							}
							res.status(200).send(result)
						}
					})
				}
			}
		}



	})

}


function saveRequest (req, res){
	let userId= crypt.decrypt(req.params.userId);
	let eventdb = new RequestClin()
	eventdb.lat = req.body.lat
	eventdb.lng = req.body.lng
	eventdb.country = req.body.country
	eventdb.notes = req.body.notes
	eventdb.referralCenter = req.body.referralCenter
	eventdb.needAssistance = req.body.needAssistance
	eventdb.status = req.body.status
	eventdb.updateDate = req.body.updateDate
	eventdb.group = req.body.group
	eventdb.drugs = req.body.drugs
	eventdb.createdBy = userId

	// when you save, returns an id in eventdbStored to access that social-info
	eventdb.save((err, eventdbStored) => {
		if (err) {
			res.status(500).send({message: `Failed to save in the database: ${err} `})
		}
		if(eventdbStored){
			//notifySalesforce
			var id = eventdbStored._id.toString();
			var idencrypt = crypt.encrypt(id);
			User.findById(userId, (err, user) => {
				if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				if(user){
					serviceSalesForce.getToken()
						.then(response => {
							console.log(JSON.stringify(response));
							var url = "/services/data/"+config.SALES_FORCE.version + '/sobjects/Case/VH_WebExternalId__c/' + idencrypt;
							var data  = serviceSalesForce.setCaseData(url, user, eventdbStored, "Profesional-Organizacion");
							console.log(data)
							serviceSalesForce.composite(response.access_token, response.instance_url, data)
							.then(response2 => {
								console.log(JSON.stringify(response2));
								if(response2.graphs[0].isSuccessful){
									var countDrugs = 0;
									var hasCase = false;
									for(let i = 0; i < response2.graphs[0].graphResponse.compositeResponse.length; i++){
										if(response2.graphs[0].graphResponse.compositeResponse[i].referenceId=='newCase'){
											var valueId = response2.graphs[0].graphResponse.compositeResponse[i].body.id;
											eventdbStored.salesforceId = valueId;
											hasCase = true;
										}else if(response2.graphs[0].graphResponse.compositeResponse[i].referenceId.indexOf('newFarmacos')!=-1){
											var valueId = response2.graphs[0].graphResponse.compositeResponse[i].body.id;
											eventdbStored.drugs[countDrugs].salesforceId = valueId;
											countDrugs++;
										}
									}
									if(countDrugs>0){
										updateSalesforceIdDrug(eventdbStored);
									}
									if(hasCase){
										updateSalesforceIdRequest(eventdbStored, response);
									}
								}
								res.status(200).send({message: 'Request created', eventdbStored: eventdbStored})
							})
							.catch(response2 => {
								console.log(response2)
								res.status(200).send({message: 'cant noti notifySalesforce', eventdbStored: eventdbStored})
							})
						})
						.catch(response => {
							console.log(response)
							res.status(200).send({message: 'cant noti notifySalesforce', eventdbStored: eventdbStored})
						})
				}else{
					console.log('cant noti notifySalesforce');
					res.status(200).send({message: 'cant noti notifySalesforce', eventdbStored: eventdbStored})
				}
			})

			//res.status(200).send({message: 'Eventdb created'});
		}
	})
}

function updateSalesforceIdRequest(eventdbUpdated, response){
	//get CaseNumber salesforce
	serviceSalesForce.getCaseNumber(response.access_token, response.instance_url,  eventdbUpdated.salesforceId)
	.then(response2 => {
		console.log(response2);
		if(response2.done){
			saveSalesforceIdRequest(eventdbUpdated, response2.records[0].CaseNumber)
		}else{
			saveSalesforceIdRequest(eventdbUpdated, null)
		}
	})
	.catch(response2 => {
		console.log(response2)
	})

	
}

function saveSalesforceIdRequest(eventdbUpdated, salesforceCleanId){
	RequestClin.findByIdAndUpdate(eventdbUpdated._id, { salesforceId: eventdbUpdated.salesforceId, salesforceCleanId: salesforceCleanId }, { select: '-createdBy', new: true }, (err, eventdbStored) => {
		if (err){
			console.log(`Error updating the patient: ${err}`);
		}
		if(eventdbStored){
			console.log('Event updated sales ID');
		}
	})
}

function updateSalesforceIdDrug(eventdb){
	RequestClin.findByIdAndUpdate(eventdb._id, { drugs: eventdb.drugs }, { new: true}, (err,eventdbStored) => {
		if (err){
			console.log(`Error updating the patient: ${err}`);
		}
		if(eventdbStored){
			console.log('Event updated sales ID');
		}
	})
}

function updateRequest (req, res){
	let requestId= req.params.requestId;
	let update = req.body
	update.updateDate = Date.now();
	RequestClin.findByIdAndUpdate(requestId, update, { new: true}, (err,eventdbUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		//notifySalesforce

			var id = eventdbUpdated._id.toString();
			var idencrypt = crypt.encrypt(id);
			User.findById(eventdbUpdated.createdBy, (err, user) => {
				if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				if(user){
					serviceSalesForce.getToken()
						.then(response => {
							var url = "/services/data/"+config.SALES_FORCE.version + '/sobjects/Case/VH_WebExternalId__c/' + idencrypt;
							var data  = serviceSalesForce.setCaseData(url, user, eventdbUpdated, "Profesional-Organizacion");
							serviceSalesForce.composite(response.access_token, response.instance_url, data)
							.then(response2 => {
								if(response2.graphs[0].isSuccessful){
									var countDrugs = 0;
									var hasCase = false;
									for(let i = 0; i < response2.graphs[0].graphResponse.compositeResponse.length; i++){
										if(response2.graphs[0].graphResponse.compositeResponse[i].referenceId=='newCase'){
											var valueId = response2.graphs[0].graphResponse.compositeResponse[i].body.id;
											eventdbUpdated.salesforceId = valueId;
											hasCase = true;
										}else if(response2.graphs[0].graphResponse.compositeResponse[i].referenceId.indexOf('newFarmacos')!=-1){
											var valueId = response2.graphs[0].graphResponse.compositeResponse[i].body.id;
											eventdbUpdated.drugs[countDrugs].salesforceId = valueId;
											countDrugs++;
										}
									}
									if(countDrugs>0){
										updateSalesforceIdDrug(eventdbUpdated);
									}
									if(hasCase){
										updateSalesforceIdRequest(eventdbUpdated, response);
									}
									
								}
								res.status(200).send({message: 'Request updated', eventdbUpdated: eventdbUpdated})
							})
							.catch(response2 => {
								console.log(response2)
								res.status(200).send({message: 'cant noti notifySalesforce', eventdbUpdated: eventdbUpdated})
							})
						})
						.catch(response => {
							console.log(response)
							res.status(200).send({message: 'cant noti notifySalesforce', eventdbUpdated: eventdbUpdated})
						})
				}else{
					res.status(200).send({message: 'cant noti notifySalesforce', eventdbUpdated: eventdbUpdated})
				}
			})
			//debería devolver cuando tengo los ids de sales forces
		//res.status(200).send({message: 'Request updated'})

	})
}


function deleteRequest (req, res){
	let requestId=req.params.requestId

	RequestClin.findById(requestId, (err, eventdb) => {
		if (err) return res.status(500).send({message: `Error deleting the request: ${err}`})
		if (eventdb){
			//notifySalesforce
			var salesforceId = eventdb.salesforceId;
			serviceSalesForce.getToken()
			.then(response => {
				 serviceSalesForce.deleteSF(response.access_token, response.instance_url, 'Case', salesforceId)
				.then(response2 => {
					console.log(response2)
				})
				.catch(response2 => {
					console.log(response2)
				})
			})
			.catch(response => {
				console.log(response)
			})

			eventdb.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the request: ${err}`})
				res.status(200).send({message: `The request has been deleted`})
			})
		}else{
			 return res.status(404).send({code: 208, message: `Error deleting the request: ${err}`})
		}

	})
}


/**
 * @api {put} https://virtualhubukraine.azurewebsites.net/api/requestclin/status/:requestId Update Status
 * @apiName updateclinicianStatus
 * @apiDescription This method allows to change the data of a clinician case.
 * @apiGroup Clinicals
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var data = {status: 'ontheway'};
 *   this.http.put('https://virtualhubukraine.azurewebsites.net/api/requestclin/status/'+requestId, data)
 *    .subscribe( (res : any) => {
 *      console.log('Message: '+ res.message);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} requestId Case unique ID
 * @apiParam (body) {string="new","contacted","pending","ontheway","contactlost","helped"} status Status of the case.
 * @apiSuccess {String} message If the case has been updated  correctly, it returns the message 'Updated'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 * "message": "Updated"
 * }
 *
 */

function setStatus (req, res){
	let requestId= crypt.decrypt(req.params.requestId);

	RequestClin.findByIdAndUpdate(requestId, { status: req.body.status }, {new: true}, (err,patientUpdated) => {
		if(patientUpdated){
			return res.status(200).send({message: 'Updated'})
		}else{
			console.log(err);
			return res.status(200).send({message: 'error'})
		}
	})
}

function changenotes (req, res){

	let requestId= crypt.decrypt(req.params.requestId);//crypt.decrypt(req.params.patientId);

	RequestClin.findByIdAndUpdate(requestId, { notes: req.body.notes }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'notes changed'})

	})
}

function getGroupRequest (req, res){
	let userId= crypt.decrypt(req.params.userId);
	RequestClin.findOne({"createdBy": userId}, {"createdBy" : false},(err, eventsdb) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(eventsdb){
			res.status(200).send({groupId: eventsdb.group})
		}else{
			res.status(200).send({groupId: '622f83174c824c0dec16c78b'})
		}
		
	});
}


function deleteDrug(req, res){
	let requestId= req.params.requestId;
	var drugs = req.body.drugs
	//notifySalesforce
	var salesforceId = drugs[req.body.index].salesforceId;
	drugs.splice(req.body.index, 1);
	serviceSalesForce.getToken()
	.then(response => {
		 serviceSalesForce.deleteSF(response.access_token, response.instance_url, 'VH_Farmacos__c', salesforceId)
		.then(response2 => {
			console.log(response2)
		})
		.catch(response2 => {
			console.log(response2)
		})
	})
	.catch(response => {
		console.log(response)
	})

	RequestClin.findByIdAndUpdate(requestId, { drugs: drugs }, { new: true}, (err,eventdbStored) => {
		if (err) return res.status(500).send({message: `Error deleting the drug: ${err}`})
		res.status(200).send({message: `The drug has been deleted`})
	})
}


module.exports = {
	getRequests,
	getRequestsAdmin,
	saveRequest,
	updateRequest,
	deleteRequest,
	setStatus,
	changenotes,
	getGroupRequest,
	deleteDrug
}
