/*******************************************************************************
* Copyright (c) 2013-2015 IBM Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*******************************************************************************/
function showLoginDialog() {
	dijit.byId('loginDialog').show();
}

function hideLoginDialog() {
	dijit.byId('loginDialog').hide();
}

function showLoginWaitDialog() {
	dijit.byId('loginWaitDialog').show();
}

function hideLoginWaitDialog() {
	dijit.byId('loginWaitDialog').hide();
}

function showWaitDialog() {
	dijit.byId('waitDialog').show();
}

function hideWaitDialog() {
	dijit.byId('waitDialog').hide();
}

function updateLoggedInUserWelcome() {
	const session = dojo.cookie("acmerair-user");
	if (!session) {
		dojo.byId("loggedinwelcome").innerHTML = '';
	} else {
		const data = session.split(';')
		dojo.byId("loggedinwelcome").innerHTML = 'Welcome Back ' + data[2];
	}
}

function login() {
	hideLoginDialog();
	showLoginWaitDialog();
	
	dojo.xhrPost({
		content : {
			login: document.getElementById('userId').value,
			password: document.getElementById('password').value
		},
		url: 'rest/api/login',
		handleAs: 'json',
		load: (response) => { 
			if (!response) {
				throw new Error('trouble logging in')
			}

			hideLoginWaitDialog();
			const sessionData = `${response.sessionId};${response.customerId};${response.email}`

			dojo.cookie("acmerair-user", sessionData, {expires: response.expires});
			updateLoggedInUserWelcome();
		},
    error: (err) => {
			hideLoginWaitDialog();
			console.log(err)
		}
	});
}

function logout() {
	const session = dojo.cookie("acmerair-user");
	if (!session) { return;	}
	
	const data = session.split(';')

	dojo.xhrPost({
		content : {
			sessionId: data[0]
		},
		url: 'rest/api/logout',
		load: (response) => { 
			dojo.cookie("acmerair-user", null, {expires: 0});
			updateLoggedInUserWelcome();
		},
    error: (err) => {
			hideLoginWaitDialog();
			console.log(err)
		}
	});
}

function dateFormatter(data) {
	var d = new Date(data);
	return dojo.date.locale.format(d, {selector: 'date', datePattern: 'MMMM d, yyyy - hh:mm a'});
}

function currencyFormatter(data) {
	return dojo.currency.format(data, {currency: "USD"});
}

// genned from mongo by:  db.airportcodes.find({}, {airportCode:1, airportName:1}).forEach(function(f){print(tojson(f, '', true));});
// switch airportCode to id
var airportCodes = [
	{ airportName : "Brussels", id : "BRU" },
	{ airportName : "Cairo", id : "CAI" },
	{ airportName : "Dubai", id : "DXB" },
	{ airportName : "Geneva", id : "GVA" },
	{ airportName : "Istanbul", id : "IST" },
	{ airportName : "Karachi", id : "KHI" },
	{ airportName : "Kuwait", id : "KWI" },
	{ airportName : "Lagos", id : "LOS" },
	{ airportName : "Manila", id : "MNL" },
	{ airportName : "Mexico City", id : "MEX" },
	{ airportName : "Nairobi", id : "NBO" },
	{ airportName : "Prague", id : "PRG" },
	{ airportName : "Rio de Janeir", id : "GIG" },
	{ airportName : "Stockholm", id : "ARN" },
	{ airportName : "Mumbai", id : "BOM" },
	{ airportName : "Delhi", id : "DEL" },
	{ airportName : "Frankfurt", id : "FRA" },
	{ airportName : "Hong Kong", id : "HKG" },
	{ airportName : "London", id : "LHR" },
	{ airportName : "Montreal", id : "YUL" },
	{ airportName : "Moscow", id : "SVO" },
	{ airportName : "New York", id : "JFK" },
	{ airportName : "Paris", id : "CDG" },
	{ airportName : "Rome", id : "FCO" },
	{ airportName : "Singapore", id : "SIN" },
	{ airportName : "Sydney", id : "SYD" },
	{ airportName : "Tehran", id : "IKA" },
	{ airportName : "Tokyo", id : "NRT" },
	{ airportName : "Amsterdam", id : "AMS" },
	{ airportName : "Aukland", id : "AKL" },
	{ airportName : "Bangkok", id : "BKK" }
];

function airportCodeToAirportName(airportCode) {
	var airports = dojo.filter(airportCodes, function (item) { return item.id == airportCode; } );
	if (airports.length > 0) {
		return airports[0].airportName;
	}
	return airportCode;
}