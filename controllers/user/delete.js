// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const User = require('../../models/user')
const Patient = require('../../models/patient')
const crypt = require('../../services/crypt')
const serviceSalesForce = require('../../services/salesForce')
const config = require('../../config')

function deleteAccount (req, res){
	req.body.email = (req.body.email).toLowerCase();
	User.getAuthenticated(req.body.email, req.body.password, function (err, user, reason) {
		if (err) return res.status(500).send({ message: err })

		// login was successful if we have a user
		if (user) {
			let userId= crypt.decrypt(req.params.userId);
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		
				patients.forEach(function(u) {
					var patientId = u._id.toString();
					deletePatient(res, patientId, userId, user);
				});
				//deleteUser(res, userId);
			})
		}else{
			res.status(200).send({message: `fail`})
		}
	})
}


function deletePatient (res, patientId, userId, user){
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){

			//notifySalesforce
			var salesforceId = patient.salesforceId;
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

			patient.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				savePatient(userId, user);
				res.status(200).send({message: `The case has been eliminated`})
			})
		}else{
				savePatient(userId, user);
				return res.status(202).send({message: 'The case has been eliminated'})
		}
	})
}

function deleteUser (res, userId){
	User.findById(userId, (err, user) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(user){
			user.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				savePatient(userId, user);
				res.status(200).send({message: `The case has been eliminated`})
			})
		}else{
			savePatient(userId, user);
			 return res.status(202).send({message: 'The case has been eliminated'})
		}
	})
}

function savePatient(userId, user) {
	let patient = new Patient()
	patient.createdBy = userId
	// when you save, returns an id in patientStored to access that patient
	patient.save(async (err, patientStored) => {
		if (err) console.log({ message: `Failed to save in the database: ${err} ` })
		var id = patientStored._id.toString();
		var idencrypt = crypt.encrypt(id);
		var patientInfo = { sub: idencrypt, patientName: patient.patientName, surname: patient.surname, birthDate: patient.birthDate, gender: patient.gender, country: patient.country, previousDiagnosis: patient.previousDiagnosis, consentgroup: patient.consentgroup };
		//notifySalesforce
		serviceSalesForce.getToken()
			.then(response => {
				var url = "/services/data/"+config.SALES_FORCE.version + '/sobjects/Case/VH_WebExternalId__c/' + idencrypt;
				var data  = serviceSalesForce.setCaseData(url, user, patient, "Paciente");
				 serviceSalesForce.composite(response.access_token, response.instance_url, data)
				.then(response2 => {
					//set id id on DDBB
					var valueId = response2.graphs[0].graphResponse.compositeResponse[0].body.id;
					Patient.findByIdAndUpdate(patientStored._id, { salesforceId: valueId }, { select: '-createdBy', new: true }, (err, patientUpdated) => {
						if (err){
							console.log(`Error updating the patient: ${err}`);
						}
						if(patientStored){
							console.log('Patient updated sales ID');
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

	})
}

module.exports = {
	deleteAccount
}
