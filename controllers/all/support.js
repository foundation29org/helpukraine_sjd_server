// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Support = require('../../models/support')
const Group = require('../../models/group')
const serviceEmail = require('../../services/email')
const crypt = require('../../services/crypt')
const config = require('../../config')
const serviceSalesForce = require('../../services/salesForce')


function sendMsgSupport(req, res){
	let userId= crypt.decrypt(req.body.userId);

	User.findOne({ '_id': userId }, function (err, user) {
	  if (err) return res.status(500).send({ message: 'Error searching the user'})
		if (user){

			let support = new Support()
			support.platform = 'Relief Ukraine'
			support.type = req.body.type
			support.subject = req.body.subject
			support.description = req.body.description
			support.files = req.body.files
			
			support.createdBy = userId

			//guardamos los valores en BD y enviamos Email
			support.save((err, supportStored) => {
				if (err) return res.status(500).send({ message: 'Error saving the msg'})
				//notifySalesforce

				var id = supportStored._id.toString();
				var idencrypt = crypt.encrypt(id);
				serviceSalesForce.getToken()
				.then(response => {
					var url = "/services/data/"+config.SALES_FORCE.version + '/sobjects/VH_ContactosWeb__c/VH_WebExternalId__c/' + idencrypt;
					var data  = serviceSalesForce.setMsgData(url, supportStored, req.body.userId);

					console.log(JSON.stringify(data));

					serviceSalesForce.composite(response.access_token, response.instance_url, data)
					.then(response2 => {
						console.log(JSON.stringify(response2));
						var valueId = response2.graphs[0].graphResponse.compositeResponse[0].body.id;
						console.log(response2.graphs[0].graphResponse.compositeResponse);
						console.log(valueId);
						Support.findByIdAndUpdate(supportStored._id, { salesforceId: valueId }, { select: '-createdBy', new: true }, (err, eventdbStored) => {
							if (err){
								console.log(`Error updating the user: ${err}`);
							}
							if(eventdbStored){
								console.log('User updated sales ID');
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
				return res.status(200).send({ message: 'Email sent'})

				/*
				serviceEmail.sendMailSupport(user.email, user.lang, user.role, supportStored, null)
						.then(response => {
							return res.status(200).send({ message: 'Email sent'})
						})
						.catch(response => {
							//create user, but Failed sending email.
							//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
							res.status(500).send({ message: 'Fail sending email'})
						})*/
				
			})
		}else{
			return res.status(500).send({ message: 'user not exists'})
		}
	})
}

function sendMsgLogoutSupport(req, res){
			let support = new Support()
			//support.type = 'Home form'
			support.subject = 'Relief Ukraine support'
			support.platform = 'Relief Ukraine'
			support.description = 'Name: '+req.body.userName+', Email: '+ req.body.email+ ', Description: ' +req.body.description
			support.createdBy = "5c77d0492f45d6006c142ab3";
			support.files = []
			//guardamos los valores en BD y enviamos Email
			support.save((err, supportStored) => {
				if (err) {
					return res.status(500).send({ message: 'Error saving the msg'})
				}
				serviceEmail.sendMailSupport(req.body.email,'en','User', supportStored, null)
					.then(response => {
						return res.status(200).send({ message: 'Email sent'})
					})
					.catch(response => {
						//create user, but Failed sending email.
						//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
						res.status(500).send({ message: 'Fail sending email'})
					})
				//return res.status(200).send({ token: serviceAuth.createToken(user)})
			})
}

function getUserMsgs(req, res){
	let userId= crypt.decrypt(req.params.userId);
	Support.find({"createdBy": userId},(err, msgs) => {

			if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			var listmsgs = [];

			msgs.forEach(function(u) {
				if(u.platform == 'Relief Ukraine' || u.platform == undefined){
					listmsgs.push({subject:u.subject, description: u.description, date: u.date, status: u.status, type: u.type});
				}
			});

			//res.status(200).send({patient, patient})
			// if the two objects are the same, the previous line can be set as follows
			res.status(200).send({listmsgs})
	})
}

function getAllMsgs(req, res){
	let userId= crypt.decrypt(req.params.userId);
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'SuperAdmin'){
			Support.find({platform: 'Relief Ukraine'},(err, msgs) => {

					if (err) return res.status(500).send({message: `Error making the request: ${err}`})

					var listmsgs = [];

					msgs.forEach(function(u) {
						User.findById(u.createdBy, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user2) => {
							if(user2){
								listmsgs.push({subject:u.subject, description: u.description, date: u.date, status: u.status, statusDate: u.statusDate, type: u.type, _id: u._id, files: u.files, email: user2.email, lang: user2.lang});
							}else{
								listmsgs.push({subject:u.subject, description: u.description, date: u.date, status: u.status, statusDate: u.statusDate, type: u.type, _id: u._id, files: u.files, email: '', lang: ''});
							}
							if(listmsgs.length == msgs.length){
								res.status(200).send({listmsgs})
							}
						});

					});

					//res.status(200).send({patient, patient})
					// if the two objects are the same, the previous line can be set as follows

			})

		}else{
			res.status(401).send({message: 'without permission'})
		}

	})

}

function updateMsg (req, res){
	let supportId= req.params.supportId;
	let update = req.body

	Support.findByIdAndUpdate(supportId, update, {select: '-createdBy', new: true}, (err,diagnosisUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: 'Msg updated', msg: diagnosisUpdated})

	})
}


module.exports = {
	sendMsgSupport,
	sendMsgLogoutSupport,
	getUserMsgs,
	getAllMsgs,
	updateMsg
}
