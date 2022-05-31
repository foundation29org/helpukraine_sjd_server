// Patient schema
'use strict'

const mongoose = require ('mongoose')
const Schema = mongoose.Schema
const User = require('./user')

const { conndbaccounts } = require('../db_connect')

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
	referralCenter: {type: String, default: null},
	needAssistance: {type: String, default: null},
	group: { type: String, default: null},
	drugs: [drugsSchema],
	salesforceId: {type: String, default: null},
	salesforceCleanId: {type: String, default: null},
	createdBy: { type: Schema.Types.ObjectId, ref: "User"}
})

module.exports = conndbaccounts.model('RequestCli',RequestClinSchema)
// we need to export the model so that it is accessible in the rest of the app
