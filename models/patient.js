// Patient schema
'use strict'

const mongoose = require ('mongoose')
const Schema = mongoose.Schema
const User = require('./user')

const { conndbdata } = require('../db_connect')

const checksSchema = Schema({
	check1: {type: Boolean, default: false},
	check2: {type: Boolean, default: false},
	check3: {type: Boolean, default: false},
	check4: {type: Boolean, default: false}
})

const drugsSchema = Schema({
	strength: String,
	link: String,
	dose: Number,
	name: String,
	salesforceId: String,
})

const PatientSchema = Schema({
	patientName: String,
	surname: String,
	birthDate: Date,
	citybirth: String,
	provincebirth: String,
	countrybirth: String,
	street: {type: String, default: null},
	postalCode: {type: String, default: null},
	city: {type: String, default: null},
	province: {type: String, default: null},
	country: {type: String, default: null},
	lat: {type: String, default: ''},
	lng: {type: String, default: ''},
	phone1: {type: String, default: null},
	phone2: {type: String, default: null},
	gender: {type: String, default: null},
	createdBy: { type: Schema.Types.ObjectId, ref: "User"},
	death: Date,
	notes: {type: String, default: ''},
	sharing: {type: Object, default: []},
	status: {type: String, default: null},
	lastAccess: {type: Date, default: Date.now},
	creationDate: {type: Date, default: Date.now},
	previousDiagnosis: {type: String, default: null},
	referralCenter: {type: String, default: null},
	needAssistance: {type: String, default: null},
	group: { type: String, default: null},
	salesforceId: {type: String, default: null},
	checks: {type: checksSchema, default: {
		check1: false,
		check2: false,
		check3: false,
		check4: false
	}},
	drugs: [drugsSchema]
})

module.exports = conndbdata.model('Patient',PatientSchema)
// we need to export the model so that it is accessible in the rest of the app
