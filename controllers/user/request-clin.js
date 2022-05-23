// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const RequestClin = require('../../models/request-clin')
const crypt = require('../../services/crypt')
const User = require('../../models/user')
const Group = require('../../models/group')
const serviceEmail = require('../../services/email')

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
	console.log(group);
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
										console.log('coincide');
										console.log(temppatients[j].lat);
										lat = temppatients[j].lat
										lng = temppatients[j].lng
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
								listPatients.push({userId: userId, userName: userName, email: user.email, lang: user.lang,phone: user.phone, countryPhoneCode: user.countryselectedPhoneCode, signupDate: user.signupDate, lastLogin: user.lastLogin, blockedaccount: user.blockedaccount, iscaregiver: user.iscaregiver, patientId:idencrypt, lat: lat, lng: lng, status: status, group: group, notes: notes, drugs: drugs, subgroup: user.subgroup, referralCenter: referralCenter, needAssistance: needAssistance});
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
			//notifyGroup(eventdb.group, 'New', userId);
			//notifySalesforce
			res.status(200).send({message: 'Eventdb created'});
		}
	})
}

function updateRequest (req, res){
	let requestId= req.params.requestId;
	let update = req.body
	update.updateDate = Date.now();
	RequestClin.findByIdAndUpdate(requestId, update, { new: true}, (err,eventdbUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		//notifyGroup(eventdbUpdated.group, 'Update', eventdbUpdated.createdBy);
		//notifySalesforce
		res.status(200).send({message: 'Request updated'})

	})
}

function notifyGroup(groupid, state, userId){
	Group.findById(groupid, function (err, group) {
        if(group){
			if(group.notifications.isNew && state == 'New'){
				User.findById(userId, { "_id": false, "password": false, "__v": false, "confirmationCode": false, "loginAttempts": false, "confirmed": false, "role": false, "lastLogin": false }, (err, user) => {
					if (user) {
						serviceEmail.sendNotificationNewUser(group.email, user.email)
						if(groupid == '622f83174c824c0dec16c78b'){
							serviceEmail.sendNotificationToTheNewUser(user.email, user.userName, user.lang)
						}
					}
				})
				
			}
			if(group.notifications.changeData && state == 'Update'){
				User.findById(userId, { "_id": false, "password": false, "__v": false, "confirmationCode": false, "loginAttempts": false, "confirmed": false, "role": false, "lastLogin": false }, (err, user) => {
					if (user) {
						serviceEmail.sendNotificationUpdateUser(group.email, user.email)
					}
				})
				
			}
		}
      })
}


function deleteRequest (req, res){
	let requestId=req.params.requestId

	RequestClin.findById(requestId, (err, eventdb) => {
		if (err) return res.status(500).send({message: `Error deleting the request: ${err}`})
		if (eventdb){
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
	/*serviceEmail.sendMailChangeStatus(req.body.email, req.body.userName, req.body.lang, req.body.group, req.body.statusInfo, req.body.groupEmail)
					.then(response => {
						console.log('Email sent' )
					})
					.catch(response => {
						console.log('Fail sending email' )
					})*/
    // notifySalesforce  

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


module.exports = {
	getRequests,
	getRequestsAdmin,
	saveRequest,
	updateRequest,
	deleteRequest,
	setStatus,
	changenotes,
	getGroupRequest
}
