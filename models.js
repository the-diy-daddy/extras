"use strict";

var sw_upgrade_error_code_m = "";
var new_ver = "";
var new_buildtime = "";
var _sysRege = {
	ipv6addr: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,
	ipaddr: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
	macaddr: /^[0-9a-fA-F]{1,2}([\.:])(?:[0-9a-fA-F]{1,2}\1){4}[0-9a-fA-F]{1,2}$/,
	passwd: /^[!@#%^*0-9a-zA-Z]*$/,
	// /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&;:?<>.,'"/\\]).{8,15})/
	has_upperCaseLetter: /[A-Z]/,
	has_lowerCaseLetter: /[a-z]/,
	has_letter: /[a-zA-Z]/,
	has_number: /[0-9]/,
	has_specialChar: /[!@#$%^&;:?<>\.,\'\"\/\\]/
};
var _sysFunc = {

  RepSeq: function (str, n) {
	  var rep = false;
	  var seq = false;
	  var result = [];
	  
	  const num = '0123456789';
	  const abc = 'abcdefghijklmnopqrstuvqxyz';
	  
	  if (str.length < n) return false;
	  
	  for (var i = 0; i < str.length; i++) {
		if (i + n > str.length) break;

		var chunk = str.slice(i, i + n);
		var seqABC = abc.indexOf(chunk) > -1;
		var seq123 = num.indexOf(chunk) > -1;
		
		if (seq123 || seqABC) {
		  seq = true;
		  result.push(chunk);
		}
		
		
		if ([...chunk].every(v => v.toLowerCase() === chunk[0].toLowerCase())) {
		  rep = true;
		  result.push(chunk);
		}
	  }
	  
	  return {
		repetition: rep,
		sequential: seq,
		out: result
	  };
  },

  urlFormateValidateion: function (val){
	var rege = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/i;
	if(rege.test(val)) return true;
	else {
		return false;
	};
  },
  isNumberAndBetween: function(test_val, min, max){
	  var isvalid = false;
					var tmpVal = Number(test_val);
					if(Number.isNaN(tmpVal)){
					}else{
						if (tmpVal >= min && tmpVal <= max){
							isvalid = true;
						}
					}
					return isvalid;					
  },
  remove_num_comma_in_value: function(value){			
	  		if(value && value.indexOf(",") >= 0){
				var arvalue = value.split(',');
				arvalue.shift();
				value = arvalue.toString();
			}
			return value;
  },
  isValidSubnetMask: function(subnetMask) {
	// Split the subnet mask into an array of octets
	const octets = subnetMask.split('.');
  
	// Check if there are exactly 4 octets
	if (octets.length !== 4) {
		return false;
	}

	// Check each octet for validity
	for (const octet of octets) {
		const value = parseInt(octet, 10);

		// Each octet should be between 0 and 255
		if (isNaN(value) || value < 0 || value > 255) {
			return false;
		}
	}

	// Check if it's a valid subnet mask pattern
	const binaryRepresentation = octets.map(octet => parseInt(octet, 10).toString(2).padStart(8, '0')).join('');
	const firstZeroIndex = binaryRepresentation.indexOf('0');
	const lastOneIndex = binaryRepresentation.lastIndexOf('1');

	// The subnet mask should have all 1s followed by all 0s in binary representation
	if (firstZeroIndex > lastOneIndex) {
		return true;
	}

	return false;
  }
};

var SYS_RESET = Backbone.Model.extend({
	url: '/data/reset.json',
	defaults: {
		chk_sys_busy: "0"
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				default:
					if(typeof(val) !== 'string'){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR' });
					}
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var SYS_LOGIN = Backbone.Model.extend({
	url: '/data/login.json',
	defaults: {
		LoginName: "",
		LoginPWD: "",
		remember_pwd: "",
		loginResetPassword: "0",
		without_password: "0",
		remember_choice: "0",
		loginUserResetToDefault: "0",
		loginUserChkLoginTimeout: "0",
		logout: "0"
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'LoginName':
					if(val.length <= 0){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_STRING_LOGIN_NAME' });
					}
					break;
				case 'LoginPWD':
					if(val.length <= 0){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_STRING_LOGIN_PWD' });
					}
					break;
				default:
					if(!(val === "0" || val === "1")){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR' });
					}
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ACS_LOGIN = Backbone.Model.extend({
	url: '/data/login_acs.json',
	defaults: {
		LoginName: "",
		LoginPWD: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'LoginName':
					if(val.length <= 0){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_STRING_LOGIN_NAME' });
					}
					break;
				case 'LoginPWD':
					if(val.length <= 0){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_STRING_LOGIN_PWD' });
					}
					break;
				default:
					if(!(val === "0" || val === "1")){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR' });
					}
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var SYS_USER_LANG = Backbone.Model.extend({
	url: '/data/user_lang.json',
	defaults: {
		delay_time: "0",
		encryption_key: "0123456789",
		salt: "0123456789",
		lang_code: "en",
		device_name: "JioODU",
		device_type: "",
		default_login: "",
		remember_pwd: "",
		sw_version: "",
		fw_version: "",
		hw_version: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'lang_code':
					if(!(val === 'en' || val === 'cn')){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR' });
					}
					break;
				default:
					invalid = true;
					ret.push({ error: 1, key: key, msg: 'ERROR' });
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var SYS_USER_DATA = Backbone.Model.extend({
	url: '/data/user_data.json',
	defaults: {
		username: "",
		usermode: "admin",
		lang_code: "en",
		device_name: "JioODU",
		device_type: "",
		sw_version: "",
		fw_version: "",
		hw_version: "",
		lan_mode: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'lang_code':
					if(!(val === 'en' || val === 'cn')){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR' });
					}
					break;
				case 'usermode':
					if(!(val === 'admin' || val === 'enduser')){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR' });
					}
					break;
				default:
					invalid = true;
					ret.push({ error: 1, key: key, msg: 'ERROR' });
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var SYS_MAIN_NAVIGATION_MENU = Backbone.Model.extend({
	defaults: {
		device_name: "JioODU",
		device_type: "",
		path: "",
		dropdown: "",
		menu: []
	}
});

var SYS_MAIN_POPUP_SECTION = Backbone.Model.extend({
	defaults: {
		userPopup: false,
		menuSearchPopup: false,
		menuSerachRes: [],
		sw_version: "",
		hw_version: "",
		usermode: "admin"
	}
});

var SYS_TEMP_JIO1SECTION_NOINPUT = Backbone.Model.extend({
	defaults: {
		arr: []
	}
});

var SYS_TEMP_JIO1SECTION_WITHINPUT = Backbone.Model.extend({
	defaults: {
		arr: []
	}
});

var SYS_TEMP_JIO2SECTION_NOINPUT = Backbone.Model.extend({
	defaults: {
		str: "",
		lang: "",
		icon: "",
		arr: []
	}
});

var SYS_TEMP_FORJIOTABLESORT = Backbone.Model.extend({
	defaults: {
		head: [],
		lists: []
	}
});
var m_PWD_REQUIREMENTS = Backbone.Model.extend({
	url: '/data/pwd_requirements.json',
	defaults: {
		pwd_forbidden: ""
	},
	validate: function(attrs, options) {

	}
});
var m_UPDATE_PASSWORD = Backbone.Model.extend({
	url: '/data/update_password.json',
	defaults: {
		old_pwd: "",
		new_pwd: "",
		confirm_new_pwd: ""
	},
	validate: function(attrs, options) {
		//Password Complexity : 
		// Passwords shall contain a mix of alphabetic and non-alphabetic characters 
		// (including number, punctuation or special characters) 
		// or a mix of at least two types of non-alphabetic characters.
		// Minimum 8 characters with   
		// both upper and lower case characters successive & incremental password not allowed.
		// Not be from dictionary words.
		//	* Passwords shall not contain the user's account name/ID 
		//	  or company name (abbreviated or full), 
		//	  even if it fulfils the complexity criteria . ( E.g Jio,Reliance,Ril..etc)		
		//	* Incremental passwords shall not be allowed, e.g. with ‘abc’ or ‘123’ in them. 

		var _this = this;
		var invalid = false;
		var ret = [];
		do {
			//
			if(attrs.new_pwd === attrs.old_pwd){
				invalid = true;
				ret.push({ error: 1, key: 'new_pwd', msg: 'MAIN_MSG_PASSWORD_NO_CHANGE' });
				ret.push({ error: 1, key: 'old_pwd', msg: 'MAIN_MSG_PASSWORD_NO_CHANGE' });
				break;
			}else{
				if(attrs.new_pwd !== attrs.confirm_new_pwd){
					invalid = true;
					ret.push({ error: 1, key: 'new_pwd', msg: 'MAIN_MSG_PASSWORD_NOT_MATCH' });
					ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_NOT_MATCH' });
					break;
				}				
			}
			//console.log("check rules");

			_.map(attrs, function (val, key) {
				switch(key){
					case 'new_pwd':
					  do {
						_this.changed[key] = val; //must save
						var val_text = atob(val);
						if(val === '' || val_text.length < 8 || val_text.length > 32){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_PASSWORD_SIZE' });
							ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_INVALID_PASSWORD_SIZE' });
							break;	
						}
						/*if(!_sysRege.passwd.test(val_text)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_PASSWORD' });
							ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_INVALID_PASSWORD' });
							break;
						
						}*/
						
						// Incremental passwords shall not be allowed, e.g. with ‘abc’ or ‘123’ in them.						
						var reqseq = _sysFunc.RepSeq(val_text, 3);
						if (reqseq.sequential == true){
						  invalid = true;
						  ret.push({ error: 1, key: key, msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
						  ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
						  break;
						}
						
						// must have at least two types of chars
						var groups = 0;
						var groups_required = 4;
						do {
							groups += (_sysRege.has_upperCaseLetter.test(val_text) ? 1 : 0);
							if (groups >= groups_required)break;
							groups += (_sysRege.has_lowerCaseLetter.test(val_text) ? 1 : 0);
							if (groups >= groups_required)break;
							groups += (_sysRege.has_number.test(val_text) ? 1 : 0);
							if (groups >= groups_required)break;
							groups += (_sysRege.has_specialChar.test(val_text) ? 1 : 0);
						}while(false);
						//console.log(val_text + ' groups: ' + groups);					
						if (groups >= groups_required){						
						}else{
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
							ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
							break;
						}				
						// Passwords shall not contain some specified words					
						var pwd_forbidden = _this.get('pwd_forbidden');
						if (pwd_forbidden && pwd_forbidden.length > 0){
						  var regex = new RegExp(pwd_forbidden, "i");
						  if (val_text.match(regex)){	
							//console.log('contains forbidden words');
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_PASSWORD_NO_COMPANY_NAME' });
							ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_NO_COMPANY_NAME' });
							break;
						  }
						}					
						
					  }while(false);
					  break;
					case 'confirm_new_pwd':
						_this.changed[key] = val; 
						break;
					case 'old_pwd':
					default:
				}
			});
		}while(false);
		//
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_NETWORK_STATUS = Backbone.Model.extend({
	url: '/data/network_status.json',
	defaults: {
		ipv4_ipaddr: "--",
		ipv4_subnet_mask: "NA",
		ipv4_default_gateway: "NA",
		ipv4_primary_dns: "NA",
		ipv6_ipaddr: "NA",
		ipv6_prefix_length: "NA",
		ipv6_default_gateway: "NA",
		ipv6_primary_dns: "NA",
		ipv6_clat_ipaddr: "NA",
	}
});

var m_NETWORK_STATUS_DEVICE_CONNECTION = Backbone.Model.extend({
	url: '/data/network_status_device_connection.json',
	defaults: {
		connection_status: "--",
		connection_duration: "--",
		host_name: "--",
		operator_name: "--",
	}
});

var m_NETWORK_STATUS_CELL_PARAMETERS = Backbone.Model.extend({
	url: '/data/network_status_cell_parameters.json',
	defaults: {
		signal_strength: "0",
		operating_mode: "--",
		band: "--",
		bandwidth: "--",
		nr_earcn: "--",
		physical_cell_id: "--",
		plmn: "--",
		default_apn: "--",
		user_apn: "--",
		physical_cell_id2: "--",
		ncgi: "--",
		beam_id: "--",
		rrc_state: "--",
		dl_bler: "--",
		modulation: "--",
		mimo: "--",
		rb: "--",
		cqi: "--",
		ss_rsrp: "--",
		ss_rsrq: "--",
		ss_sinr: "--",
		throughput: "--",
		rel_ver: "--",
	}
});

var m_NETWORK_STATUS_SECONDARY_CELL_PARAMETERS = Backbone.Model.extend({
	url: '/data/network_status_secondary_cell_parameters.json',
	defaults: {
		signal_strength: "0",
		operating_mode: "--",
		band: "--",
		bandwidth: "--",
		nr_earcn: "--",
		physical_cell_id: "--",
		plmn: "--",
		default_apn: "--",
		user_apn: "--",
		physical_cell_id2: "--",
		ncgi: "--",
		beam_id: "--",
		rrc_state: "--",
		dl_bler: "--",
		modulation: "--",
		mimo: "--",
		rb: "--",
		cqi: "--",
		ss_rsrp: "--",
		ss_rsrq: "--",
		ss_sinr: "--",
		throughput: "--",
		rel_ver: "--",
	}
});

var m_NETWORK_STATUS_NEIGHBOR_CELL_PARAMETERS = Backbone.Model.extend({
	url: '/data/network_status_neighbor_cell_parameters.json',
	defaults: {
		signal_strength: "0",
		operating_mode: "--",
		band: "--",
		bandwidth: "--",
		nr_earcn: "--",
		physical_cell_id: "--",
		plmn: "--",
		ncgi: "--",
		cqi: "--",
		ss_rsrp: "--",
		ss_rsrq: "--",
	}
});

var m_NETWORK_STATUS_NR_CA_SCELLS = Backbone.Model.extend({
	url: '/data/network_status_nr_ca_scells.json',
	defaults: {
		pci: "--",
		band: "--",
		earfcn: "--",
		bandwidth: "--",
	}
});

var m_NETWORK_STATUS_DEVICE = Backbone.Model.extend({
	url: '/data/network_status_device.json',
	defaults: {
		time: "--",
		odm: "--",
		eid: "--",
		product_id: "--",
		sw_version: "--",
		hw_version: "--",
		device_make: "--",
		serial_number: "--",
		imei: "--",
		imsi: "--",
		msisdn: "--",
		iccid: "--",
		sw_creation_date: "--",
		primary_mac_id: "--",
		device_oui: "--",
		device_model: "--",
		supported_bands: "--"
	}
});

var m_NETWORK_STATUS_DEVICE_DATA = Backbone.Model.extend({
	url: '/data/network_status_device_data.json',
	defaults: {
		data_sent: "--",
		data_received: "--",
		packet_loss: "--"
	}
});

var m_INTERNET_UMTS = Backbone.Model.extend({
	url: '/data/internet_umts.json',
	defaults: {
		"umts_pin_enable" : "",
		"umts_pin_status" : "",
		"umts_pin_code" : "",
		"umts_pin_code_attempt" : ""
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'umts_pin_code':
					_this.changed[key] = val; //must save
					if(val.length != 4 /* || val.length < 8*/){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	},
	
	isSimInsert: function(){
		return this.get('umts_pin_status') != "No SIM";
	},
	isPukAttempsExpired: function(){
		return (this.get('umts_pin_code_attempt') <=0);		
	},
	isPinOK: function(){
		return (this.get('umts_pin_enable') == "1") && (this.get('umts_pin_status') == "Valid");		
	},
	isSimCardOK: function(){
		return this.get('umts_pin_status') != "Invalid SIM";		
	},
	isPinLock: function(){
		return (this.get('umts_pin_enable') == "1") && (this.get('umts_pin_status') == "PIN Lock");		
	},
	isPinEnabled: function(){
		return this.get('umts_pin_enable') == "1";		
	}
});

var m_SMS_FORWARD = Backbone.Model.extend({
	url: '/data/sms_forward.json',
	defaults: {
		"sms_to" : "",
		"sms_msg" : "",
		"sms_forward_original_from" : "",
		"sms_forward_idx" : ""
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'sms_to':
					_this.changed[key] = val; //must have
					if(val.length <= 0){
						//console.log("no sms_to!!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	
	}
});

var m_SMS_SENT_FORWARD = m_SMS_FORWARD.extend({
	url: '/data/sms_sent_forward.json'
});


var m_SMS_REPLY = Backbone.Model.extend({
	url: '/data/sms_reply.json',
	defaults: {
		"sms_to" : "",
		"sms_msg" : "",
		"sms_reply_idx" : ""
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'sms_msg':
					_this.changed[key] = val; //must have
					if(val.length > 160){
						//console.log("sms msg too long!!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	
	}
});
var m_SMS_SENT_REPLY = m_SMS_REPLY.extend({
	url: '/data/sms_sent_reply.json',
});
var m_SMS_COMPOSE = Backbone.Model.extend({
	url: '/data/sms_compose.json',
	defaults: {
		"sms_to" : "",
		"sms_msg" : "",
		"sms_to_idx" : "",
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'sms_to':
					_this.changed[key] = val; //must have
					if(val.length <= 0){
						//console.log("no sms_to!!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'SMS_INBOX_13' });
					}
					break;
				case 'sms_msg':
					_this.changed[key] = val; //must have
					if(val.length > 160){
						//console.log("sms msg too long!!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	
	}
});
var m_SMS_GROUP_SEND = Backbone.Model.extend({
	url: '/data/sms_group_send.json',
	defaults: {
		"sms_to" : "",
		"sms_msg" : "",
		"sms_group_idx" : ""
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'sms_to':
					_this.changed[key] = val; //must have
					if(val.length <= 0){
						//console.log("no sms_to!!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'SMS_INBOX_13' });
					}
					break;
				case 'sms_msg':
					_this.changed[key] = val; //must have
					if(val.length > 160){
						//console.log("sms msg too long!!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}else if (val.length <= 0){
						//console.log("sms msg too small !!!");
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'SMS_GROUPS_9' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	
	}
});
var m_BOOT_CAUSE = Backbone.Model.extend({
	url: '/data/boot_cause.json',
	defaults: {
		boot_cause: ""
	}
});

var m_NETWORK_STATUS_LAN = Backbone.Model.extend({
	url: '/data/network_status_lan.json',
	defaults: {
		mode: "--",
		ipv4_ipaddr: "--",
		operating_mode: "--",
		ipv4_subnet_mask: "--",
		ipv4_default_gateway: "--",
		ipv6_ipaddr: "--",
		ipv6_prelen: "--",
		ipv6_default_gateway: "--",
		connection_uptime: "--",
		link_status: "--",
		speed: "--",
		duplex_mode: "--",
		bridge_mode_note: "--"
	}
});

var m_NETWORK_STATUS_UTILIZATION = Backbone.Model.extend({
	url: '/data/network_status_utilization.json',
	defaults: {
		duration: "--",
		uptime: "--",
		firewall_status: "--",
		cpu_current_usage: "--",
		cpu_maximum_usage: "--",
		cpu_minimum_usage: "--",
		mem_current_usage: "--",
		mem_maximum_usage: "--",
		mem_minimum_usage: "--",
		uplink_average_data_rate: "--",
		uplink_maximum_data_rate: "--",
		uplink_minimum_data_rate: "--",
		downlink_average_data_rate: "--",
		downlink_maximum_data_rate: "--",
		downlink_minimum_data_rate: "--"
	}
});

var m_SETTINGS_CELLULAR_APN = Backbone.Model.extend({
	url: '/data/settings_cellular_apn.json',
	defaults: {
		id: "0",
		status: "0",
		name: "",
		type: "ipv4"
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'name':
					if(!(val === 'ims')){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_CONNECTED_DEVICE = Backbone.Model.extend({
	url: '/data/connected_device.json',
	defaults: {
		id: "0",
		hostname: "",
		mac: "",
		ip: "",
		device_type: "",
		lease_time: ""
	}
});

var m_CDT_STATUS = Backbone.Model.extend({
	url: '/data/cdt_status.json',
	defaults: {
		pair: "",
		pair_status: "",
		pair_length: "",
		pair_distance_to_fault: ""
	}
});

var m_SETTINGS_CELLULAR_CELLULAR_BAND_SELECTION = Backbone.Model.extend({
	url: '/data/settings_cellular_band_selection.json',
	defaults: {
		scan_mode: "",
		operating_mode: "",
		type: "",
		band: "",
		nr_arfcn: "",
		bid: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'band':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'nr_arfcn':
					var tmpVal = Number(val);
					if(tmpVal > 653333 || tmpVal < 620000 || Number.isNaN(tmpVal)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS = Backbone.Model.extend({
	url: '/data/settings_cellular_default_apn_settings.json',
	defaults: {
		apn_status: "",
		apn_network: "",
		apn_name: "",
		connection_type: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'apn_name':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SETTINGS_ESIM_ADD_PROFILES = Backbone.Model.extend({
	url: '/data/settings_esim_add_profiles.json',
	defaults: {
                defaultSMDPAddress: "",
		activateCodeEnbable: "",
		activateCode: "",
		eSIMProfileDownload: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'activateCode':
					if(/^[a-fA-F0-9]+$/.test(val) != true){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_TOKEN' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SETTINGS_ESIM_ADD_PROFILES_PROGRESS = Backbone.Model.extend({
	url: '/data/settings_esim_add_profiles_progress.json',
	defaults: {
		Pogress: "",
                error_code: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SETTINGS_ESIM_BLUETOOTH_SETTINGS = Backbone.Model.extend({
	url: '/data/settings_esim_bluetooth_settings.json',
	defaults: {
		BluetoothEnable: "",
		BTConenctedDev: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				/*case 'BTConenctedDev':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;*/
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SETTINGS_CELLULAR_PIN_MANAGEMENT = Backbone.Model.extend({
	url: '/data/settings_cellular_pin_management.json',
	defaults: {
		pin_status: "",
		pin_code: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		// _.map(this.changed, function (val, key) {
		_.map(attrs, function (val, key) {
			switch(key){
				case 'pin_code':
					if(val != ''){
						if(val.indexOf(",") >= 0){
							var code = val.split(",");
							val = code[1];
						}
						if(val.length != 4){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
						}
					}else{
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					
					/*if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}*/
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SETTINGS_LAN_INTERNET_PROTOCOL = Backbone.Model.extend({
	url: '/data/settings_lan_internet_protocol.json',
	defaults: {
		operation_mode: "router",
		host_name: "",
		host_ipaddr_type: "c",
		host_ipaddr: "",
		host_subnet_mask_type: "a",
		host_subnet_mask: "",
		mtu: "1500",
		dhcp_enable: "0",
		start_ipaddr: "",
		end_ipaddr: "",
		subnet_mask: "",
		primary_dns: "",
		secondary_dns: "",
		lease_time: "",
		domain_name: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var start;
		var end;
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'host_subnet_mask':
					var rege = _sysRege.ipaddr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'host_ipaddr_type':
					var ipaddr = attrs.host_ipaddr.split('.');
					if((val === 'a' && !_sysFunc.isNumberAndBetween(parseInt(ipaddr[0]), 1, 126)) ||
					 (val === 'b' && !_sysFunc.isNumberAndBetween(parseInt(ipaddr[0]), 128, 191)) ||
					 (val === 'c' && !_sysFunc.isNumberAndBetween(parseInt(ipaddr[0]), 192, 223))){
						invalid = true;
						ret.push({ error: 1, key: 'host_ipaddr', msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'host_ipaddr':
					var tmpVal = val.split('.');
					var type = attrs.host_ipaddr_type;
					if((type === 'a' && !_sysFunc.isNumberAndBetween(parseInt(tmpVal[0]), 1, 126)) ||
					 (type === 'b' && !_sysFunc.isNumberAndBetween(parseInt(tmpVal[0]), 128, 191)) ||
					 (type === 'c' && !_sysFunc.isNumberAndBetween(parseInt(tmpVal[0]), 192, 223))){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'start_ipaddr':
				case 'end_ipaddr':
					var tmpVal = val.split('.');
					if(!_sysFunc.isNumberAndBetween(parseInt(tmpVal[0]), 1, 223)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'subnet_mask':
				// case 'primary_dns':
				// case 'secondary_dns':
					var rege = _sysRege.ipaddr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		start = attrs.start_ipaddr.split('.');
		end = attrs.end_ipaddr.split('.');
		for(var i = 0; i < 4; i++){
			if(parseInt(start[i]) > parseInt(end[i])){
				invalid = true;
				ret.push({ error: 1, key: 'start_ipaddr', msg: 'MAIN_MSG_INVALID_VALUE' });
				ret.push({ error: 1, key: 'end_ipaddr', msg: 'MAIN_MSG_INVALID_VALUE' });
				break;
			}
		}
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SETTINGS_LAN_OPERATION_MODE = Backbone.Model.extend({
	url: '/data/settings_lan_operation_mode.json',
	defaults: {
		host_name: "",
		mtu: "1500",
		mode: "router",
		mac_addr_type: "1",
		enter_mac: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var enter = 0;
		var check = 0;
		_.map(attrs, function (val, key) {
			switch(key){
				case 'mtu':
					var tmpVal = Number(val);
					if(tmpVal > 1500 || tmpVal < 1280 || Number.isNaN(tmpVal)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					break;
				case 'mode':
					if(val == 1){
						check = 1;
					}
					break;
				case 'mac_addr_type':
					if(val == '0'){
						enter = 1;
					}
					break;
				default:
			}
		});
		if(check){
			var rege = _sysRege.macaddr;
			if(enter){
				if(!rege.test(attrs.enter_mac) || attrs.enter_mac === ''){
					invalid = true;
					ret.push({ error: 1, key: "enter_mac", msg: 'MAIN_MSG_INVALID_VALUE' });
				}
			}
		}
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SETTINGS_PERIODIC_RA = Backbone.Model.extend({
	url: '/data/settings_periodic_ra.json',
	defaults: {
		enable: "0",
		interval: "10"
	}
});


var m_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST = Backbone.Model.extend({
	url: '/data/settings_lan_ipv4_static_address.json',
	defaults: {
		id: "0",
		device_name: "",
		ipaddr: "",
		macaddr: "",
		host_subnet_mask: "255.255.255.0",
		type: "ethernet"
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'device_name':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'ipaddr':
					var rege = _sysRege.ipaddr;
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'macaddr':
					var rege = _sysRege.macaddr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SETTINGS_DHCP_SERVER_DHCP_SERVER = Backbone.Model.extend({
	url: '/data/settings_dhcp_server.json',
	defaults: {
		dhcp_enable: "0",
		start_ipaddr: "",
		end_ipaddr: "",
		subnet_mask: "",
		primary_dns: "",
		secondary_dns: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var start;
		var end;
		// _.map(this.changed, function (val, key) {
		_.map(attrs, function (val, key) {
			switch(key){
				case 'start_ipaddr':
				case 'end_ipaddr':
				case 'subnet_mask':
				// case 'primary_dns':
				// case 'secondary_dns':
					var rege = _sysRege.ipaddr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		start = attrs.start_ipaddr.split('.');
		end = attrs.end_ipaddr.split('.');
		for(var i = 0; i < 4; i++){
			if(parseInt(start[i]) > parseInt(end[i])){
				invalid = true;
				ret.push({ error: 1, key: 'start_ipaddr', msg: 'MAIN_MSG_INVALID_VALUE' });
				ret.push({ error: 1, key: 'end_ipaddr', msg: 'MAIN_MSG_INVALID_VALUE' });
				break;
			}
		}
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST = Backbone.Model.extend({
	url: '/data/settings_dhcp_server_lease_reservation_list.json',
	defaults: {
		id: "0",
		host_name: "",
		ipaddr: "",
		macaddr: "",
		status: "0",
		support_type: "both",
		description: ""
	}
});
var m_PWD_STRENGTH = Backbone.Model.extend({
	//url: '/data/settings_dhcp_server.json',
	defaults: {
		pwd_strength: 0
	},
	calculate_pwd_strength: function(new_pwd){
		var cur_strength = 0;
		do {

			var val_text = new_pwd;
			if(val_text.length >= 15){
				cur_strength ++;
			}

			var groups = 0;

			do {
					groups += (_sysRege.has_upperCaseLetter.test(val_text) ? 1 : 0);
					//if (groups >= groups_required)break;
					groups += (_sysRege.has_lowerCaseLetter.test(val_text) ? 1 : 0);
					//if (groups >= groups_required)break;
					groups += (_sysRege.has_number.test(val_text) ? 1 : 0);
					//if (groups >= groups_required)break;
					groups += (_sysRege.has_specialChar.test(val_text) ? 1 : 0);
			}while(false);
			
			cur_strength += groups;		

		}while(false);
		//	
		return cur_strength;

	},
	validate: function(attrs, options) {

	}
});

var m_ADMIN_ACCOUNT_MANAGEMENT = Backbone.Model.extend({
	url: '/data/admin_account_management.json',
	defaults: {
		pwd_forbidden: "",
		username: "",
		old_pwd: "",
		new_pwd: "",
		confirm_new_pwd: ""
	},
	validate: function(attrs, options) {
		//Password Complexity : 
		// Passwords shall contain a mix of alphabetic and non-alphabetic characters 
		// (including number, punctuation or special characters) 
		// or a mix of at least two types of non-alphabetic characters.
		// Minimum 8 characters with   
		// both upper and lower case characters successive & incremental password not allowed.
		// Not be from dictionary words.
		//	* Passwords shall not contain the user's account name/ID 
		//	  or company name (abbreviated or full), 
		//	  even if it fulfils the complexity criteria . ( E.g Jio,Reliance,Ril..etc)		
		//	* Incremental passwords shall not be allowed, e.g. with ‘abc’ or ‘123’ in them. 

		var _this = this;
		var invalid = false;
		var ret = [];
		do {
			//
			if(attrs.new_pwd === attrs.old_pwd){
				invalid = true;
				ret.push({ error: 1, key: 'new_pwd', msg: 'MAIN_MSG_PASSWORD_NO_CHANGE' });
				ret.push({ error: 1, key: 'old_pwd', msg: 'MAIN_MSG_PASSWORD_NO_CHANGE' });
				break;
			}else{
				if(attrs.new_pwd !== attrs.confirm_new_pwd){
					invalid = true;
					ret.push({ error: 1, key: 'new_pwd', msg: 'MAIN_MSG_PASSWORD_NOT_MATCH' });
					ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_NOT_MATCH' });
					break;
				}
			}
			_.map(attrs, function (val, key) {
				switch(key){
					case 'username':
						_this.changed[key] = val; //must save
						if(val === ''){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_VALUE_MUST_BE_PROVIDED' });
						}
						break;

					case 'new_pwd':
					  do {
						_this.changed[key] = val; //must save
						var val_text = atob(val);
						if(val === '' || val_text.length < 8 || val_text.length > 32){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_PASSWORD_SIZE' });
							ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_INVALID_PASSWORD_SIZE' });
							break;	
						}

						// Incremental passwords shall not be allowed, e.g. with ‘abc’ or ‘123’ in them.						
						var reqseq = _sysFunc.RepSeq(val_text, 3);
						if (reqseq.sequential == true){
						  invalid = true;
						  ret.push({ error: 1, key: key, msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
						  ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
						  break;
						}
						
						// must have at least two types of chars
						var groups = 0;
						var groups_required = 4;
						do {
								groups += (_sysRege.has_upperCaseLetter.test(val_text) ? 1 : 0);
								if (groups >= groups_required)break;
								groups += (_sysRege.has_lowerCaseLetter.test(val_text) ? 1 : 0);
								if (groups >= groups_required)break;
								groups += (_sysRege.has_number.test(val_text) ? 1 : 0);
								if (groups >= groups_required)break;
								groups += (_sysRege.has_specialChar.test(val_text) ? 1 : 0);
						}while(false);
						//console.log(val_text + ' groups: ' + groups);					
						if (groups >= groups_required){						
						}else{
								invalid = true;
								ret.push({ error: 1, key: key, msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
								ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_USE_COMPLEX' });
								break;
						}				
						// Passwords shall not contain some specified words					
						var pwd_forbidden = _this.get('pwd_forbidden');
						if (pwd_forbidden && pwd_forbidden.length > 0){
						  var regex = new RegExp(pwd_forbidden, "i");
						  if (val_text.match(regex)){	
							//console.log('contains forbidden words');
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_PASSWORD_NO_COMPANY_NAME' });
							ret.push({ error: 1, key: 'confirm_new_pwd', msg: 'MAIN_MSG_PASSWORD_NO_COMPANY_NAME' });
							break;
						  }
						}					
						
					  }while(false);
					  break;
					case 'confirm_new_pwd':
						_this.changed[key] = val; 
						break;
					case 'old_pwd':
					default:
				}
			});

		}while(false);
		//
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ADMIN_DEVICE_MANAGEMENT = Backbone.Model.extend({
	url: '/data/admin_device_management.json',
	defaults: {
		session_timeout: "",
		refresh_time: "",
		language: "en"
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'session_timeout':
					var tmpVal = Number(val);
					if(tmpVal > 60 || tmpVal < 1 || Number.isNaN(tmpVal)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					break;
				case 'refresh_time':
					var tmpVal = Number(val);
					if(tmpVal > 300 || (tmpVal < 60 && tmpVal != 0) || Number.isNaN(tmpVal)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					break;
				case 'language':
					if(!(val === 'en')){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ADMIN_SYSTEM_MANAGEMENT = Backbone.Model.extend({
	url: '/data/admin_system_management.json',
	defaults: {
		restore: "0",
		reboot: "0",
		format: "0"
	}
});

var m_HELP_LOG_COLLECT = Backbone.Model.extend({
	url: '/data/help_log_collect.json',
	defaults: {
		Collect_Log: "0"
	}
});

var m_USER_APN_DEL = Backbone.Model.extend({
	url: '/data/user_apn_del.json',
	defaults: {
		delete: "0"
	}
});

var m_DHCP_CLIENT_DEL = Backbone.Model.extend({
	url: '/data/dhcp_client_del.json',
	defaults: {
		delete_client: "0"
	}
});

var m_SCAN_NEIGHBOR_CELL = Backbone.Model.extend({
	url: '/data/scan_neighbor_cell.json',
	defaults: {
		rescan: ""
	}
});

var m_MAC_F_DEL = Backbone.Model.extend({
	url: '/data/macaddr_filtering_del.json',
	defaults: {
		delete_mac: "0"
	}
});

var m_EOGRE_RULE_DEL = Backbone.Model.extend({
	url: '/data/eogre_rule_del.json',
	defaults: {
		delete_rule: "0"
	}
});
var m_IPADDR_F_DEL = Backbone.Model.extend({
	url: '/data/ipaddr_filtering_del.json',
	defaults: {
		delete_rule: "0"
	}
});
var m_URL_F_DEL = Backbone.Model.extend({
	url: '/data/url_filtering_del.json',
	defaults: {
		delete_rule: "0"
	}
});
var m_BASE_LIST_DEL = Backbone.Model.extend({
	url: '',
	defaults: {
		delete_rule: ""
	},
	preinitialize: function (attrs, options) {
		var _this = this;
		if (options){
			if (options.url) { _this.url = options.url; }
		}
	}
});

var m_SMS_INBOX_DEL = Backbone.Model.extend({
	url: '/data/sms_inbox_del.json',
	defaults: {
		delete_sms: ""
	}
});
var m_SMS_SENT_DEL = Backbone.Model.extend({
	url: '/data/sms_sent_del.json',
	defaults: {
		delete_sms: ""
	}
});
var m_SMS_SENT_RESEND = Backbone.Model.extend({
	url: '/data/sms_sent_resend.json',
	defaults: {
		sms_resend: ""
	}
});
var m_SMS_CONTACTS_DEL = Backbone.Model.extend({
	url: '/data/sms_contacts_del.json',
	defaults: {
		delete_sms: ""
	}
});
var m_SMS_GROUPS_DEL = Backbone.Model.extend({
	url: '/data/sms_groups_del.json',
	defaults: {
		delete_sms: ""
	}
})

var m_PORT_F_DEL = Backbone.Model.extend({
	url: '/data/upnp_port_forwarding_del.json',
	defaults: {
		delete_client: "0"
	}
});

var m_ESIM_PROFILE_DEL = Backbone.Model.extend({
	url: '/data/esim_profile_del.json',
	defaults: {
		delete_esim: "0"
	}
});

var m_ESIM_PROFILE_DEL_PASSWORD = Backbone.Model.extend({
	url: '/data/esim_profile_del.json',
	defaults: {
		delete_esim: "0",
		esim_delete_password: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var _this = this;
		var ret = [];
		// _.map(this.changed, function (val, key) {
		_.map(attrs, function (val, key) {
			switch(key){
				 case 'esim_delete_password':
					if(val == ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE'});
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ESIM_PROFILE_EDIT = Backbone.Model.extend({
	url: '/data/esim_profile_edit.json',
	defaults: {
		enalbe_esim: "0",
		disable_esim: "0"
	}
});
var m_EOGRE_RULE_DO = Backbone.Model.extend({
	url: '/data/eogre_rule_do.json',
	defaults: {
		enalbe: "",
		disable: ""
	}
});
var m_BASE_RULE_DO = Backbone.Model.extend({
	url: '',
	defaults: {
		enalbe: "",
		disable: ""
	},
	preinitialize: function (attrs, options) {
		var _this = this;
		if (options){
			if (options.url) { _this.url = options.url; }
		}
	}
});
var m_ADMIN_SOFTWARE_UPGRADE = Backbone.Model.extend({
	url: '/data/admin_software_upgrade.json',
	defaults: {
		sw_version: "--",
		sw_date: "--",
		sw_upgrade_error_code: "--",
		backup: "--",
		upgrade_path: "",
		upgrade_size: "",
		restore_path: "",
		restore_size: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'upgrade_path':
					var tmpVal = val.toLowerCase().split('.');
					if(tmpVal[tmpVal.length-1] !== 'ffw'){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_PATH' });
					}
					break;
				case 'restore_path':
					var tmpVal = val.toLowerCase().split('.');
					if(tmpVal[tmpVal.length-1] !== 'cfg'){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_PATH' });
					}
					break;
				case 'upgrade_size':
					if(val > 200*1024*1024){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_PATH' });
					}
					break;
				case 'restore_size':
					if(val > 1024*1024){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'ERROR_PATH' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_HELP_ABOUT = Backbone.Model.extend({
	url: '/data/help_about.json',
	defaults: {
		device_model: "--",
		web_ui_version: "--",
		software_version: "--",
		hardware_version: "--",
		eid: "--",
		imei: "--",
		mac_addr: "--"
	}
});

var m_HELP_LOG = Backbone.Model.extend({
	defaults: {
		id: "0",
		parameters: "",
		wan: "",
		lan: ""
	}
});

var m_ROUTING_TABLE = Backbone.Model.extend({
	defaults: {
		id: "0",
		destination: "",
		gateway: "",
		genmask: "",
		iface: ""
	}
});

var m_CELL_LOCK = Backbone.Model.extend({
	url: '/data/settings_cellular_cell_lock.json',
	defaults: {
		cell_lock_enable: "0",
		cell_lock_pci: "0",
		cell_lock_arfcn: "0"
	},
	validate: function(attrs, options) {
		var invalid = false;
		var _this = this;
		var ret = [];
        var int_val = /^\d+$/;
		// _.map(this.changed, function (val, key) {
		_.map(attrs, function (val, key) {
			switch(key){
				case 'cell_lock_pci':
					if(val != ''){
						if(int_val.test(val) === false || val < 1 || val > 65535){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
						}
					}else {
                        if (_this.attributes.cell_lock_enable == "1"){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
                        }
                    }
					break;
				case 'cell_lock_arfcn':
					if(val != ''){
						if(int_val.test(val) === false || val < 620352 || val > 652992){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
						}
					}else {
                        if (_this.attributes.cell_lock_enable == "1"){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
                        }
                    }
					
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ACS_CONFIGURATION = Backbone.Model.extend({
	url: '/data/acs_configuration.json',
	defaults: {
		acs_url: "--",
		last_connection: "--",
		username: "",
		password: "",
		periodic_inform_status: "0",
		periodic_inform_interval: "0",
		connection_request_username: "",
		connection_request_password: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'periodic_inform_interval':
					var tmpVal = Number(val);
					if(Number.isNaN(tmpVal)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_TELNET_CONFIGURATION = Backbone.Model.extend({
	url: '/data/telnet_configuration.json',
	defaults: {
		acs_url_status: "0"
	}
});

var m_UPNP_PORT_FORWARDING = Backbone.Model.extend({
	url: '/data/upnp_port_forwarding.json',
	defaults: {
		port_forwarding_status: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_UPNP_UPNP = Backbone.Model.extend({
	url: '/data/upnp_upnp.json',
	defaults: {
		upnp_status: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});


var m_ADM_MACADDR_FILTERING = Backbone.Model.extend({
	url: '/data/macaddr_filtering.json',
	defaults: {
		filtering_status: "",
		filtering_mode: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_EOGRE_STATUS = Backbone.Model.extend({
	url: '/data/eogre_status.json',
	defaults: {
		eogre: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_IPSEC_STATUS = Backbone.Model.extend({
	url: '/data/ipsec_status.json',
	defaults: {
		ipsec: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_OPENVPN_STATUS = Backbone.Model.extend({
	url: '/data/openvpn_status.json',
	defaults: {
		openvpn: "",
		mode: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_IPADDR_FILTERING = Backbone.Model.extend({
	url: '/data/ipaddr_filtering.json',
	defaults: {
		filtering_status: "",
		filtering_mode: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_URL_FILTERING = Backbone.Model.extend({
	url: '/data/url_filtering.json',
	defaults: {
		filtering_status: "",
		filtering_mode: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_LanIPV6_Settings = Backbone.Model.extend({
	url: '/data/lanipv6_settings.json',
	defaults: {
		ipv6_address: "",
		ipv6_prefix_length: "64",
		domain_name: "",
		dhcpv6_server: "Stateful",
		lease_time: "86400",
		server_preference: "255",
		primary_dns: "",
		secondary_dns: "",
		prefix_delegation: "1"

	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'ipv6_address':
					var rege = _sysRege.ipv6addr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'ipv6_prefix_length':
					if (!_sysFunc.isNumberAndBetween(val, 1, 128)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}					
					break;
				case 'lease_time':
					if (!_sysFunc.isNumberAndBetween(val, 0, 604800)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}										var tmpVal = Number(val);
					break;					
				case 'server_preference':
					if (!_sysFunc.isNumberAndBetween(val, 1, 255)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}			
					break;
				case 'primary_dns':
					var rege = _sysRege.ipv6addr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'secondary_dns':
					var rege = _sysRege.ipv6addr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_RADVD_Settings = Backbone.Model.extend({
	url: '/data/radvd_settings.json',
	defaults: {
		"status": "",
		"advertise_mode": "",
		"advertise_interval": "",
		"ra_flag_managed": "",
		"ra_flag_other": "",
		"router_preference": "",
		"mtu": "",
		"router_lifetime": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'advertise_interval':
					if (!_sysFunc.isNumberAndBetween(val, 10, 1800)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}					
					break;
				case 'mtu':
					if (!_sysFunc.isNumberAndBetween(val, 1280, 1500)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}										var tmpVal = Number(val);
					break;					
				case 'router_lifetime':
					if (!_sysFunc.isNumberAndBetween(val, 30, 9000)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}			
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_PMIPv6_Settings = Backbone.Model.extend({
	url: '/data/pmipv6_settings.json',
	defaults: {

		"pmipstatus_pmip": "",
		
		"dhcpserver_server": "", 
		"dhcpserver_starting_ip_address": "", 
		"dhcpserver_ending_ip_address": "", 
		
		"dhcpserver_subnet_mask": "", 
		"dhcpserver_primary_dns": "", 
		
		"pmipv4_tunnel_end_point_ipv4_address": "", 
		
		"pmipv4_tunnel_end_point_port": "", 
		
		"pmipv6_tunnel_end_point_ipv6_address": "", 
		"pmipv6_tunnel_end_point_port": "", 
		"pmipv6_mobile_node_id_imsi": "", 
		
		"pmipv6_apn_configured": "", 
		"pmipv6_dmnp_prefix": "", 
		"pmipv6_dmnp_prefix_length": "", 
		
		"grekey_status": "", 
		"grekey_gre_key": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'dhcpserver_starting_ip_address':
				case 'dhcpserver_ending_ip_address':
				case 'dhcpserver_subnet_mask':
				case 'dhcpserver_primary_dns':
				case 'pmipv4_tunnel_end_point_ipv4_address':
					if (val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_REQUIRED_INPUT' });
					}else{
					  var rege = _sysRege.ipaddr;
					  if(!rege.test(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					  }
					}
					break;
				case 'pmipv6_tunnel_end_point_ipv6_address':
					if (val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_REQUIRED_INPUT' });
					}else{
					  var rege = _sysRege.ipv6addr;
					  if(!rege.test(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					  }
					}
					break;
				case 'pmipv6_apn_configured':
					if (val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_REQUIRED_INPUT' });
					}else{
					  var rege = _sysRege.macaddr;
					  if(!rege.test(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					  }
					}
					break;
				case 'pmipv4_tunnel_end_point_port':
				case 'pmipv6_tunnel_end_point_port':
				case 'pmipv6_dmnp_prefix_length':
					var tmpVal = Number(val);
					if(Number.isNaN(tmpVal)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				
				case 'pmipv6_mobile_node_id_imsi':
				case 'pmipv6_dmnp_prefix':
				case 'grekey_gre_key':
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_Firewall_Settings = Backbone.Model.extend({
	url: '/data/firewall_settings.json',
	defaults: {

		"firewall_status": "",
		
		"dmz_status": "", 
		"dmz_ipaddr_type": "", 
		"dmz_dmz_ipaddr": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'dmz_dmz_ipaddr':
					if (attrs.dmz_status == '1'){
					  if (val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_REQUIRED_INPUT' });
					  }else{
						var rege;
						if (attrs.dmz_ipaddr_type == 'IPv6'){
							rege = _sysRege.ipv6addr;
						}else{
							rege = _sysRege.ipaddr;
						}
						if(!rege.test(val)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
						}
					  }
					}
					break;

				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_Logs_Capture_Packets = Backbone.Model.extend({
	url: '/data/logs_capture_packets.json',
	defaults: {

		"capture_packets_interface": "",		
		"capture_packets_filesize": "",
		"capture_packets_tracking_command": ""

	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_Logs_Capture_Result = Backbone.Model.extend({
	url: '/data/logs_capture_result.json',
	defaults: {

		"capture_result": ""

	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_Log_Actions = Backbone.Model.extend({
	url: '/data/log_actions.json',
	defaults: {
		"log_actions_command": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SOC_Device_Actions = Backbone.Model.extend({
	url: '/data/soc_device_log_actions.json',
	defaults: {
		"soc_device_log_actions": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SOC_HWA_Actions = Backbone.Model.extend({
	url: '/data/soc_hwa_log_actions.json',
	defaults: {
		"soc_hwa_log_actions": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SOC_Logs = Backbone.Model.extend({
	url: '/data/soc_logs.json',
	defaults: {

		"soc_log_status": "",		
		"soc_log_type": "",
		"soc_log_setting": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SOC_Device_Logs = Backbone.Model.extend({
	url: '/data/soc_device_logs.json',
	defaults: {
                  "soc_device_logs_size": "",
                  "soc_device_logs_interface": "",
		  "soc_device_logs_periodic_status": "",
                  "soc_device_logs_periodic": "",
                  "soc_device_logs_repeat_interval": "" ,
                  "soc_device_logs_repeat_count": ""

	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SOC_HWA_Logs = Backbone.Model.extend({
	url: '/data/soc_hw_accelerator_logs.json',
	defaults: {
		"soc_hw_accelerator_logs_size": ""	
	},
});

var m_Logs_Logs = Backbone.Model.extend({
	url: '/data/logs_logs.json',
	defaults: {

		"log_level": "",		
		"log_status": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_LOGS_DNS = Backbone.Model.extend({
	url: '/data/logs_dns.json',
	defaults: {
		dns_name: " "
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'dns_name':
					_this.changed[key] = val; //must save
					if(val === '' || !_sysFunc.urlFormateValidateion(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes.dns_name = '';
			return ret;
		}
	}
});


var m_LOGS_ROUTE = Backbone.Model.extend({
	url: '/data/logs_route.json',
	defaults: {
		ip_type: ""
	},
	validate: function(attrs, options) {
		var _this = this;
		var invalid = false;
		var ret = [];
		_.map(attrs, function (val, key) {
			switch(key){
				case 'ip_type':
					_this.changed[key] = val; //must save
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_VALUE_MUST_BE_PROVIDED' });
					}
					break;
				default:
			}
		});
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_JIO_MAX_LIMIT = Backbone.Model.extend({
	defaults: {
		view: null,
		maxLimit: 0,
		isError: false
	},
	setError: function(isError){
		var _this = this;
		_this.set({"isError": isError});
	}
	
});


var m_ESIM_PROFILE = Backbone.Model.extend({
	url: '/data/settings_esim_profiles_list.json',
	defaults: {
		id: "0",
		"eSIMProfileStatus": "0",
		"eSIMProfileProvider": "",
		"eSIMProfileName": "",
		"eSIMIccid": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'eSIMIccid':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;

				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_MACADRRESS_FILTER = Backbone.Model.extend({
	url: '/data/macaddr_filtering_list.json',
	defaults: {
		id: "0",
		devname: "",
		macaddr: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.attributes, function (val, key) {
			switch(key){
				case 'devname':
					//console.log("validate devname");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'macaddr':
					//console.log("validate macaddr");
					var rege = _sysRege.macaddr;
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_EOGRE_RULE = Backbone.Model.extend({
	url: '/data/eogre_rule_list.json',
	defaults: {
		id: "0",
		enable_button: "",
		tunnel_name: "",
		ip_address_type: "IPv4",
		local_endpoint_ip: "",
		remote_endpoint_ip: "",
		eogre_over_ipsec: "0",
		gre_tunnel_key: "",
		ttl: "",
		maximum_ethernet_mtu: "",
		vlan: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(attrs, function (val, key) {
			switch(key){
				case 'tunnel_name':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'remote_endpoint_ip':
					var rege = _sysRege.ipaddr;
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
					
				case 'gre_tunnel_key':
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 9999999999 || tmpVal < 0 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;
				case 'ttl':
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 255 || tmpVal < 1 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;
				case 'maximum_ethernet_mtu':
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 1500 || tmpVal < 1 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;
				case 'vlan':
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 4093 || tmpVal < 0 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;
				
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_EOGRE_RULE2 = Backbone.Model.extend({
	url: '/data/eogre_rule_list2.json',
	defaults: {
		id: "0",
		enable_button: "",
		tunnel_name: "",
		ip_address_type: "IPv6",
		//local_endpoint_ip: "",
		remote_endpoint_ip: "",
		//eogre_over_ipsec: "0",
		//gre_tunnel_key: "",
		//ttl: "",
		maximum_ethernet_mtu: "1500",
		vlan: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		var _this = this;
		var num_comma_flag = 1;
		_.map(attrs, function (val, key) {
			/* The value of "vlan" has this format: "vlan1,vlan2,vlan3...", but sometimes there's a num_comma as prefix displays as "<num_comma>, <value>" 
			 * So the vlan will also be "1,vlan1,vlan2,vlan3...". Calling the function "remove_num_comma_in_value" can remove the num_comma prefix.
			 * But when the vlan do not have a num_comma, the first vlan will be removed. This place should add a distinguish. 
			 * If the "remote_endpoint_ip"'s first char does not show as "I"(its valus should be select as IPv4 or IPv6), the whole json entry must have num_comma. Then we should remove it.*/
			if(key == 'ip_address_type' && val[0] == 'I'){
				num_comma_flag = 0
			}
			if(num_comma_flag){
				val = _sysFunc.remove_num_comma_in_value(val);
			}
			switch(key){
				case 'tunnel_name':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'remote_endpoint_ip':
					//val = _sysFunc.remove_num_comma_in_value(val);
					var ipaddress_type = _sysFunc.remove_num_comma_in_value(_this.get("ip_address_type"));
					var rege = "";
					switch (ipaddress_type){
						case "IPv4":
							rege = _sysRege.ipaddr;
							break;
						case "IPv6":
							rege = _sysRege.ipv6addr;
							break;						
					}
					
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
					
				/*case 'gre_tunnel_key':
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 9999999999 || tmpVal < 0 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;
				case 'ttl':
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 255 || tmpVal < 1 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;*/
				/*case 'maximum_ethernet_mtu':  // read only
					if(val.indexOf(",") >= 0){
						value = val.split(',');
						val = value[1];
					}
					if (val !== ''){
						var tmpVal = Number(val);
						if(tmpVal > 1500 || tmpVal < 1 || Number.isNaN(tmpVal)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}
					break;*/
				case 'vlan':
					{
						/*if(val.indexOf(",") >= 0){
							value = val.split(',');
							val = value[1];
						}*/
						
						var vlanAry = val.split(',');
						if(vlanAry.length > 8){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_VLAN_MAXIMUM_LIMIT' });
							break;
						}
						for(var i = 0; i < vlanAry.length; i++){
							var one = vlanAry[i];
							if (one === ''){
									invalid = true;
									ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
							}else{
								var tmpVal = Number(one);
								if(tmpVal > 4093 || tmpVal < 0 || Number.isNaN(tmpVal)){
									invalid = true;
									ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
								}
							}
						}

					}
					break;
				
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_EOGRE_RULE_CreateOverIPSec = Backbone.Model.extend({
	url: '/data/eogre_rule_createOverIPSec.json',
	defaults: {
		tunnel_name: "",
		ipsec_connection_name: "IPv4",
		remote_endpoint_ip: "",
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(attrs, function (val, key) {
			switch(key){
	
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_EOGRE_IPSEC_RULE = Backbone.Model.extend({
	url: '/data/eogre_ipsec_rules_list.json',
	defaults: {
		id: "0",
		"connection_name" : "",
		"encapsulation_mode": "",
		"local_endpoint_ip": "",
		"remote_endpoint_ip": "",
		"encryption_algorithm": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_IPSEC_RULE = Backbone.Model.extend({
	url: '/data/ipsec_rule_list.json',
	defaults: {
		id: "0",
		connection_name: "",
		encapsulation_mode: "Tunnel",
		ip_address_type: "IPv4",
		local_endpoint_ip: "",
		local_endpoint_subnet_mask: "",
		remote_endpoint_ip: "",
		remote_endpoint_subnet_mask: "255.255.255.0/24",
		ipv6_prefix: "",
		authentication_method: "PSK",
		psk: "",
		keep_alive: "",
		keep_alive_interval: "",
		ike_version: "",		
		encryption_algorithm: "AES128-SHA256-DH14",
		key_lifetime: "",
		enable_button: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		var _this = this;
		var ipaddress_type = _sysFunc.remove_num_comma_in_value(_this.get("ip_address_type"));

		_.map(attrs, function (val, key) {
			val = _sysFunc.remove_num_comma_in_value(val);
			switch(key){
				case 'connection_name':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'remote_endpoint_ip':
					var rege = "";
					switch (ipaddress_type){
						case "IPv4":
							rege = _sysRege.ipaddr;
							break;
						case "IPv6":
							rege = _sysRege.ipv6addr;
							break;						
						case "IPv4v6":
							rege = _sysRege.ipv4v6addr;
							break;						
					}
					
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'remote_endpoint_subnet_mask':
					var bCheck = false;
					switch (ipaddress_type){
						case "IPv4":
							bCheck = true;
							break;
						case "IPv6":
							break;						
						case "IPv4v6":
							bCheck = true;
							break;
					
					}
					if (bCheck){				
						if(!_sysFunc.isValidSubnetMask(val)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
						}
					}
					break;
					
				case 'ipv6_prefix':
					var bcheck = false;
					switch (ipaddress_type){
						case "IPv4":
							break;
						case "IPv6":
							bcheck = true;
							break;						
						case "IPv4v6":
							bcheck = true;
							break;						
					}
					if (bcheck){					
						if (!_sysFunc.isNumberAndBetween(val, 1, 128)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}		
					}						
					break;
				case 'psk':
					var authentication_method = _sysFunc.remove_num_comma_in_value(_this.get("authentication_method"));
					switch (authentication_method){
						case "PSK":
							if (val.length >= 1 &&  val.length <= 65535){
							}else{
								invalid = true;
								ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
							}
							break;
						default:
					}					
					break;				
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_OPENVPN_RULE = Backbone.Model.extend({
	url: '/data/openvpn_rule_list.json',
	defaults: {
		id: "0",
		protocol: "UDP",
		port: "",
		tunnel_scenario: "TUN (Layer 3)",
		authorization_type: "Static",
		static_key: "",
		ip_address_type: "IPv4",
		local_endpoint_ip: "",
		remote_endpoint_ip: "",
		encryption_algorithm: "AES128-SHA256",
		push_route_option: "",
		remote_netmask: "",
		redirect_default_gateway: "",
		lzo_compression: "",
		persist_key: "",		
		persist_tun: "",
		enable_button: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		var _this = this;
		var ipaddress_type = _sysFunc.remove_num_comma_in_value(_this.get("ip_address_type"));
		
		_.map(attrs, function (val, key) {
			val = _sysFunc.remove_num_comma_in_value(val);
			var ipaddress_type = _sysFunc.remove_num_comma_in_value(_this.get("ip_address_type"));
			switch(key){
				case 'local_endpoint_ip':
					if (val === '') break;
					
					var rege = "";
					switch (ipaddress_type){
						case "IPv4":
							rege = _sysRege.ipaddr;
							break;
						case "IPv6":
							rege = _sysRege.ipv6addr;
							break;						
						case "IPv4v6":
							rege = _sysRege.ipv4v6addr;
							break;						
					}
					
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'remote_endpoint_ip':
					if (val === '') break;
					var rege = "";
					switch (ipaddress_type){
						case "IPv4":
							rege = _sysRege.ipaddr;
							break;
						case "IPv6":
							rege = _sysRege.ipv6addr;
							break;						
						case "IPv4v6":
							rege = _sysRege.ipv4v6addr;
							break;						
					}
					
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'remote_netmask':
					if (val === '') break;
					var bCheck = false;
					switch (ipaddress_type){
						case "IPv4":
							bCheck = true;
							break;
						case "IPv6":
							break;						
						case "IPv4v6":
							bCheck = true;
							break;
					
					}
					if (bCheck){				
						if(!_sysFunc.isValidSubnetMask(val)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
						}
					}
					break;
				case 'port':
					if (!_sysFunc.isNumberAndBetween(val, 1024, 65535)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}					
					break;
			
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_URL_FILTER = Backbone.Model.extend({
	url: '/data/url_filtering_list.json',
	defaults: {
		id: "0",
		url: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.attributes, function (val, key) {
			switch(key){
				case 'url':
					val = _sysFunc.remove_num_comma_in_value(val);
					if(!_sysFunc.urlFormateValidateion(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_IPADDR_FILTER = Backbone.Model.extend({
	url: '/data/ipaddr_filtering_list.json',
	defaults: {
		id: "0",
		ipaddress_type: "IPv4",
		ipaddress: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		var _this = this;

		_.map(_this.attributes, function (val, key) {
			switch(key){
				case 'ipaddress':
					val = _sysFunc.remove_num_comma_in_value(val);
					var ipaddress_type = _sysFunc.remove_num_comma_in_value(_this.get("ipaddress_type"));
					var rege = "";
					switch (ipaddress_type){
						case "IPv4":
							rege = _sysRege.ipaddr;
							break;
						case "IPv6":
							rege = _sysRege.ipv6addr;
							break;						
					}
					
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
					
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_LanIPV6_LEASE_RESERVATION = Backbone.Model.extend({
	url: '/data/lanipv6_lease_reservation_list.json',
	defaults: {
		id: "0",
		"client_host_name" : "",
		"ipv6_address": "",
		"mac_address": "",
		"status": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SMS_SETTINGS = Backbone.Model.extend({
	url: '/data/sms_settings.json',
	defaults: {
		sms_centre_number: "",
		sms_report: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'sms_centre_number':
					//console.log("validate sms_centre_number", val);
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}else if(/^[0-9]+$/.test(val) == false){
						//console.log('nan');
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;

				default:
			}

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_SMS_INBOX = Backbone.Model.extend({
	url: '/data/sms_inbox.json',
	defaults: {
		id: "0",
		name: "",
		number: "",
		date: "",
		message: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'name':
					//console.log("validate name");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'number':
					//console.log("validate number");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'message':
					//console.log("validate message");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SMS_SENT = Backbone.Model.extend({
	url: '/data/sms_sent.json',
	defaults: {
		id: "0",
		name: "",
		number: "",
		date: "",
		not_sent: "",
		message: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'name':
					//console.log("validate name");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'number':
					//console.log("validate number");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'message':
					//console.log("validate message");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SMS_CONTACTS = Backbone.Model.extend({
	url: '/data/sms_contacts.json',
	defaults: {
		id: "0",
		"name": "",
		"number": "",
		"group": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.attributes, function (val, key) {
			switch(key){
				case 'name':
					//console.log("validate name");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'number':
					//console.log("validate number", val);
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}else if(/^[0-9]+$/.test(val) == false){
						//console.log('nan');
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'group':
					//console.log("validate message");
					/*if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}*/
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SMS_CONTACTS_EDIT = m_SMS_CONTACTS.extend({
	url: '/data/sms_contacts_edit.json',
	defaults: {
		id: "0",
		idx: '',
		"name": "",
		"number": "",
		"group": "",
		"new_group": ""
	}
});
var m_SMS_CONTACTS_MOVETOGROUP = Backbone.Model.extend({
	url: '/data/sms_contacts_movetogroup.json',
	defaults: {
		"contact_id": "",
		"contact_idx": "",
		"group": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;

		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SMS_CONTACTS_MOVETOGROUP_EDIT = m_SMS_CONTACTS_MOVETOGROUP.extend({
	defaults: {
		"contact_id": "",
		"contact_idx": "",
		"names": "",
		"present_groups": "",
		"group": ""

	}
});
var m_SMS_GROUPS = Backbone.Model.extend({
	url: '/data/sms_groups.json',
	defaults: {
		id: "0",
		name: "",
		total_contacts: "",
		description: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var value;
		_.map(this.attributes, function (val, key) {
			switch(key){
				case 'name':
					//console.log("validate name");
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'description':
					//console.log("validate message");
					/*if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}*/
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_SMS_GROUPS_EDIT = m_SMS_GROUPS.extend({
	url: '/data/sms_groups_edit.json',
	defaults: {
		id: "0",
		idx: '',
		"name": "",
		"total_contacts": "",
		"description": ""
	}
});
var m_PORTFORWARDING_RULE = Backbone.Model.extend({
	url: '/data/upnp_port_forwarding_rules.json',
	defaults: {
		id: "0",
		"protocol": "",
		"port_type": "",
		"port_begin": "",
		"port_end": "",
		"ip" : "",
		"status" : "",
		"lan_port_begin" : "",
		"description" : "",
		//"interface" : ""
	},
	validate_port: function(val){
					var tmpVal = Number(val);
					if(tmpVal > 65535 || tmpVal < 1 || Number.isNaN(tmpVal)){
						//invalid = true;
						return false;
					}
					return true;
	},
	validate_lan_port: function(val){
					if(val==""){
						return true;
					}
					var tmpVal = Number(val);
					if(tmpVal > 65535 || tmpVal < 1 || Number.isNaN(tmpVal)){
						//invalid = true;
						return false;
					}
					return true;
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		var _this = this;
		var start = 0;

		_.map(_this.attributes, function (val, key) {
		// _.map(this.changed, function (val, key) {
			switch(key){
				case 'port_type':
					if (_this.attributes.port_type == 'val'){
					  if (!_this.validate_port(_this.port_end)){
						invalid = true;
						ret.push({ error: 1, key: "port_end", msg: 'MAIN_MSG_INVALID_RANGE' });
					  }
					}
					break;
				case 'port_begin':
					if (!_this.validate_port(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					start = val;
					break;
				case 'port_end':
					if (_this.attributes.port_type == "range"){
						if (!_this.validate_port(val)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
						if(parseInt(start) != 0 && parseInt(val) <= parseInt(start)){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
						}
					}else if (_this.attributes.port_type == "single"){
						if(parseInt(val) != 0){
							invalid = true;
							ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE_SET0' });
						}
					}
					break;
				case 'ip':
					var rege = _sysRege.ipaddr;
					if(!rege.test(val) || val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;
				case 'lan_port_begin':
					if (!_this.validate_lan_port(val)){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_RANGE' });
					}
					start = val;
					break;
				/*case 'interface':
					if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}
					break;*/
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ALG_SERVICES = Backbone.Model.extend({
	url: '/data/alg_services.json',
	defaults: {
		"sip": "",
		"rtsp": "",
		//"h323": "",
		//"ftp": "",
		//"tftp": "",
		"pptp_pass": "",
		//"l2tp_pass": "",
		"ipsec_pass": ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_FIREWALL_SERVICES = Backbone.Model.extend({
	url: '/data/firewall_services.json',
	defaults: {
		"ddos": "",
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {

		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});

var m_ADMIN_CONNECTION_ADDR_NETWORK_HEALTH_MTR = Backbone.Model.extend({
	url: '/data/adm_connection_addr_network_health_mtr.json',
	defaults: {
		network_health_monitor: "",
		connection_address: ""
	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'connection_address':
					/*if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}*/
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
var m_ADMIN_AUTO_REBOOT_SETTINGS = Backbone.Model.extend({
	url: '/data/adm_auto_reboot_settings.json',
	defaults: {
		auto_reboot_schedule: "",
		auto_reboot_monthly_day: "",
		auto_reboot_weekly_day: "",
		auto_reboot_time: ""

	},
	validate: function(attrs, options) {
		var invalid = false;
		var ret = [];
		_.map(this.changed, function (val, key) {
			switch(key){
				case 'auto_reboot_schedule':
					/*if(val === ''){
						invalid = true;
						ret.push({ error: 1, key: key, msg: 'MAIN_MSG_INVALID_VALUE' });
					}*/
					break;
				default:
			}
		});
		
		if(invalid){
			this.attributes = this._previousAttributes;
			return ret;
		}
	}
});
function obj_add_num_comma_in_attr_values(obj, num){
	Object.entries(obj).forEach(entry => {
		const [key, value] = entry;
		//console.log(key, value);
		obj[key] = num+','+value;
	});		
}
function obj_remove_num_comma_in_attr_values(obj){
	Object.entries(obj).forEach(entry => {
		const [key, value] = entry;
		//console.log(key, value);
		obj[key] = _sysFunc.remove_num_comma_in_value(value);
	});		
}
function display_change_empty_string_to_strikethrough(str){
	return str.length == 0 ? '---' : str;
	
}
