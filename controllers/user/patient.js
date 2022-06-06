// functions for each call of the api on patient. Use the patient model

'use strict'

// add the patient model
const Patient = require('../../models/patient')
const User = require('../../models/user')
const crypt = require('../../services/crypt')
const serviceSalesForce = require('../../services/salesForce')
const config = require('../../config')

/**
 * @api {get} https://virtualhubukraine.azurewebsites.net/api/patients-all/:userId Get patient list of a user
 * @apiName getPatientsUser
 * @apiDescription This method read the patient list of a user. For each patient you have, you will get: patientId, name, and last name.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://virtualhubukraine.azurewebsites.net/api/patients-all/'+userId)
 *    .subscribe( (res : any) => {
 *      console.log('patient list: '+ res.listpatients);
 *      if(res.listpatients.length>0){
 *        console.log("patientId" + res.listpatients[0].sub +", Patient Name: "+ res.listpatients[0].patientName+", Patient surname: "+ res.listpatients[0].surname);
 *      }
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} userId User unique ID. More info here:  [Get token and userId](#api-Access_token-signIn)
 * @apiSuccess {Object} listpatients You get a list of patients (usually only one patient), with your patient id, name, and surname.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"listpatients":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 *  {
 *   "sub": "5499bb6faef2c95364e2f4ee2c9aef05abe2c9c72110a4514e8c4c4gt038ff30",
 *   "patientName": "Peter",
 *   "surname": "Tosh"
 *  }
 * }
 *
 */

function getPatientsUser (req, res){
	let userId= crypt.decrypt(req.params.userId);


	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'User'){
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})

				var listpatients = [];

				patients.forEach(function(u) {
					var id = u._id.toString();
					var idencrypt= crypt.encrypt(id);
					listpatients.push({sub:idencrypt, patientName: u.patientName, surname: u.surname, birthDate: u.birthDate, gender: u.gender, country: u.country, group: u.group});
				});

				//res.status(200).send({patient, patient})
				// if the two objects are the same, the previous line can be set as follows
				res.status(200).send({listpatients})
			})
		}else if(user.role == 'Clinical' || user.role == 'SuperAdmin' || user.role == 'Admin'){

			//debería de coger los patientes creados por ellos, más adelante, habrá que meter tb los pacientes que les hayan datos permisos
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})

				var listpatients = [];

				patients.forEach(function(u) {
					var id = u._id.toString();
					var idencrypt= crypt.encrypt(id);
					listpatients.push({sub:idencrypt, patientName: u.patientName, surname: u.surname, isArchived: u.isArchived, birthDate: u.birthDate, gender: u.gender, country: u.country, group: u.group});
				});

				//res.status(200).send({patient, patient})
				// if the two objects are the same, the previous line can be set as follows
				res.status(200).send({listpatients})
			})
		}else{
			res.status(401).send({message: 'without permission'})
		}
	})


}


/**
 * @api {get} https://virtualhubukraine.azurewebsites.net/api/patients/:patientId Get patient
 * @apiName getPatient
 * @apiDescription This method read data of a Patient
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://virtualhubukraine.azurewebsites.net/api/patients/'+patientId)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patient);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiSuccess {string="male","female"} gender Gender of the Patient.
 * @apiSuccess {String} phone1 Phone number of the Patient.
 * @apiSuccess {String} phone2 Other phone number of the Patient.
 * @apiSuccess {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} city City of residence of the Patient.
 * @apiSuccess {String} postalCode PostalCode of residence of the Patient.
 * @apiSuccess {String} street Street of residence of the Patient.
 * @apiSuccess {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} citybirth City birth of the Patient.
 * @apiSuccess {Date} birthDate Date of birth of the patient.
 * @apiSuccess {String} patientName Name of the Patient.
 * @apiSuccess {String} surname Surname of the Patient.
 * @apiSuccess {Object} parents Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiSuccess {Object} siblings Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patient":
 *   {
 *     "gender":"male",
 *     "phone2":"",
 *     "phone1":"",
 *     "country":"NL",
 *     "province":"Groningen",
 *     "city":"narnias",
 *     "postalCode":"",
 *     "street":"",
 *     "countrybirth":"SL",
 *     "provincebirth":"Barcelona",
 *     "citybirth":"narnia",
 *     "birthDate":"1984-06-13T00:00:00.000Z",
 *     "surname":"aa",
 *     "patientName":"aa",
 *     "parents":[{"_id":"5a6f4b71f600d806044f3ef5","profession":"","highEducation":""}],
 *     "siblings":[{"_id":"5a6f4b71f600d806044f3ef4","affected":null,"gender":""}]
 *   }
 * }
 *
 */

function getPatient (req, res){
	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})

		res.status(200).send({patient})
	})
}

/**
 * @api {put} https://virtualhubukraine.azurewebsites.net/api/patients/:patientId Update Patient
 * @apiName updatePatient
 * @apiDescription This method allows to change the data of a patient.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var patient = {patientName: '', surname: '', street: '', postalCode: '', citybirth: '', provincebirth: '', countrybirth: null, city: '', province: '', country: null, phone1: '', phone2: '', birthDate: null, gender: null, siblings: [], parents: []};
 *   this.http.put('https://virtualhubukraine.azurewebsites.net/api/patients/'+patientId, patient)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patientInfo);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiParam (body) {string="male","female"} gender Gender of the Patient.
 * @apiParam (body) {String} phone1 Phone number of the Patient.
 * @apiParam (body) {String} phone2 Other phone number of the Patient.
 * @apiParam (body) {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} city City of residence of the Patient.
 * @apiParam (body) {String} [postalCode] PostalCode of residence of the Patient.
 * @apiParam (body) {String} [street] Street of residence of the Patient.
 * @apiParam (body) {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} citybirth City birth of the Patient.
 * @apiParam (body) {Date} birthDate Date of birth of the patient.
 * @apiParam (body) {String} patientName Name of the Patient.
 * @apiParam (body) {String} surname Surname of the Patient.
 * @apiParam (body) {Object} [parents] Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiParam (body) {Object} [siblings] Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccess {Object} patientInfo patientId, name, and surname.
 * @apiSuccess {String} message If the patient has been created correctly, it returns the message 'Patient updated'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patientInfo":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 * "message": "Patient updated"
 * }
 *
 */

function updatePatient (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let update = req.body
	update.lat = crypt.encrypt(update.lat.toString())
	update.lng = crypt.encrypt(update.lng.toString())
	update.needAssistance = crypt.encrypt(update.needAssistance)
  Patient.findByIdAndUpdate(patientId, update, {new: true}, async (err,patientUpdated) => {
  //Patient.findByIdAndUpdate(patientId, { gender: req.body.gender, birthDate: req.body.birthDate, patientName: req.body.patientName, surname: req.body.surname, relationship: req.body.relationship, country: req.body.country, previousDiagnosis: req.body.previousDiagnosis, group: req.body.group }, {new: true}, async (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var id = patientUpdated._id.toString();
		var idencrypt= crypt.encrypt(id);
		patientUpdated.lat = crypt.decrypt(patientUpdated.lat)
		patientUpdated.lng = crypt.decrypt(patientUpdated.lng)
		patientUpdated.needAssistance = crypt.decrypt(patientUpdated.needAssistance)
		var patientInfo = {sub:idencrypt, patientName: patientUpdated.patientName, surname: patientUpdated.surname, birthDate: patientUpdated.birthDate, gender: patientUpdated.gender, country: patientUpdated.country, previousDiagnosis: patientUpdated.previousDiagnosis, group: patientUpdated.group};
		
		//notifySalesforce
			User.findById(patientUpdated.createdBy, (err, user) => {
				if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				if(user){
					serviceSalesForce.getToken()
						.then(response => {
							var url = "/services/data/"+config.SALES_FORCE.version + '/sobjects/Case/VH_WebExternalId__c/' + idencrypt;
							var data  = serviceSalesForce.setCaseData(url, user, patientUpdated, "Paciente");

							serviceSalesForce.composite(response.access_token, response.instance_url, data)
							.then(response2 => {
								var valueId = response2.graphs[0].graphResponse.compositeResponse[0].body.id;
								Patient.findByIdAndUpdate(patientUpdated._id, { salesforceId: valueId }, { select: '-createdBy', new: true }, (err, eventdbStored) => {
									if (err){
										console.log(`Error updating the patient: ${err}`);
									}
									if(eventdbStored){
										console.log('Event updated sales ID');
									}
								})
							})
							.catch(response2 => {
								console.log(response2)
							})
						})
						.catch(response => {
							console.log(response)
						})
				}else{
					console.log('cant noti notifySalesforce');
				}
			})
		
		res.status(200).send({message: 'Patient updated', patientInfo})

	})
}

function changenotes (req, res){

	let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { notes: req.body.notes }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'notes changed'})

	})
}

function getStatus (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})
		if(patient){
			res.status(200).send(patient.status)
		}
		
	})
}

/**
 * @api {put} https://virtualhubukraine.azurewebsites.net/api/patient/status/:patientId Update Status
 * @apiName updatePatientStatus
 * @apiDescription This method allows to change the data of a patient.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var data = {status: 'ontheway'};
 *   this.http.put('https://virtualhubukraine.azurewebsites.net/api/patient/status/'+patientId, data)
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
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiParam (body) {string="new","contacted","pending","ontheway","contactlost","helped"} status Status of the Patient.
 * @apiSuccess {String} message If the patient has been updated  correctly, it returns the message 'Updated'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 * "message": "Updated"
 * }
 *
 */

function setStatus (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	Patient.findByIdAndUpdate(patientId, { status: req.body.status }, {new: true}, (err,patientUpdated) => {
		if(patientUpdated){
			return res.status(200).send({message: 'Updated'})
		}else{
			console.log(err);
			return res.status(200).send({message: 'error'})
		}
	})
}

function setChecks (req, res){

	let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { checks: req.body.checks }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'checks changed'})

	})
}

function getChecks (req, res){

	let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err,patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
			res.status(200).send({checks: patient.checks})

	})
}

function saveDrugs (req, res){

	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { drugs: req.body.drugs }, { new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
			//notifySalesforce
			var id = patientUpdated._id.toString();
			var idencrypt = crypt.encrypt(id);
			User.findById(patientUpdated.createdBy, (err, user) => {
				if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				if(user){
					serviceSalesForce.getToken()
						.then(response => {
							var url = "/services/data/"+config.SALES_FORCE.version + '/sobjects/Case/VH_WebExternalId__c/' + idencrypt;
							var data  = serviceSalesForce.setCaseData(url, user, patientUpdated, "Paciente");
							serviceSalesForce.composite(response.access_token, response.instance_url, data)
							.then(response2 => {
								if(response2.graphs[0].isSuccessful){
									var countDrugs = 0;
									var hasCase = false;
									for(let i = 0; i < response2.graphs[0].graphResponse.compositeResponse.length; i++){
										if(response2.graphs[0].graphResponse.compositeResponse[i].referenceId=='newCase'){
											var valueId = response2.graphs[0].graphResponse.compositeResponse[i].body.id;
											patientUpdated.salesforceId = valueId;
											hasCase = true;
										}else if(response2.graphs[0].graphResponse.compositeResponse[i].referenceId.indexOf('newFarmacos')!=-1){
											var valueId = response2.graphs[0].graphResponse.compositeResponse[i].body.id;
											patientUpdated.drugs[countDrugs].salesforceId = valueId;
											countDrugs++;
										}
									}
									if(countDrugs>0){
										updateSalesforceIdDrug(patientUpdated);
									}
									if(hasCase){
										updateSalesforceIdRequest(patientUpdated);
									}
								}
								res.status(200).send({message: 'drugs changed', patientUpdated: patientUpdated})
							})
							.catch(response2 => {
								console.log(response2)
								res.status(200).send({message: 'cant noti notifySalesforce', patientUpdated: patientUpdated})
							})
						})
						.catch(response => {
							console.log(response)
							res.status(200).send({message: 'cant noti notifySalesforce', patientUpdated: patientUpdated})
						})
				}else{
					console.log('cant noti notifySalesforce');
					res.status(200).send({message: 'cant noti notifySalesforce', patientUpdated: patientUpdated})
				}
			})
			//debería devolver cuando tengo los ids de sales forces
			//res.status(200).send({message: 'drugs changed'})

	})
}

function updateSalesforceIdRequest(eventdbUpdated){
	Patient.findByIdAndUpdate(eventdbUpdated._id, { salesforceId: eventdbUpdated.salesforceId }, { select: '-createdBy', new: true }, (err, eventdbStored) => {
		if (err){
			console.log(`Error updating the patient: ${err}`);
		}
		if(eventdbStored){
			console.log('Event updated sales ID');
		}
	})
}

function updateSalesforceIdDrug(patientUpdated){
	Patient.findByIdAndUpdate(patientUpdated._id, { drugs: patientUpdated.drugs }, { new: true}, (err,eventdbStored) => {
		if (err){
			console.log(`Error updating the patient: ${err}`);
		}
		if(eventdbStored){
			console.log('Event updated sales ID');
		}
	})
}

function deleteDrug(req, res){
	let patientId= crypt.decrypt(req.params.patientId);
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

	Patient.findByIdAndUpdate(patientId, { drugs: drugs }, { new: true}, (err,eventdbStored) => {
		if (err) return res.status(500).send({message: `Error deleting the drug: ${err}`})
		res.status(200).send({message: `The drug has been deleted`})
	})
}

module.exports = {
	getPatientsUser,
	getPatient,
	updatePatient,
	changenotes,
  	getStatus,
	setStatus,
	setChecks,
	getChecks,
	saveDrugs,
	deleteDrug
}
