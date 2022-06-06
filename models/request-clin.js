// Patient schema
'use strict'

const mongoose = require ('mongoose')
const Schema = mongoose.Schema
const User = require('./user')

const { conndbdata } = require('../db_connect')
const crypt = require('../services/crypt')

const drugsSchema = Schema({
	strength: String,
	link: String,
	dose: Number,
	name: String,
	salesforceId: String,
})

const RequestClinSchema = Schema({
	lat: {type: String, default: ''},
	lng: {type: String, default: ''},
	birthDate: Date,
	country: {type: String, default: null},
	notes: {type: String, default: ''},
	status: {type: String, default: null},
	updateDate: {type: Date, default: Date.now},
	creationDate: {type: Date, default: Date.now},
	referralCenter: {type: String, default: ''},
	needAssistance: {type: String, default: ''},
	group: { type: String, default: null},
	drugs: [drugsSchema],
	salesforceId: {type: String, default: null},
	salesforceCleanId: {type: String, default: null},
	createdBy: { type: Schema.Types.ObjectId, ref: "User"}
})

RequestClinSchema.pre('save', function (next) {
	this.lat = crypt.encrypt(this.lat)
	this.lng = crypt.encrypt(this.lng)
	this.needAssistance = crypt.encrypt(this.needAssistance);
	this.referralCenter = crypt.encrypt(this.referralCenter);
	next();
});

RequestClinSchema.post('save', function (document) {
	if(document !== null){
		document.lat = crypt.decrypt(document.lat)
		document.lng = crypt.decrypt(document.lng)
		document.needAssistance = crypt.decrypt(document.needAssistance)
		document.referralCenter = crypt.decrypt(document.referralCenter)
	}
});

RequestClinSchema.post('findOne', function (document) {
	if(document !== null){
		document.lat = crypt.decrypt(document.lat)
		document.lng = crypt.decrypt(document.lng)
		document.needAssistance = crypt.decrypt(document.needAssistance)
		document.referralCenter = crypt.decrypt(document.referralCenter)
	}
});

RequestClinSchema.post('find', function (documents) {
	if(documents !== null){
		//console.log(documents)
		documents.forEach(function(document) {
			document.lat = crypt.decrypt(document.lat)
			document.lng = crypt.decrypt(document.lng)
			document.needAssistance = crypt.decrypt(document.needAssistance)
			document.referralCenter = crypt.decrypt(document.referralCenter)
		});
	}
});

RequestClinSchema.post('findById', function (document) {
	if(document !== null){
		document.lat = crypt.decrypt(document.lat)
		document.lng = crypt.decrypt(document.lng)
		document.needAssistance = crypt.decrypt(document.needAssistance)
		document.referralCenter = crypt.decrypt(document.referralCenter)
	}
});

RequestClinSchema.post('findByIdAndUpdate', function (document) {
	if(document !== null){
		document.lat = crypt.decrypt(document.lat)
		document.lng = crypt.decrypt(document.lng)
		document.needAssistance = crypt.decrypt(document.needAssistance)
		document.referralCenter = crypt.decrypt(document.referralCenter)
	}
});

module.exports = conndbdata.model('RequestCli',RequestClinSchema)
// we need to export the model so that it is accessible in the rest of the app
