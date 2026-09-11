"use strict";

var upgrade_wait_time=0;
var upgrade_interval=0;
var model_change_status=0;
var login_acs = 0;
var hidden_dhcp = 0;

var _GLOBAL_ = {
	dk: 'dk',
	router: '_routerLink_'
};

var PAGE_UPDATE_PASSWORD = Backbone.View.extend({
	name: "PAGE_UPDATE_PASSWORD_TITLE",
	el: '#app',
	template: "",
	model: null,
	modelPWD: null,
	modelPWDReq: null,
	popup_view: null,
	model_pwd_strength: null,
	strength: 0,

	events: {
		'click .btn_save': 'btn_save',
		'click .JioChkbox_Pwd': 'JioChkbox_Pwd',
		'input .JioInput': 'JioInput'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_USER_LANG();
		_this.modelPWDReq = new m_PWD_REQUIREMENTS();
		_this.modelPWD = new m_UPDATE_PASSWORD();
		_this.model_pwd_strength = new m_PWD_STRENGTH();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'sync', _this._modelSync);
		_this.listenTo(_this.modelPWD, 'sync', _this._modelPWDSync);
		if(_this.template === ""){
			Backbone.$.get('templates/Updatepassword.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.append(_this.template({}));
				transHTMLString(_this.$el);
				
				$(_this.$el).data('view', _this);
				
				_this.$el.find('#app').show();
				_this.model.fetchOLDJSON();
				_this.modelPWDReq.fetchOLDJSON();
			});
		}
		_this.model.fetchOLDJSON();
	},
	_modelSync: function () {
		//console.log('_modelSync');
		var _this = this;
		document.title = _this.model.get('device_type');
	},
	_modelPWDSync: function () {
		//console.log('_modelPWDSync');
		var _this = this;
		var _response = _this.modelPWD._response || null;
		if(_response){
			if(_response === '1'){
				_this.interval = setInterval(function(){
					window.parent.location = '/login.html';
				}, 8000);
			}else if(_response === '10') {
				app._popupViewingClose();
				Backbone.$('.new_pwd, .confirm_new_pwd', _this.$el).closest('.Jioforsize540X68').addClass('JioInputError');
				Backbone.$('.new_pwd, .confirm_new_pwd', _this.$el).addClass('JioErrorLabelVisible');
				Backbone.$('.new_pwd, .confirm_new_pwd', _this.$el).attr('langid', 'MAIN_MSG_PASSWORD_USED_RECENTLY').text(getHTMLString('MAIN_MSG_PASSWORD_USED_RECENTLY'));
				Backbone.$('.btn_save', _this.$el).prop('disabled', true);
			}else if(_response === '2'){
				app._popupViewingClose();
				Backbone.$('.old_pwd', _this.$el).closest('.Jioforsize540X68').addClass('JioInputError');
				Backbone.$('.old_pwd', _this.$el).addClass('JioErrorLabelVisible');
				Backbone.$('.old_pwd', _this.$el).attr('langid', 'MAIN_MSG_INCORRECT_PASSWORD').text(getHTMLString('MAIN_MSG_INCORRECT_PASSWORD'));
				Backbone.$('.btn_save', _this.$el).prop('disabled', true);
			}else{
				app._popupViewingClose();
				Backbone.$('.new_pwd .confirm_new_pwd', _this.$el).closest('.Jioforsize540X68').addClass('JioInputError');
				Backbone.$('.new_pwd .confirm_new_pwd', _this.$el).addClass('JioErrorLabelVisible');
				Backbone.$('.new_pwd .confirm_new_pwd', _this.$el).attr('langid', 'INVALID_SETTINGS').text(getHTMLString('INVALID_SETTINGS'));
				Backbone.$('.btn_save', _this.$el).prop('disabled', true);
			}
		}
	},
	btn_save: function (e) {
		//console.log('btn_save');
		var _this = this;
		e.preventDefault();
		//e.stopPropagation();
		//
		Backbone.$('.old_pwd', _this.$el).closest('.Jioforsize540X68').removeClass('JioInputError');
		Backbone.$('.old_pwd', _this.$el).removeClass('JioErrorLabelVisible');
		Backbone.$('.new_pwd', _this.$el).closest('.Jioforsize540X68').removeClass('JioInputError');
		Backbone.$('.new_pwd', _this.$el).removeClass('JioErrorLabelVisible');
		Backbone.$('.confirm_new_pwd', _this.$el).closest('.Jioforsize540X68').removeClass('JioInputError');
		Backbone.$('.confirm_new_pwd', _this.$el).removeClass('JioErrorLabelVisible');
		//

		_this.stopListening(_this.modelPWD, 'sync', _this._modelPWDSync);
		_this.modelPWD = new m_UPDATE_PASSWORD();
		_this.listenTo(_this.modelPWD, 'sync', _this._modelPWDSync);

		var res = _this.modelPWD.set({
			pwd_forbidden: _this.modelPWDReq.get('pwd_forbidden')
		});
		var res = _this.modelPWD.set({
			old_pwd: btoa(Backbone.$('#old_password_text', _this.$el).val()),
			new_pwd: btoa(Backbone.$('#new_password_text', _this.$el).val()),
			confirm_new_pwd: btoa(Backbone.$('#cfm_password_text', _this.$el).val())
		});
		if(res.isValid()){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_UPDATING_PASSWORD') });//Updating password, please wait.
			res.savePOST(false);
		}else{
			_.map(res.validationError, function(val){
				Backbone.$('.'+val.key, _this.$el).closest('.Jioforsize540X68').addClass('JioInputError');
				Backbone.$('.'+val.key, _this.$el).addClass('JioErrorLabelVisible');
				Backbone.$('.'+val.key, _this.$el).attr('langid', val.msg).text(getHTMLString(val.msg));
			});
			Backbone.$('.btn_save', _this.$el).prop('disabled', true);
		}
	},
	JioInput: function(e) {
		//console.log('JioInput');
		var _this = this;
		e.preventDefault();
		//e.stopPropagation();
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
		
		_this.update_pwd_strength();
	},
	update_pwd_strength: function(){
		var _this_backboneView = this;

		  var new_pwd = Backbone.$('#new_password_text', _this_backboneView.$el).val();
		  var cur_strength = _this_backboneView.model_pwd_strength.calculate_pwd_strength(new_pwd);
		  
		  if(_this_backboneView.strength != cur_strength){
			Backbone.$('.passwordStrength', _this_backboneView.$el)
				.removeClass('strength0 strength1 strength2 strength3 strength4 strength5')
				.addClass('strength'+cur_strength);
			var id_strength = 'MAIN_PWD_STRENGTH_'+cur_strength;
			Backbone.$('.passwordStrength', _this_backboneView.$el).text(getHTMLString(id_strength));
		  	_this_backboneView.strength = cur_strength;
		  }
	  
	},
	JioChkbox_Pwd: function (e) {
		//console.log('JioChkbox_Pwd');
		//e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget);
		var password_input = obj.prev().prev().get(0);
		password_input.type = password_input.type === 'text' ? 'password' : 'text';
	},
	_popupViewing: function (view){
		//console.log('_popupViewing');
		var _this = this;
		Backbone.$('.jioModalWindow_row', _this.$el).html('<div class="jiomodalBoxContainer"></div>');
		if (_this.popup_view !== null) {
			_this.popup_view._sClose();
		}
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: grid;');
		_this.popup_view = new view({ el: '.jiomodalBoxContainer' });
	},
	_popupViewingClose: function (){
		//console.log('_popupViewingClose');
		var _this = this;
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: none;');
		_this.popup_view._sClose();
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_LOGIN = Backbone.View.extend({
	name: "PAGE_LOGIN_TITLE",
	el: '#app',
	template: "",
	model: null,
	mLogin: null,
	view: null,
	router_view: null,
	popup_view: null,
	KEY_OF_STORED_LOGIN_NAME: "wdFGHJKLKIGB_LoginName",
	KEY_OF_STORED_LOGIN_PWD:   "wdFGHJKLKIGB_LoginPWD",
	events: {
		"click #BTN_Login": "_sysLogin",
		"keyup": "_sysKeyup",
		"input #username_text": "_sysKeyup",
		"input #password_text": "_sysKeyup",
		"focus #password_text": "_password_focus",
		"click #show_login_pwd": "_show_login_pwd"
	},
	preinitialize: function () {
		//console.log('PAGE_LOGIN preinitialize');
		var _this = this;
		_this.model = new SYS_USER_LANG();
		_this.mLogin = new SYS_LOGIN();
		window.sessionStorage.removeItem(_GLOBAL_.dk);
	},
	initialize: function () {
		//console.log('PAGE_LOGIN initialize');
		var _this = this;
		_this.listenTo(_this.model, 'sync', _this._modelSync);
		_this.listenTo(_this.mLogin, 'sync', _this._mLoginSync);
		_this.model.fetchOLDJSON();
	},
	_modelSync: function (e) {
		//console.log('_modelSync');
		var _this = this;
		if(_this.template === ""){
			document.title = _this.model.get('device_type');
			Backbone.$.get('templates/login.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				var templateAttrs = _this.model.attributes;
				templateAttrs['isLoginDataAvailable'] = _this.isLoginDataAvailable();
				_this.$el.append(_this.template(templateAttrs));
				transHTMLString(_this.$el);
				_this.$el.find('#app').show();
			});
		}
	},
	_mLoginSync: function () {
		//console.log('_mLoginSync');
		var _this = this;
		var _response = _this.mLogin._response || null;
		var login_page = 1;
		if(_response){
			_this._popupViewingClose();
			if(_response === '1'){
				if (_this.model.get('default_login')  == "0"){
					if (_this.mLogin.get('remember_pwd')  == "1"){
						// need to save cookie 
						_this.saveLoginData();
					}else{
						// need to clear cookie 
						_this.clearLoginData();
					}					
					window.parent.location = 'pages.html';
				}
			}else if(_response === '3'){
				_this.router_view = this;
				_this._popupViewing(POPUP_CONFIRM_TEMPLATE);
				_this.popup_view.model.set({
					id: 1000,
					title: getHTMLString('POPUP_INVALID_CREDENTIALS'), //Invalid Credentials!
					info: '',
					warn: getHTMLString('POPUP_USERNAME_PASSWORD_INCORRECT'), //The username or password is incorrect.<br>Try again with correct username and password
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});
			}else if(_response === '7'){
				window.parent.location = 'pages.html';
			}else if(_response === '8'){
				window.parent.location = 'updatepassword.html';
			}else{
				//_this._mLoginSyncError([{ key: "LoginPWD" }]);
				_this.router_view = this;
				_this._popupViewing(POPUP_CONFIRM_TEMPLATE);
				_this.popup_view.model.set({
					id: 1000,
					title: getHTMLString('POPUP_INVALID_CREDENTIALS'), //Invalid Credentials!
					info: '',
					warn: getHTMLString('POPUP_USERNAME_PASSWORD_INCORRECT'), //The username or password is incorrect.<br>Try again with correct username and password
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});
			}
		}
		_this.mLogin = new SYS_LOGIN();
		_this.listenTo(_this.mLogin, 'sync', _this._mLoginSync);
	},
	_mLoginSyncError: function (validationError) {
		//console.log('_mLoginSyncError');
		//console.log(validationError);
		var _this = this;
		Backbone.$('#JioUser', _this.$el).removeClass('JioInputError');
		Backbone.$('#JioPassword', _this.$el).removeClass('JioInputError');
		Backbone.$('#login_username_error', _this.$el).attr('style', 'visibility: hidden');
		Backbone.$('#login_password_error', _this.$el).attr('style', 'visibility: hidden');
		_.map(validationError, function(val){
			//console.log(val.key);
			Backbone.$('#BTN_Login', _this.$el).attr('disabled', true);
			switch(val.key){
				case 'LoginName':
					Backbone.$('#JioUser', _this.$el).addClass('JioInputError');
					Backbone.$('#login_username_error', _this.$el).attr('style', 'visibility: visible');
					break;
				case 'LoginPWD':
					Backbone.$('#JioPassword', _this.$el).addClass('JioInputError');
					Backbone.$('#login_password_error', _this.$el).attr('style', 'visibility: visible');
					break;
				default:
			}
		});
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	clearLoginData: function(){
		var _this = this;
		//_this.setCookie('LoginName', _this.mLogin.get('LoginName'), -1);
		//_this.setCookie('LoginPWD', _this.mLogin.get('LoginPWD'), -1);
		_this.clearStoredLoginData(_this.KEY_OF_STORED_LOGIN_NAME);
		_this.clearStoredLoginData(_this.KEY_OF_STORED_LOGIN_PWD);
	},
	saveLoginData: function(){
		var _this = this;
		//_this.setCookie('LoginName', _this.mLogin.get('LoginName'), 366);
		//_this.setCookie('LoginPWD', _this.mLogin.get('LoginPWD'), 366);
		_this.setStoredLoginData(_this.KEY_OF_STORED_LOGIN_NAME, _this.mLogin.get('LoginName'));
		//LoginPWD now is encrypted, should remember password before encrypted
		_this.setStoredLoginData(_this.KEY_OF_STORED_LOGIN_PWD, Backbone.$('#password_text', _this.$el).val());
				
	},
	isLoginDataAvailable: function(){
		var _this = this;
		//return ((_this.getCookie('LoginName').length > 0) && (_this.getCookie('LoginPWD').length > 0));
		return (_this.getStoredLoginData(_this.KEY_OF_STORED_LOGIN_NAME) && _this.getStoredLoginData(_this.KEY_OF_STORED_LOGIN_PWD)) 
			? ((_this.getStoredLoginData(_this.KEY_OF_STORED_LOGIN_NAME).length > 0) && (_this.getStoredLoginData(_this.KEY_OF_STORED_LOGIN_PWD).length > 0)) : false;
	},
	getStoredLoginData: function(key){
		return window.localStorage.getItem(key);
	},
	setStoredLoginData: function(key, value){
		window.localStorage.setItem(key, value);
	},
	clearStoredLoginData: function(key){
		window.localStorage.removeItem(key);
	},
	setCookie: function(cname, cvalue, exdays) {
		const d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	},
	getCookie: function(cname) {
	  var name = cname + "=";
	  var decodedCookie = decodeURIComponent(document.cookie);
	  var ca = decodedCookie.split(';');
	  var i;
	  for(i = 0; i <ca.length; i++) {
	    var c = ca[i];
	    while (c.charAt(0) == ' ') {
	      c = c.substring(1);
	    }
	    if (c.indexOf(name) == 0) {
	      return c.substring(name.length, c.length);
	    }
	  }
	  return "";
	},
	_password_focus: function (e){
		//console.log('_password_focus');
		var _this = this;
		if (Backbone.$('#remember_pwd', _this.$el).prop('checked')){
			// check login data
			//var name_store = _this.getCookie('LoginName');
			//var pwd_store = _this.getCookie('LoginPWD');
			var name_store = _this.getStoredLoginData(_this.KEY_OF_STORED_LOGIN_NAME);
			var pwd_store = _this.getStoredLoginData(_this.KEY_OF_STORED_LOGIN_PWD);
			
			var username = Backbone.$('#username_text', _this.$el).val();
			if (name_store && (name_store.length > 0) && (name_store == username) && pwd_store && (pwd_store .length > 0)){
					Backbone.$('#password_text', _this.$el).val(pwd_store);			
					Backbone.$('#password_text', _this.$el).trigger('keyup');
			}			
		}
	},
	_sysLogin: function (e) {
		//console.log('_sysLogin');
		e.preventDefault();
		var _this = this;
		var username = Backbone.$('#username_text', _this.$el).val();
		var password = Backbone.$('#password_text', _this.$el).val();
		var salt = _this.model.get('salt');
		var passwordSalt = sjcl.codec.hex.toBits(salt);
		var derivedKey = sjcl.misc.pbkdf2(password, passwordSalt, 1000, 128);
		var dk_hex = sjcl.codec.hex.fromBits(derivedKey);
		var hash1_pass = hex_hmac_sha256('$1$SERCOMM$', unescape(encodeURIComponent(password)));
		var encryption_key = _this.model.get('encryption_key');
		var user_password = hex_hmac_sha256(encryption_key, hash1_pass);
		
		if (_this.model.get('default_login')  == "0"){
			var remember_pwd = Backbone.$('#remember_pwd', _this.$el).prop('checked') ? '1' : '0';
			var res = _this.mLogin.set({LoginName:username, LoginPWD:btoa(user_password), remember_pwd:remember_pwd});
		}else{
			var res = _this.mLogin.set({LoginName:username, LoginPWD:btoa(user_password)});
		}
		if(res.isValid()){
			_this._popupViewing(POPUP_LOADING);
			_this.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_AUTHENTICATING') }); //Authenticating, please wait.
			window.sessionStorage.setItem(_GLOBAL_.dk, dk_hex);
			res.savePOST(false);
		}else{
			console.error(res.validationError);
		}
	},
	_sysKeyup: function (e) {
		//console.log('_sysKeyup');
		e.preventDefault();
		var code = e.keyCode || e.which;
		var _this = this;
		var checking = new SYS_LOGIN();
		var username = Backbone.$('#username_text', _this.$el).val();
		var password = Backbone.$('#password_text', _this.$el).val();
		var res = checking.set({LoginName:username, LoginPWD:password});
		if(res.isValid() && username.length > 0 && password.length > 0){
			_this._mLoginSyncError([]);
			Backbone.$('#BTN_Login', _this.$el).removeAttr('disabled');
			if(code == 13) {
				_this._sysLogin(e);
			}
		}else{
			//console.log(res.validationError);
			_this._mLoginSyncError(res.validationError);
			Backbone.$('#BTN_Login', _this.$el).attr('disabled', true);
		}
		//console.log(checking.attributes);
	},
	_show_login_pwd: function (e) {
		//console.log('_show_login_pwd');
		//e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		var obj = Backbone.$('#show_login_pwd', _this.$el).prop('checked');
		var password_input = document.getElementById("password_text");
		if(obj){
			password_input.type = "text";
		}else{
			password_input.type = "password";
		}
	},
	_popupViewing: function (view){
		//console.log('_popupViewing');
		var _this = this;
		Backbone.$('.jioModalWindow_row', _this.$el).html('<div class="jiomodalBoxContainer"></div>');
		if (_this.popup_view !== null) {
			_this.popup_view._sClose();
		}
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: grid;');
		_this.popup_view = new view({ el: '.jiomodalBoxContainer' });
	},
	_popupViewingClose: function (){
		//console.log('_popupViewingClose');
		var _this = this;
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: none;');
		_this.popup_view._sClose();
	},
	_sysLangChanged: function() {
		console.log('_sysLangChanged');
		var _this = this;
		_this.model.set("lang_code", (_this.model.get("lang_code") === "en") ? "cn" : "en");
		_this.model.save();
		transHTMLString(_this.$el);
	},
	render: function () {
		//console.log('PAGE_LOGIN render');
	}
});

var PAGE_MAIN = Backbone.View.extend({
	name: "PAGE_MAIN_TITLE",
	el: '#app',
	template: "",
	model: null,
	mLogin: null,
	mReset: null,
	app_router: null,
	router_view: null,
	popup_view: null,
	navigation_view: null,
	main_popup_view: null,
	main_btn_click: false,
	sysInterval: null,
	sysCount: 1,
	events: {
		"click .jioCommonGrid": "_hideMainPopup",
		"focusout .menuSearchInput": "_hideMainPopup",
		"focus .menuSearchInput": "_searchInput",
		"keyup .menuSearchInput": "_searchInput",
		"click .jioUserIcon": "_jioUserIcon",
		"click .jioIconBurgermenu": "_jioIconBurgermenu",
		"click .jioIconUserWhite": "_jioIconUserWhite",
		"click .jioIconSearchWhite": "_jioIconSearchWhite"
	},
	preinitialize: function () {
		//console.log('PAGE_MAIN preinitialize');
		var _this = this;
		_this.mReset = new SYS_RESET();
		_this.mLogin = new SYS_LOGIN();
		_this.model = new SYS_USER_DATA();
		_this.app_router = _all_routes_link();

		Backbone.$.get('templates/modules.html?_='+new Date().getTime(), function (data) {
			Backbone.$('body').append(data);
		});
	},
	initialize: function () {
		//console.log('PAGE_MAIN initialize');
		var _this = this;
		_this.$el.on("click", function(e){ _this._sysWindowEvent(e, _this) });
		var dk = window.sessionStorage.getItem(_GLOBAL_.dk);
		if(!dk){
			_this._sysLogout();
		}else{
			_this.listenTo(_this.mReset, 'sync', _this._mResetSync);
			_this.listenTo(_this.mLogin, 'sync', _this._mLoginSync);
			//
			_this.listenTo(_this.model, 'sync', _this._modelSync);
			//if the data after the "#" in the address bar is modified, this method will be triggered
			window.onhashchange = function() {
				var newHash = window.location.hash;
				if(newHash === "#TechHd"){
					location.reload();
				}
			};
			_this.model.fetchOLDJSON();
		}
	},
	_resetInterval: function () {
		//console.log("_resetInterval");
		var _this = this;
		_this.mReset.set({ chk_sys_busy: _this.model.get('usermode') });
		_this.mReset.savePOST(false);
		_this.mLogin.set({ loginUserChkLoginTimeout: '1' });
		_this.mLogin.savePOST(false);
		//
		if(_this.sysInterval !== null){
			clearInterval(_this.sysInterval);
			_this.sysInterval = null;
			_this.sysCount = 1;
		}
		//_this.sysInterval = setInterval(function(){ _this._checkingInterval(_this); }, 15000);
	},
	_checkingInterval: function (_this) {
		//console.log("_checkingInterval");
		//console.log(_this.sysCount);
		if(_this.sysCount%1 === 0){ //reset.json
			_this.mReset.set({ chk_sys_busy: _this.model.get('usermode') });
			_this.mReset.savePOST(false);
		}
		if(_this.sysCount%2 === 0){ //login.json
			_this.sysCount = 1;
			_this.mLogin.set({ loginUserChkLoginTimeout: '1' });
			_this.mLogin.savePOST(false);
		}else{
			_this.sysCount++;
		}
	},
	_modelSync: function () {
		//console.log("_modelSync");
		var _this = this;
		Backbone.$.get('templates/main.html?_='+new Date().getTime(), function (data) {
			_this.template = _.template(data);
			_this.$el.html(_this.template(_this.model.attributes));
			Backbone.$('.menuSearchInput', _this.$el).attr('placeholder', getHTMLString('MAIN_SEARCH_INPUT'));
			transHTMLString(_this.$el);
			//_this.$el.find('#app').show();
			//router
			var level = _this._getUserlevel();
			var lan_mode = _this._getLanMode();
			if(lan_mode === "Bridge" || lan_mode === "EoGRE"){
				hidden_dhcp = 1;
			}
			_this.app_router = _this._routesFilter(_this.app_router, level, lan_mode);
			var mainRouter = _this.app_router[0].children;
			_this._routesStart({ router: mainRouter });
			//router end
			//menu
			_this.navigation_view = new PAGE_MAIN_NAVIGATION();
			_this.navigation_view.model.set(_this.model.attributes);
			_this._menuChanged();
			//menu end
			//jioMenuPopupSection
			_this.main_popup_view = new PAGE_MAIN_POPUP_SECTION();
			_this.main_popup_view.model.set(_this.model.attributes);
			//jioMenuPopupSection end
		});
	},
	_mResetSync: function () {
		//console.log('_mResetSync');
		var _this = this;
		var _response = _this.mReset._response || null;
		if(_response === '1'){
			window.parent.location = 'fw_upgrade_progress.html';
		}
		_this.mReset = new SYS_RESET();
		_this.listenTo(_this.mReset, 'sync', _this._mResetSync);
	},
	_mLoginSync: function () {
		//console.log('_mLoginSync');
		var _this = this;
		var loginUserChkLoginTimeout = _this.mLogin.get('loginUserChkLoginTimeout');
		var _response = _this.mLogin._response || null;
		if(loginUserChkLoginTimeout === '1' && _response !== '0'){
			_this._sysLogout();	//logout
		}
		_this.mLogin = new SYS_LOGIN();
		_this.listenTo(_this.mLogin, 'sync', _this._mLoginSync);
	},
	_getUserlevel: function () {
		//console.log('_getUserlevel');
		return (app.model.get('usermode') === 'admin') ? 1 : (app.model.get('usermode') === 'expert') ? 2 : 3;
	},
	_getLanMode: function () {
		return app.model.get('lan_mode');
	},
	_routesFilter: function (table, level, mode) {
		//console.log('_routesFilter');
		var _this = this;
		var ret_table = [];
		_.map(table, function (val) {
			if(val.meta.requiresAuthLevel.indexOf(level) !== -1){
				if(mode === "Bridge"){
					if(val.name === "jioAlgSettings" || 
					   val.name === "jioLanIPv6Settings" ||
					   val.name === "jioPmipV6Settings" ||
					   val.name === "jioFirewallSettings" ||
					   val.name === "jioEogreSettings" ||
					   val.name === "jioIpAdressFilter" ||
					   val.name === "jioUrlFilter" ||
					   val.name === "jioMacAddressFilter" ||
					   val.name === "jioUpnpPortForwading" ||
					   val.name === "jioDhcpServerSettings"){
						ret_table[ret_table.length-1].children = _this._routesFilter(val.children, level, mode);
					}else{
						ret_table.push(val);
						ret_table[ret_table.length-1].children = _this._routesFilter(val.children, level, mode);
                        }
				}else if(mode === "Router"){
                    if(val.name === "jioEogreSettings"){
                        ret_table[ret_table.length-1].children = _this._routesFilter(val.children, level, mode);
                    }else{
						ret_table.push(val);
						ret_table[ret_table.length-1].children = _this._routesFilter(val.children, level, mode);
                    }
				}else{
                    if(val.name === "jioAlgSettings" || 
					   val.name === "jioLanIPv6Settings" ||
					   val.name === "jioPmipV6Settings" ||
					   val.name === "jioFirewallSettings" ||
					   val.name === "jioIpAdressFilter" ||
					   val.name === "jioUrlFilter" ||
					   val.name === "jioMacAddressFilter" ||
					   val.name === "jioUpnpPortForwading" ||
					   val.name === "jioDhcpServerSettings"){
						ret_table[ret_table.length-1].children = _this._routesFilter(val.children, level, mode);
					}else{
					    ret_table.push(val);
					    ret_table[ret_table.length-1].children = _this._routesFilter(val.children, level, mode);
                    }
				}
			}
		});
		return ret_table;
	},
	_routesFilterHide: function (table) {
		//console.log('_routesFilterHide');
		var _this = this;
		var ret_table = [];
		_.map(table, function (val) {
			if(val.hide === false){
				ret_table.push(val);
				ret_table[ret_table.length-1].children = _this._routesFilterHide(val.children);
			}
		});
		return ret_table;
	},
	_routesStart: function (options) {
		//console.log('_routesStart');
		var _this = this;
		if(window.sessionStorage){
			var link = window.location.hash === '' ? window.sessionStorage.getItem(_GLOBAL_.router) : window.location.hash.replace('#', '');
			var search = _this._routesSearch(options.router, link);
			if(search){
				_this._routesViewing(search.view);
			}else{
				window.location.hash = '';
				window.sessionStorage.setItem(_GLOBAL_.router, options.router[0].children[0].path);
				_this._routesViewing(options.router[0].children[0].view);
			}
		}else{
			return false;
		}
	},
	_routesSearch: function (table, path) {
		//console.log('_routesSearch');
		var _this = this;
		var ret = null;
		_.map(table, function (val) {
			if(ret === null){
				if (val.path === path) {
					ret = val;
				}
				if(ret === null){
					ret = _this._routesSearch(val.children, path);
				}
			}
		});
		return ret;
	},
	_routesViewing: function (view){
		//console.log('_routesViewing');
		var _this = this;
		Backbone.$('.jioHeader').after('<div class="jioMainContent"></div>');
		if (_this.router_view !== null) {
			_this.router_view._sClose();
		}
		_this._resetInterval();
		var device_name = _this.model.get('device_name');
		var title = getHTMLString(view.prototype.name);
		document.title = device_name+" | "+title;
		Backbone.$('#jioPageHeading', _this.$el).text(title);
		_this.router_view = new view({ el: '.jioMainContent' });
	},
	_routesSelect: function (path) {
		//console.log('_routesSelect');
		var _this = this;
		var mainRouter = _this._routesFilterHide(_this.app_router[0].children);
		window.sessionStorage.setItem(_GLOBAL_.router, path);
		if(window.location.hash !== ''){
			window.location.hash = '';
		}
		_this._routesStart({ router: mainRouter });
		_this._menuChanged();
		//_this._jioIconBurgermenu();
		Backbone.$('.jioMenuSection', _this.$el).removeClass('jioShowGrid');
		Backbone.$('.jioMenuSearchContainer', _this.$el).removeAttr('style');
	},
	_menuChanged: function () {
		//console.log('_menuChanged');
		var _this = this;
		var mainRouter = _this._routesFilterHide(_this.app_router[0].children);
		var link = window.location.hash === '' ? window.sessionStorage.getItem(_GLOBAL_.router) : window.location.hash.replace('#', '');
		var dropdown = _this._menuParentGet(mainRouter, link);
		_this.navigation_view.model.set({ path: link, dropdown: dropdown, menu: mainRouter });
	},
	_menuParentGet: function (table, link) {
		//console.log('_menuParentGet');
		var retStr = "";
		_.map(table, function (val) {
			_.map(val.children, function (v) {
				if(link == v.path){
					retStr = val.name;
				}
			});
		});
		return retStr;
	},
	_dropdownChanged: function (value) {
		//console.log('_dropdownChanged')
		var _this = this;
		var dropdown = _this.navigation_view.model.get('dropdown');
		if(dropdown === value){
			var mainRouter = _this._routesFilterHide(_this.app_router[0].children);
			var link = window.location.hash === '' ? window.sessionStorage.getItem(_GLOBAL_.router) : window.location.hash.replace('#', '');
			_this.navigation_view.model.set({ dropdown: _this._menuParentGet(mainRouter, link) });
		}else{
			_this.navigation_view.model.set({ dropdown: value });
		}
	},
	_popupViewing: function (view, options){
		//console.log('_popupViewing');
		var _this = this;
		Backbone.$('.jioModalWindow_row', _this.$el).html('<div class="jiomodalBoxContainer"></div>');
		if (_this.popup_view !== null) {
			_this.popup_view._sClose();
		}
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: grid;');
		if (options){
			let joins = {
				...{ el: '.jiomodalBoxContainer' },
				...options
			};
			_this.popup_view = new view(joins);
		}else{
			_this.popup_view = new view({ el: '.jiomodalBoxContainer' });
		}
	},
	_popupViewingClose: function (){
		//console.log('_popupViewingClose');
		var _this = this;
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: none;');
		_this.popup_view._sClose();
	},
	_hideMainPopup: function() {
		//console.log('_hideMainPopup');
		var _this = this;
		if(_this.main_btn_click) {
			_this.main_btn_click = !_this.main_btn_click;
		}else{
			_this.main_popup_view.model.set({ userPopup: false, menuSearchPopup: false, menuSerachRes: [] });
			Backbone.$('.menuSearchInput', _this.$el).val('');
			Backbone.$('.jioMenuSearchContainer', _this.$el).removeAttr('style');
		}
	},
	_jioUserIcon: function() {
		//console.log('_jioUserIcon');
		var _this = this;
		var popup1 = document.getElementById("user_icon_white").children;
		var popup2 = document.getElementById("user_icon").children;
		_this.main_btn_click = true;
		_this.main_popup_view.model.set({ userPopup: true, menuSearchPopup: false, menuSerachRes: [] });
		popup1[1].style.visibility='hidden';
		popup2[1].style.visibility='visible';
	},
	_jioIconBurgermenu: function() {
		//console.log('_jioIconBurgermenu');
		var _this = this;
		var obj = Backbone.$('.jioMenuSection', _this.$el);
		obj.toggleClass('jioShowGrid');
	},
	_jioIconUserWhite: function() {
		//console.log('_jioIconUserWhite');
		var _this = this;
		var popup1 = document.getElementById("user_icon_white").children;
		var popup2 = document.getElementById("user_icon").children;
		_this.main_btn_click = true;
		_this.main_popup_view.model.set({ userPopup: true, menuSearchPopup: false, menuSerachRes: [] });
		popup1[1].style.visibility='visible';
		popup2[1].style.visibility='hidden';
		//app._sysLogout();
	},
	_jioIconSearchWhite: function() {
		//console.log('_jioIconSearchWhite');
		var _this = this;
		Backbone.$('.jioMenuSearchContainer', _this.$el).css({ 'display':'grid' });
		Backbone.$('.menuSearchInput', _this.$el).trigger('focus');
	},
	_searchInput: function() {
		//console.log('_searchInput');
		var _this = this;
		var tmpInput = Backbone.$('.menuSearchInput:visible', _this.$el).val();
		_this.main_btn_click = true;
		if(tmpInput.length < 2){
			_this.main_popup_view.model.set({ 
				userPopup: false, 
				menuSearchPopup: false
			});
		}else{
			var searchArr = _this._searchInputStr(tmpInput);
			var retArr = [];
			_.map(searchArr, function(v){
				retArr.push({ class: "link "+v.path, name: getHTMLString(v.view.prototype.name) });
			});
			if(retArr.length === 0){
				retArr.push({class: "", name: getHTMLString('MAIN_NO_RESULTS_FOUND_FOR_S').replace('%s', tmpInput) });
			}
			_this.main_popup_view.model.set({ 
				userPopup: false, 
				menuSearchPopup: true, 
				menuSerachRes: retArr 
			});
		}
	},
	_searchInputStr: function(str) {
		//console.log('_searchInputStr');
		var _this = this;
		var ret_table = [];
		var mainRouter = _this._routesFilterHide(_this.app_router[0].children);
		_.map(mainRouter, function(val){
			_.map(val.children, function(v){
				if(getHTMLString(v.view.prototype.name).toLowerCase().indexOf(str.toLowerCase()) !== -1){
					//console.log(getHTMLString(v.view.prototype.name));
					ret_table.push(v);
				}
			});
		});
		return ret_table;
	},
	_sysLogout: function () {
		//console.log('_sysLogout');
		var _this = this;
		var res = _this.mLogin.set({ logout:'1' });
		if(res.isValid()){
			res.savePOST(false);
			window.sessionStorage.removeItem(_GLOBAL_.dk);
			window.sessionStorage.removeItem(_GLOBAL_.router);
			setTimeout(function () {
				window.parent.location = 'login.html';
			},500);
		}else{
			console.log(res.validationError);
		}
	},
	_sysLangChanged: function() {
		console.log('_sysLangChanged');
		var _this = this;
		_this.model.set("lang_code", (_this.model.get("lang_code") === "en") ? "cn" : "en");
		_this.model.save();
		transHTMLString(_this.$el);
	},
	_sysWindowEvent: function(e, t) {
		//console.log("_sysWindowEvent");
		//e.preventDefault();
		//e.stopPropagation();
		var _this = t;
		_this._sEvent({ element: e, source: _this });
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		clearInterval(_this.sysInterval);
		_this.sysInterval = null;
		
		_this.$el.off("click");
	},
	render: function () {
		//console.log('PAGE_MAIN render');
	}
});

//jioMenuPopupSection
var PAGE_MAIN_POPUP_SECTION = Backbone.View.extend({
	name: "PAGE_MAIN_POPUP_SECTION_TITLE",
	el: ".jioMenuPopupSection",
	template: "",
	model: null,
	events: {
		"click .btn_dLUsersGuide": "_btn_dLUsersGuide",
		"click .btn_accountManagement": "_btn_accountManagement",
		"click .btn_userLogout": "_btn_userLogout",
		"click #menuSerachRes .link": "_menuSerachRes"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_MAIN_POPUP_SECTION();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.render);
		if(_this.template === ""){
			Backbone.$.get('templates/jioMenuPopupSection.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.render();
			});
		}
	},
	_nameStr: function () {
		//console.log("_nameStr");
		var _this = this;
		var _thisModel = _this.model.attributes;
		var tmpName = '';
		if(_thisModel.usermode === 'admin'){
			tmpName = getHTMLString('MAIN_ADMIN');
		}else{
			tmpName = getHTMLString('MAIN_USER');
		}
		return tmpName;
	},
	_btn_dLUsersGuide: function() {
		//console.log("_btn_dLUsersGuide");
		window.parent.location = 'users_guide.zip';
	},
	_btn_accountManagement: function() {
		//console.log("_btn_accountManagement");
		app._routesSelect('jioUsermanagement');
	},
	_btn_userLogout: function() {
		//console.log("_btn_userLogout");
		app._sysLogout();
	},
	_menuSerachRes: function(e) {
		//console.log("_menuSerachRes");
		var link = e.currentTarget.className.replace('link', '').trim();
		app._routesSelect(link);
	},
	render: function() {
		//console.log("MenuPopupSection render");
		var _this = this;
		if(_this.template !== ""){
			//console.log(_this.model.attributes);
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			//_this.$el.show();
		}
	}
});
//jioMenuPopupSection end

//menu
var PAGE_MAIN_NAVIGATION = Backbone.View.extend({
	name: "PAGE_MAIN_NAVIGATION_TITLE",
	el: "#MenuContainer",
	template: "",
	model: null,
	events: {
		"click .jioIconMenuClose": "_jioIconMenuClose"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_MAIN_NAVIGATION_MENU();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on("mouseleave", _this._mouseleaveEvent);
		_this.listenTo(_this.model, 'change', _this.render);
		if(_this.template === ""){
			Backbone.$.get('templates/navigation.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.render();
			});
		}
	},
	_mouseleaveEvent: function () {
		//console.log("_mouseleaveEvent");
		var dropdown = app.navigation_view.model.get('dropdown');
		app._dropdownChanged(dropdown);
	},
	_jioIconMenuClose: function(e) {
		//console.log("_jioIconMenuClose");
		app._jioIconBurgermenu();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("mouseleave");
	},
	render: function() {
		//console.log("PAGE_MAIN_NAVIGATION render");
		var _this = this;
		if(_this.template !== ""){
			//console.log(_this.model.attributes);
			if(_this.model.get('dropdown') === ''){
				//_this.model.set({ dropdown:'status' });
			}
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			//_this.$el.show();
		}
	}
});
//menu end

//templates
var TEMP_JIO1SECTION_NOINPUT = Backbone.View.extend({
	name: "TEMP_JIO1SECTION_NOINPUT",
	template: "",
	model: null,
	events: {
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_TEMP_JIO1SECTION_NOINPUT();
		_this.template = _.template(Backbone.$("#temp_jio1SectionNoInput").html());
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.render);
		//_this.render();
		//_this.$el.show();
	},
	render: function() {
		var _this = this;
		_this.$el.html(_this.template(_this.model.attributes));
		transHTMLString(_this.$el);
	}
});

var TEMP_JIO1SECTION_WITHINPUT = Backbone.View.extend({
	name: "TEMP_JIO1SECTION_WITHINPUT",
	template: "",
	model: null,
	events: {
		"click .jioTextWithCopy .JioCopy": "_jioTextCopy",
		"click .jioOnOffLabel": "_jioOnOffLabel",
		"click .jioDropdown .selected": "_dropdownSelected",
		"click ul li input": "_dropdownliinput",
		"click ul li a": "_dropdownlia",
		"click .JioChkbox_Pwd": "_JioChkbox_Pwd",
		"input .JioInput_Edit": "_JioInput_Edit"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_TEMP_JIO1SECTION_WITHINPUT();
		_this.template = _.template(Backbone.$("#temp_jio1SectionWithInput").html());
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.render);
		//_this.render();
		//_this.$el.show();
	},
	_sEvent: function(value) {
		//console.log('_sEvent');
		//console.log(value);
		var _this = this;
		var changed = false;
		var arr = _this.model.attributes.arr;
		var obj = Backbone.$(value.element.target).closest('.jioDropdown');
		if(obj.length === 0){
			_.map(arr, function(v){
				if(v.dropdown){
					if(v.visible){
						changed = true;
						v.visible = false;
					}
				}
			});
		}else{
			var currentClass = false;
			var parentClass = false;
			var path = value.element.originalEvent.path || (value.element.originalEvent.composedPath && value.element.originalEvent.composedPath());
			if(path){ //old edge not support
				_.map(path, function(v){
					//console.log(v);
					//console.log(_this.$el);
					if(_this.$el[0] && (v.className === _this.$el[0].className)){
						currentClass = true;
					}
					if(_this.$el.prevObject[0] && (v.className === _this.$el.prevObject[0].className)){
						parentClass =true;
					}
				});
				if(!currentClass || !parentClass){
					_.map(arr, function(v){
						if(v.dropdown){
							if(v.visible){
								changed = true;
								v.visible = false;
							}
						}
					});
				}
			}
		}
		if(changed){
			_this.model.set({ arr: arr });
			_this.model.trigger('change');
		}
		Backbone.View.prototype._sEvent.call(this, arguments);
	},
	_jioTextCopy: function(e) {
		//console.log("_jioTextCopy12");
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		var copyEle = _this.$el.find(e.currentTarget);
		// var txt = copyEle.prev().text();
		var txt = copyEle.prev(".JioInput_Edit").val();

		if (navigator.clipboard){
			// edge: 96ok, 44 fail
			// firefox: 92ok, 62 fail
			// chrome: 89 ok
			navigator.clipboard.writeText(txt)
			.then(function(){
				//console.log("Text copied to clipboard...")
			})
			.catch(function(err){
				//console.log('Something went wrong', err);
			});
		}else{    
			// ie11, 10, 9
			// window.clipboardData.setData('Text', txt);
			let textArea = document.createElement("textarea");
			textArea.value = txt;
			textArea.style.position = "absolute";
			textArea.style.opacity = 0;
			textArea.style.left = "-999999px";
			textArea.style.top = "-999999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			return new Promise((res, rej) => {
				document.execCommand('copy') ? res() : rej();
				textArea.remove();
			});
		}        
	},
	_jioOnOffLabel: function(e) {
		//console.log("_jioOnOffLabel");
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.$el.prevObject.trigger('_jioOnOffLabel');
		var index = Backbone.$(e.currentTarget).attr('data');
		var arr = _this.model.attributes.arr;
		arr[index].data = (arr[index].data === '1') ? '0' : '1';
		_this.model.set({ arr: arr });
		_this.model.trigger('change');
	},
	_dropdownClosedOther: function(id) {
		//console.log("_dropdownClosedOther");
		var _this = this;
		_this.$el.prevObject.trigger('_dropdownClosedOther');
		var arr = _this.model.attributes.arr;
		_.map(arr, function(v, k){
			if(v.dropdown && Number(id) !== k){
				v.visible = false;
			}
		});
	},
	_dropdownSelected: function(e) {
		//console.log("_dropdownSelected");
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.$el.prevObject.trigger('_dropdownSelected');
		var arr = _this.model.attributes.arr;
		var index = Backbone.$(e.currentTarget).closest('.jioDropdown').attr('data');
		arr[index].visible = !arr[index].visible;
		_this._dropdownClosedOther(index);
		_this.model.set({ arr: arr });
		_this.model.trigger('change');
	},
	_dropdownliinput: function(e) {
		//console.log("_dropdownliinput");
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.$el.prevObject.trigger('_dropdownliinput');
		var index = Backbone.$(e.currentTarget).closest('.jioDropdown').attr('data');
		var data = Backbone.$(e.currentTarget).next().attr('data');
		//var input = Backbone.$(e.currentTarget);
		var arr = _this.model.attributes.arr;
		var tmpData = arr[index].data === '' ? [] : arr[index].data.split(',');
		if(_.indexOf(tmpData, data) === -1){
			tmpData.push(data);
		}else{
			tmpData = _.without(tmpData, data);
		}
		arr[index].data = tmpData.join(',');
		_this.model.set({ arr: arr });
		_this.model.trigger('change');
	},
	_dropdownlia: function(e) {
		//console.log("_dropdownlia");
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.$el.prevObject.trigger('_dropdownlia');
		var index = Backbone.$(e.currentTarget).closest('.jioDropdown').attr('data');
		var data = Backbone.$(e.currentTarget).attr('data');
		var input = Backbone.$(e.currentTarget).prev();
		var arr = _this.model.attributes.arr;
		if(input.length > 0){ //multiple select
			var tmpData = arr[index].data === '' ? [] : arr[index].data.split(',');
			if(_.indexOf(tmpData, data) === -1){
				tmpData.push(data);
			}else{
				tmpData = _.without(tmpData, data);
			}
			arr[index].data = tmpData.join(',');
		}else{
			if(arr[index].data !== data){
				arr[index].data = data;
			}
			arr[index].visible = !arr[index].visible;
		}
		_this.model.set({ arr: arr });
		_this.model.trigger('change');
	},
	_JioChkbox_Pwd: function(e) {
		//console.log("_JioChkbox_Pwd");
		//e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.$el.prevObject.trigger('_JioChkbox_Pwd');
		var obj = Backbone.$(e.currentTarget);
		var index = obj.attr('data');
		var arr = _this.model.attributes.arr;
		var password_input = obj.prev().get(0);
		if(password_input.type === 'password'){
			arr[index].password.checked = true;
			password_input.type = "text";
		}else{
			arr[index].password.checked = false;
			password_input.type = "password";
		}
		_this.model.set({ arr: arr });
	},
	_JioInput_Edit: function(e) {
		//console.log("_JioInput_Edit");
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.$el.prevObject.trigger('_JioInput_Edit');
		var obj = Backbone.$(e.currentTarget);
		var index = obj.attr('data');
		var arr = _this.model.attributes.arr;
		arr[index].data = obj.val();
		_this.model.set({ arr: arr });
	},
	render: function() {
		var _this = this;
		_this.$el.html(_this.template(_this.model.attributes));
		transHTMLString(_this.$el);
	}
});

var TEMP_JIO2SECTION_NOINPUT = Backbone.View.extend({
	name: "TEMP_JIO2SECTION_NOINPUT",
	template: "",
	model: null,
	view: null,
	events: {
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_TEMP_JIO2SECTION_NOINPUT();
		_this.template = _.template(Backbone.$("#temp_jio2SectionNoInput").html());
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.render);
		//_this.render();
		//_this.$el.show();
	},
	render: function() {
		var _this = this;
		var attributes = _this.model.attributes;
		_this.$el.html(_this.template(attributes));
		_this.view = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio2SectionNoInput_subview', _this.$el) });
		_this.view.model.set(attributes);
		transHTMLString(_this.$el);
	}
});

var TEMP_FORJIOTABLESORT = Backbone.View.extend({
	name: "TEMP_FORJIOTABLESORT",
	template: "",
	model: null,
	view: null,
	sorting: null,
	events: {
		"click th": "_jioSortClick",
		"click tbody tr": "_jioRowClick",
		"click .jioTableCheckboxLabel": "_jioTableCheckboxLabel",
		"click .jioIconButton": "_jioIconButton"
	},
	preinitialize: function () {
		var _this = this;
		_this.sorting = _.extend({}, {});
		_this.model = new SYS_TEMP_FORJIOTABLESORT();
		_this.template = _.template(Backbone.$("#temp_forJioTableSort").html());
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.render);
		//_this.render();
		//_this.$el.show();
	},
	_jioRowClick: function (e) {
		//console.log('_jioRowClick');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget);
		if (obj.attr('REQUIRE_ROW_EVENT') == 'REQUIRE_ROW_EVENT'){
			var data = Number(obj.attr('data'));
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'row'});
			}
		}
	},
	_jioTableCheckboxLabel: function (e) {
		//console.log('_jioTableCheckboxLabel');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget);
		var objtablecheckbox = obj.closest('[class="jioTableCheckbox"]');
		var is_stopPropagation = objtablecheckbox.attr('stopPropagation');
		if (is_stopPropagation){			
			e.stopPropagation();
		}
		var data = Number(objtablecheckbox.attr('data'));
		var ex_data = objtablecheckbox.attr('ex_data');
		if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'checkbox', ex_data: ex_data});
		}
	},
	_jioIconButton: function (e) {
		//console.log('_jioIconButton');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget);
		var is_stopPropagation = obj.attr('stopPropagation');
		if (is_stopPropagation){
			
			e.stopPropagation();
		}
		var data = Number(obj.closest('[class^="jioActionIcons"]').attr('data'));
		var ex_data = obj.closest('[class^="jioActionIcons"]').attr('ex_data');
		if(obj.hasClass('jioIconMore')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'more', ex_data: ex_data });
			}
		}else if(obj.hasClass('jioIconMore1')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'more1'});
			}
		}else if(obj.hasClass('jioIconEdit')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'edit', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconForbidden')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'forbidden', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconEnable')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'enable', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconEnableNew')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'enablenew', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconDisable')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'disable', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconResend')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'resend', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconReply')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'reply', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconForward')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'forward', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconMessage')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'message', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconGroupMessage')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'groupmsg', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconSettings')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'settings', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconDummy')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'dummy', ex_data: ex_data});
			}
		}else if(obj.hasClass('jioIconDelete')){
			if(app.router_view._list_event){
				app.router_view._list_event({id: data, type: 'del', ex_data: ex_data});
			}
		}
	},
	_jioSortClick: function (e) { //th-sort-asc || th-sort-desc
		//console.log('_jioSortClick');
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		var ret = null;
		var tmpData = Backbone.$(e.currentTarget).attr('data');
		_.map(_this.sorting, function(v, k){
			if(k === tmpData){
				_this.sorting[k] = _this.sorting[k] === 'th-sort-asc' ? 'th-sort-desc' : 'th-sort-asc';
				ret = { obj: _this.sorting[k], key: k };
			}else{
				_this.sorting[k] = "";
			}
		});
		if(ret !== null){
			_this._jioSorting(ret.obj, ret.key);
		}
	},
	_jioSorting: function (obj, key) { //th-sort-asc || th-sort-desc
		//console.log('_jioSorting');
		var _this = this;
		var attributes = _this.model.attributes;
		if(obj === 'th-sort-asc'){
			attributes.lists = _.sortBy(attributes.lists, function(v){ return v[key].str; });
		}else{
			attributes.lists = _.sortBy(attributes.lists, function(v){ return v[key].str; }).reverse();
		}
		_this.$el.html(_this.template(attributes));
		transHTMLString(_this.$el);
	},
	_setHeadSortingKeys: function(head){
		//console.log('_setHeadSortingKeys');
		var _this = this;
		var ret = null;
		_.map(head, function(v, k){
			if(v.sort){
				if(!_this.sorting[k]){
					_this.sorting[k] = "";
				}else if(_this.sorting[k] !== ""){ //outside changed
					ret = { obj: _this.sorting[k], key: k };
				}
			}
		});
		return ret;
	},
	render: function() {
		var _this = this;
		var attributes = _this.model.attributes;
		var ret = _this._setHeadSortingKeys(attributes.head);
		//console.log(ret);
		if(ret === null){
			_this.$el.html(_this.template(attributes));
			transHTMLString(_this.$el);
		}else{
			_this._jioSorting(ret.obj, ret.key);
		}
	}
});
//templates end

//popup
var POPUP_LOADING = Backbone.View.extend({
	name: "POPUP_LOADING",
	template: "",
	model: null,
	interval: null,
	waitIcon: true,
	events: {
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				str: ""
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupLoading.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template(_this.model.attributes));
				transHTMLString(_this.$el);
				_this.render();
			});
		}
	},
	renderChange: function() {
		//console.log("renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	load_image: function() {
		//console.log("load_image");
		var _this = this;
		_this.waitIcon = !_this.waitIcon;
		if(_this.waitIcon){
			Backbone.$('.waitIcon2', _this.$el).html('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect class="jioColorFillNone" width="96" height="96"/><path class="jioColorFillPrimary" d="M-5839.946,1371a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5839.946,1371Zm23.945-24a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5816,1347Zm-48,0a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5864,1347Zm24.055-24a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5839.946,1323Z" transform="translate(5880 -1299)"/></svg>');
		}else{
			Backbone.$('.waitIcon2', _this.$el).html('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect class="jioColorFillNone" width="96" height="96"/><path class="jioColorFillPrimary" d="M-5671.961,1356.979a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5671.961,1356.979Zm33.9-.038a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5638.059,1356.941Zm.037-33.9a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5638.021,1323.038ZM-5672,1323a8,8,0,0,1,8-8,8,8,0,0,1,8,8,8,8,0,0,1-8,8A8,8,0,0,1-5672,1323Z" transform="translate(5695 -1292.001)"/></svg>');
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		clearInterval(_this.interval);
		_this.interval = null;
	},
	render: function() {
		var _this = this;
		_this.interval = setInterval(function(){
			_this.load_image();
		}, 100);
	}
});

var POPUP_SW_UPGRADE = Backbone.View.extend({
	name: "POPUP_SW_UPGRADE",
	template: "",
	interval: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupSWupgrade.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template({ width:'0%', countDownStatus: false }));
				transHTMLString(_this.$el);
				//_this.$el.show();
				//_this.render();
			});
		}
	},
	countDown: function() {
		//console.log("countDown");
		var _this = this;
		var time_passed = 0;
		var time_passed_on_Level_3 = 0;
		var timeout_interval = 0;
		var percentage = 0;
		var timeLevel_1 = { percentage_start: 0, percentage_end: 30, time_interval: 140};
		var timeLevel_2 = { percentage_start: 30, percentage_end: 50, time_interval: (40 * 60)};
		var timeLevel_3 = { percentage_start: 50, percentage_end: 100, time_interval: (3 * 60 - 10)};
		
		// 0  - 	30% - 	50% - 	100%
		// | 140s 	  | 40m	  | 3m	   |	
		// | L 1 	  | L 2	  | L 3	   |
		function countDown_progress()
		{
			time_passed += timeout_interval;

			//console.log("time_passed"+time_passed);
			if (g_swUpgrade_isFileUploading == false)
			{
				time_passed_on_Level_3 += timeout_interval;
				// 3rd level
				var curLevel = timeLevel_3;
				percentage = time_passed_on_Level_3/curLevel.time_interval*(curLevel.percentage_end - curLevel.percentage_start) + curLevel.percentage_start;
			}
			else
			{
				if (time_passed <= timeLevel_1.time_interval)
				{
					// first level
					var curLevel = timeLevel_1;
					percentage = time_passed/curLevel.time_interval*(curLevel.percentage_end - curLevel.percentage_start) + curLevel.percentage_start;
				}
				else
				{
					// 2nd level
					var curLevel = timeLevel_2;
					percentage = (time_passed - timeLevel_1.time_interval)/curLevel.time_interval*(curLevel.percentage_end - curLevel.percentage_start) + curLevel.percentage_start;
				}
			}
			_this.$el.html(_this.template({ width: percentage+'%', countDownStatus: true }));
			transHTMLString(_this.$el);
			//console.log(time_passed, percentage);

			if (time_passed_on_Level_3 >= timeLevel_3.time_interval)
			{
				clearInterval(_this.interval);
				_this.interval = null;
				if (app.router_view._popup_apply)
				{
					app.router_view._popup_apply({ name: _this.name, timeup: true });
				}
			}
			else
			{
				if (g_swUpgrade_isFileUploading == false)
				{
					// countdown for 3 mins.
					timeout_interval = 1;
					_this.interval = setTimeout(countDown_progress, timeout_interval * 1000);
				}
				else
				{
					timeout_interval = 5;
					_this.interval = setTimeout(countDown_progress, timeout_interval * 1000);
				}
			}

		};
		timeout_interval = 15;
		_this.interval = setTimeout(countDown_progress, timeout_interval * 1000);

	},

	btn_apply: function() {
		var _this = this;
		if(app.router_view._popup_apply){
			_this.$el.html(_this.template({ width:'0%', countDownStatus: true }));
			transHTMLString(_this.$el);
			_this.countDown();
			app.router_view._popup_apply({ name: _this.name, timeup: false });
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		clearInterval(_this.interval);
		_this.interval = null;
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_SW_VERSION = Backbone.View.extend({
	name: "POPUP_SW_VERSION",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_SOFTWARE_UPGRADE();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupSWVersion.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.show();
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		_this.$el.html(_this.template(_this.model.attributes));
		transHTMLString(_this.$el);
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		// if(app.router_view._popup_apply){
		// 	app.router_view._popup_apply({ name: _this.name });
		// }
		clearInterval(upgrade_interval);
		var wait_t;
		//console.log("upgrade_wait_time: "+upgrade_wait_time);
		// recevery mode: about 4 min
		if(parseInt(upgrade_wait_time) < 240){
			wait_t = (240 - upgrade_wait_time)*1000;
		}
		//console.log("wait_t: "+wait_t);
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('PAGE_ADMIN_SOFTWARE_UPGRADE_SUCCESSFUL') }); // Please wait...
		_this.interval = setInterval(function(){
			app._popupViewingClose();
			window.parent.location = 'login.html';
		}, wait_t);
	},
	btn_close: function() {
		//console.log("btn_close");
		var _this = this;
		_this.btn_apply();
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_SW_UPGRADE_FAILED = Backbone.View.extend({
	name: "POPUP_SW_UPGRADE_FAILED",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_SOFTWARE_UPGRADE();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioSoftwareUpgradeFailed.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.show();
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		_this.$el.html(_this.template(_this.model.attributes));
		transHTMLString(_this.$el);
	},
	btn_apply: function() {
		//console.log("btn_apply");
		app._popupViewingClose();
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_SW_RESTORE = Backbone.View.extend({
	name: "POPUP_SW_RESTORE",
	template: "",
	interval: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupSWrestore.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template({ width:'0%', countDownStatus: false }));
				transHTMLString(_this.$el);
				//_this.$el.show();
				//_this.render();
			});
		}
	},
	countDown: function() {
		//console.log("countDown");
		var _this = this;
		var init = 0;
		var total = 60;
		_this.interval = setInterval(function(){
			init++;
			//console.log(init);
			var tmp = init/total*100;
			_this.$el.html(_this.template({ width: tmp+'%', countDownStatus: true }));
			transHTMLString(_this.$el);
			if(init >= total){
				clearInterval(_this.interval);
				_this.interval = null;
				if(app.router_view._popup_apply){
					app.router_view._popup_apply({ name: _this.name, timeup: true });
				}
			}
		}, 1000);
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		if(app.router_view._popup_apply){
			_this.$el.html(_this.template({ width:'0%', countDownStatus: true }));
			transHTMLString(_this.$el);
			_this.countDown();
			app.router_view._popup_apply({ name: _this.name, timeup: false });
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		clearInterval(_this.interval);
		_this.interval = null;
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_CONFIRM_TEMPLATE = Backbone.View.extend({
	name: "POPUP_CONFIRM_TEMPLATE",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				info: "",
				warn: "",
				btn: '',
				hideCrossBtn: false
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupConfirmTemplate.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.html(_this.template());
				//transHTMLString(_this.$el);
				//_this.render();
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		var attr = _this.model.attributes;
		if(app.router_view._popup_apply){
			app.router_view._popup_apply({ name: _this.name, id: attr.id });
		}
		// you can check popup "OK" action base on this event
		_this.trigger('popup:confirm');
	},
	btn_close: function() {
		//console.log("btn_close");
		var _this = this;
		var attr = _this.model.attributes;
		if(app.router_view._popup_close){
			app.router_view._popup_close({ name: _this.name, id: attr.id });
		}else{
			app._popupViewingClose();
		}
		// you can check popup "cancel" action base on this event
		_this.trigger('popup:cancel');
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});


var POPUP_LOGS_ROUTE_TABLE = Backbone.View.extend({
	name: "POPUP_LOGS_ROUTE_TABLE",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				info: "",
				warn: "",
				btn: '',
				hideCrossBtn: false
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupLogsRouteTable.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		var _this = this;
		if(_this.template !== "")
		{
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			var routeTable = window.innerHeight -150;
			var realHeight = document.getElementsByClassName("jioPopupContent")[0].clientHeight;
			if( routeTable < realHeight )
			{
				document.getElementById("PopupContentRoutingTable").style.height=routeTable+"px";
			}
		}
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		var attr = _this.model.attributes;
		if(app.router_view._popup_apply){
			app.router_view._popup_apply({ name: _this.name, id: attr.id });
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		var _this = this;
		var attr = _this.model.attributes;
		if(app.router_view._popup_close){
			app.router_view._popup_close({ name: _this.name, id: attr.id });
		}else{
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_CONFIRM_WITH_FOOTER_TEMPLATE = Backbone.View.extend({
	name: "POPUP_CONFIRM_WITH_FOOTER_TEMPLATE",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				info: "",
				warn: "",
				footer: "",
				btn: '',
				hideCrossBtn: false
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupConfirmWithFooterTemplate.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.html(_this.template());
				//transHTMLString(_this.$el);
				//_this.render();
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		var attr = _this.model.attributes;
		if(app.router_view._popup_apply){
			app.router_view._popup_apply({ name: _this.name, id: attr.id });
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_INPUT_TEMPLATE = Backbone.View.extend({
	name: "POPUP_INPUT_TEMPLATE",
	template: "",
	model: null,
	modelInput: null,
	v_view1: null,
	set1: null,
	apply1: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				btn: ''
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupInputTemplate.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.listenTo(_this.model, 'change', _this.renderChange);
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
			_this.listenTo(_this.modelInput, 'change', _this.modelInputChange);
			_this.modelInput.trigger('change');
		}
	},
	modelInputChange: function() {
		//console.log('modelInputChange');
		var _this = this;
		_this._sChangeViews(_this.modelInput, [_this.set1], [_this.v_view1], [_this.apply1]);
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		var res = _this._sChangeModel(_this.modelInput, [_this.v_view1], [_this.apply1]);
		if(res.length === 0){
			if(app.router_view._popup_apply){
				app.router_view._popup_apply({ name: _this.name, id: _this.model.get('id') });
			}
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_INPUT_TEMPLATE_WITH_TEMPLATE_FILE = POPUP_INPUT_TEMPLATE.extend({
	name: "POPUP_INPUT_TEMPLATE_WITH_TEMPLATE_FILE",
	template_file: "",
	preinitialize: function (o) {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				btn: ''
			}
		}));
		_this.template_file = o.template_file;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		if(_this.template === ""){
			Backbone.$.get(_this.template_file +'?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.listenTo(_this.model, 'change', _this.renderChange);
				_this.model.trigger('change');
			});
		}
	},
});
//popup end

//pages
var boot_cause = 0;
var PAGE_STATUS_NETWORK = Backbone.View.extend({
	name: "PAGE_STATUS_NETWORK_TITLE",
	template: "",
	model: null,
	modelDevice: null,
	modelDeviceConnection: null,
	modelcellparameters: null,
	modelsecondarycellparameters: null,
	modelneighborcellparameters: null,
	modelUmts: null,
	modelbootcause: null,
	modelAdmDeviceManagement: null,
	v_jio2NoInput1: null,
	v_jio2NoInput2: null,
	v_jio2NoInput3: null,
	v_jio2NoInput4: null,
	v_jio1NoInput1: null,
	v_jio1NoInput2: null,
	v_jio1NoInput3: null,
	v_jio1NoInput4: null,
	v_jio1NoInput5: null,
	v_jio1NoInput6: null,
	v_view1: null,
	collection: null,
	events: {
		"click .reset_PAGE_STATUS_NETWORK_DEVICE_DATA_STATUS": "reset_PAGE_STATUS_NETWORK_DEVICE_DATA_STATUS",
		"click .reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS": "reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS",
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_NETWORK_STATUS();
		_this.modelDevice = new m_NETWORK_STATUS_DEVICE_DATA();
		_this.modelDeviceConnection = new m_NETWORK_STATUS_DEVICE_CONNECTION();
		_this.modelcellparameters = new m_NETWORK_STATUS_CELL_PARAMETERS();
		_this.modelsecondarycellparameters = new m_NETWORK_STATUS_SECONDARY_CELL_PARAMETERS();
		_this.modelneighborcellparameters = new m_NETWORK_STATUS_NEIGHBOR_CELL_PARAMETERS();
		_this.modelUmts = new m_INTERNET_UMTS();
		_this.modelbootcause = new m_BOOT_CAUSE();
		_this.modelAdmDeviceManagement = new m_ADMIN_DEVICE_MANAGEMENT();		
		_this.collection = new c_NETWORK_STATUS_NR_CA_SCELLS();
	},
	initialize: function () {
		//console.log(this.name, "initialize");
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.listenTo(_this.modelDevice, 'change', _this.modelDeviceChange);
		_this.listenTo(_this.modelDeviceConnection, 'change', _this.modelDeviceConnectionChange);
		_this.listenTo(_this.modelcellparameters, 'change', _this.modelcellparametersChange);
		_this.listenTo(_this.modelsecondarycellparameters, 'change', _this.modelsecondarycellparametersChange);
		_this.listenTo(_this.modelneighborcellparameters, 'change', _this.modelneighborcellparametersChange);
		_this.listenTo(_this.modelUmts, 'change', _this.modelUmtsChange);
		_this.listenTo(_this.modelUmts, 'sync', _this.modelUmtsSync);
		_this.listenTo(_this.modelbootcause, 'change', _this.modelbootcauseChange);
		_this.listenTo(_this.modelAdmDeviceManagement, 'change', _this.modelAdmDeviceManagementChange);
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		if(_this.template === ""){
			Backbone.$.get('templates/jioNetworkStatus.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_jio2NoInput1 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput1', _this.$el) });
				_this.v_jio2NoInput3 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput3', _this.$el) });
				_this.v_jio2NoInput4 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput4', _this.$el) });
				_this.v_jio1NoInput1 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput1', _this.$el) });
				_this.v_jio1NoInput2 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput2', _this.$el) });
				_this.v_jio2NoInput2 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput2', _this.$el) });
				_this.v_jio1NoInput3 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput3', _this.$el) });
				_this.v_jio1NoInput4 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput4', _this.$el) });
				_this.v_jio1NoInput5 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput5', _this.$el) });
				_this.v_jio1NoInput6 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput6', _this.$el) });
				_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
				_this.readData();
				_this.modelAdmDeviceManagement.fetchOLDJSON();				
			});
		}
	},
	readData: function (){		
		var _this = this;	
				_this.collection.fetch();
				_this.model.fetchOLDJSON();
				_this.modelDevice.fetchOLDJSON();
				_this.modelDeviceConnection.fetchOLDJSON();
				_this.modelcellparameters.fetchOLDJSON();
				_this.modelsecondarycellparameters.fetchOLDJSON();
				_this.modelneighborcellparameters.fetchOLDJSON();
				_this.modelbootcause.fetchOLDJSON();
				_this.modelUmts.fetchOLDJSON();
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio2NoInput3.model.set({
				str: 'IPv4 Network Status',
				lang: 'PAGE_STATUS_NETWORK_IPV4_NETWORK_STATUS',
				arr: [{
					str: 'IPv4 Address',
					lang: 'PAGE_STATUS_NETWORK_IPV4_IPADDR',
					data: _this.model.get('ipv4_ipaddr')
				},{
					str: 'Subnet Mask',
					lang: 'PAGE_STATUS_NETWORK_IPV4_SUBNET_MASK',
					data: _this.model.get('ipv4_subnet_mask')
				},{
					str: 'Default Gateway',
					lang: 'PAGE_STATUS_NETWORK_IPV4_DEFAULT_GATEWAY',
					data: _this.model.get('ipv4_default_gateway')
				},{
					str: 'Primary DNS Server',
					lang: 'PAGE_STATUS_NETWORK_IPV4_PRIMARY_DNS_SERVER',
					data: _this.model.get('ipv4_primary_dns')
				}]
			});
			//
			_this.v_jio2NoInput4.model.set({
				str: 'IPv6 Network Status',
				lang: 'PAGE_STATUS_NETWORK_IPV6_NETWORK_STATUS',
				arr: [{
					str: 'IPv6 Address',
					lang: 'PAGE_STATUS_NETWORK_IPV6_IPADDR',
					data: _this.model.get('ipv6_ipaddr')
				},{
					str: 'IPv6 Prefix',
					lang: 'PAGE_STATUS_NETWORK_IPV6_PREFIX_LENGTH',
					data: _this.model.get('ipv6_prefix_length')
				},{
					str: 'Default Gateway',
					lang: 'PAGE_STATUS_NETWORK_IPV6_DEFAULT_GATEWAY',
					data: _this.model.get('ipv6_default_gateway')
				},{
					str: 'Primary DNS Server',
					lang: 'PAGE_STATUS_NETWORK_IPV6_PRIMARY_DNS_SERVER',
					data: _this.model.get('ipv6_primary_dns')
				},{
					str: 'CLAT IP Address',
					lang: 'PAGE_STATUS_NETWORK_IPV6_CLAT_IPADDR',
					data: _this.model.get('ipv6_clat_ipaddr')
				}]
			});
		}
	},
	modelDeviceChange: function() {
		//console.log('modelDeviceChange');
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio2NoInput2.model.set({
				str: 'Device Data Status',
				lang: 'PAGE_STATUS_NETWORK_DEVICE_DATA_STATUS',
				icon: 'jioIconReset reset_PAGE_STATUS_NETWORK_DEVICE_DATA_STATUS',
				arr: [{
					str: 'Uplink Data (Data Sent)',
					lang: 'PAGE_STATUS_NETWORK_UPLINK_DATA',
					data: _this.modelDevice.get('data_sent')
				},{
					str: 'Downlink Data (Data Received)',
					lang: 'PAGE_STATUS_NETWORK_DOWNLINK_DATA',
					data: _this.modelDevice.get('data_received')
				},{
					str: 'Packet Loss',
					lang: 'PAGE_STATUS_NETWORK_PACKET_LOSS',
					data: _this.modelDevice.get('packet_loss')
				}]
			});
		}
	},
	modelDeviceConnectionChange: function() {
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio2NoInput1.model.set({
				str: 'Device Connection Status',
				lang: 'PAGE_STATUS_NETWORK_DEVICE_CONNECTION_STATUS',
				arr: [{
					str: 'Connection Status',
					lang: 'PAGE_STATUS_NETWORK_CONNECTION_STATUS',
					data: _this.modelDeviceConnection.get('connection_status')
				},{
					str: 'Connection Duration',
					lang: 'PAGE_STATUS_NETWORK_CONNECTION_DURATION',
					data: _this.modelDeviceConnection.get('connection_duration')
				},{
					str: 'Host Name',
					lang: 'PAGE_STATUS_NETWORK_HOST_NAME',
					data: _this.modelDeviceConnection.get('host_name')
				},{
					str: 'Operator Name',
					lang: 'PAGE_STATUS_NETWORK_OPERATOR_NAME',
					data: _this.modelDeviceConnection.get('operator_name')
				}]
			});
		}
	},
	modelcellparametersChange: function() {
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio1NoInput1.model.set({
				arr: [_this.renderDataSignalStrength({
					str: 'Signal Strength',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH',
					data: _this.modelcellparameters.get('signal_strength')
				}),{
					str: 'Operating Mode',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_OPERATING_MODE',
					data: _this.modelcellparameters.get('operating_mode')
				},{
					str: 'Band(s)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_BAND',
					data: _this.modelcellparameters.get('band')
				},{
					str: 'Bandwidth',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_BANDWIDTH',
					data: _this.modelcellparameters.get('bandwidth')
				},{
					str: 'NR-EARFCN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_NR_EARFCN',
					data: _this.modelcellparameters.get('nr_earcn')
				},{
					str: 'Physical Cell ID',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_PHYSICAL_CELL_ID',
					data: _this.modelcellparameters.get('physical_cell_id')
				},{
					str: 'PLMN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_PLMN',
					data: _this.modelcellparameters.get('plmn')
				},{
					str: 'Default APN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_DEFAULT_APN',
					data: _this.modelcellparameters.get('default_apn')
				},{
					str: 'User APN(s)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_USER_APN',
					data: _this.modelcellparameters.get('user_apn')
				}]
			});
			_this.v_jio1NoInput2.model.set({
				arr: [{/*
					str: 'Physical Cell ID',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_GLOBAL_CELL_ID',
					data: _this.modelcellparameters.get('physical_cell_id2')
				},{*/
					str: 'NCGI',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_NCGI',
					data: _this.modelcellparameters.get('ncgi')
				},{
					str: 'RRC State',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_RRC_STATE',
					data: _this.modelcellparameters.get('rrc_state')
				},{
					str: 'BLER(downlink)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_DLBLER',
					data: _this.modelcellparameters.get('dl_bler')
				},{
					str: 'Modulation',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_MODULATION',
					data: _this.modelcellparameters.get('modulation')
				},{
					str: 'MIMO',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_MIMO',
					data: _this.modelcellparameters.get('mimo')
				},{
					str: 'SS-RSRP',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_RSRP',
					data: _this.modelcellparameters.get('ss_rsrp')
				},{
					str: 'SS-RSRQ',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_RSRQ',
					data: _this.modelcellparameters.get('ss_rsrq')
				},{
					str: 'SS-SINR',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_SINR',
					data: _this.modelcellparameters.get('ss_sinr')
				},{
					//Add a blank line to keep the page formatted properly
					str: '',
					lang: '',
				}]
			});
		}
	},
	modelsecondarycellparametersChange: function() {
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio1NoInput3.model.set({
				arr: [_this.renderDataSignalStrength({
					str: 'Signal Strength',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH',
					data: _this.modelsecondarycellparameters.get('signal_strength')
				}),{
					str: 'Operating Mode',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_OPERATING_MODE',
					data: _this.modelsecondarycellparameters.get('operating_mode')
				},{
					str: 'Band(s)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_BAND',
					data: _this.modelsecondarycellparameters.get('band')
				},{
					str: 'Bandwidth',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_BANDWIDTH',
					data: _this.modelsecondarycellparameters.get('bandwidth')
				},{
					str: 'NR-EARFCN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_NR_EARFCN',
					data: _this.modelsecondarycellparameters.get('nr_earcn')
				},{
					str: 'Physical Cell ID',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_PHYSICAL_CELL_ID',
					data: _this.modelsecondarycellparameters.get('physical_cell_id')
				},{
					str: 'PLMN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_PLMN',
					data: _this.modelsecondarycellparameters.get('plmn')
				},{
					str: 'Default APN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_DEFAULT_APN',
					data: _this.modelsecondarycellparameters.get('default_apn')
				},{
					str: 'User APN(s)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_USER_APN',
					data: _this.modelsecondarycellparameters.get('user_apn')
				}]
			});
			_this.v_jio1NoInput4.model.set({
				arr: [{/*
					str: 'Physical Cell ID',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_GLOBAL_CELL_ID',
					data: _this.modelsecondarycellparameters.get('physical_cell_id2')
				},{*/
					str: 'NCGI',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_NCGI',
					data: _this.modelsecondarycellparameters.get('ncgi')
				},{
					str: 'RRC State',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_RRC_STATE',
					data: _this.modelsecondarycellparameters.get('rrc_state')
				},{
					str: 'BLER(downlink)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_DLBLER',
					data: _this.modelsecondarycellparameters.get('dl_bler')
				},{
					str: 'Modulation',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_MODULATION',
					data: _this.modelsecondarycellparameters.get('modulation')
				},{
					str: 'MIMO',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_MIMO',
					data: _this.modelsecondarycellparameters.get('mimo')
				},{
					str: 'SS-RSRP',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_RSRP',
					data: _this.modelsecondarycellparameters.get('ss_rsrp')
				},{
					str: 'SS-RSRQ',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_RSRQ',
					data: _this.modelsecondarycellparameters.get('ss_rsrq')
				},{
					str: 'SS-SINR',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_SINR',
					data: _this.modelsecondarycellparameters.get('ss_sinr')
				},{
					//Add a blank line to keep the page formatted properly
					str: '',
					lang: '',
				}]
			});
		}
	},
	modelneighborcellparametersChange: function() {
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio1NoInput5.model.set({
				arr: [_this.renderDataSignalStrength({
					str: 'Signal Strength',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH',
					data: _this.modelneighborcellparameters.get('signal_strength')
				}),{
					str: 'Operating Mode',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_OPERATING_MODE',
					data: _this.modelneighborcellparameters.get('operating_mode')
				},{
					str: 'Band(s)',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_BAND',
					data: _this.modelneighborcellparameters.get('band')
				},{
					str: 'Bandwidth',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_BANDWIDTH',
					data: _this.modelneighborcellparameters.get('bandwidth')
				},{
					str: 'NR-EARFCN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_NR_EARFCN',
					data: _this.modelneighborcellparameters.get('nr_earcn')
				}]
			});
			_this.v_jio1NoInput6.model.set({
				arr: [{
					str: 'Physical Cell ID',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_PHYSICAL_CELL_ID',
					data: _this.modelneighborcellparameters.get('physical_cell_id')
				},{
					str: 'PLMN',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_PLMN',
					data: _this.modelneighborcellparameters.get('plmn')
				},{
					str: 'NCGI',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_NCGI',
					data: _this.modelneighborcellparameters.get('ncgi')
				},{
					str: 'SS-RSRP',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_RSRP',
					data: _this.modelneighborcellparameters.get('ss_rsrp')
				},{
					str: 'SS-RSRQ',
					lang: 'PAGE_STATUS_NETWORK_CELLULAR_SS_RSRQ',
					data: _this.modelneighborcellparameters.get('ss_rsrq')
				}]
			});
		}
	},
	modelUmtsChange: function() {
		//console.log('modelUmtsChange');
		var _this = this;
		//console.log(_this.modelUmts);
		var wait = 0;
		if(boot_cause == 17 || boot_cause == 2){
			wait = 4000;
		}
		setTimeout(function(){
			if(!_this.modelUmts.isSimInsert()){
				app._popupViewing(POPUP_CONFIRM_TEMPLATE);
				app.popup_view.model.set({
					id: 1000,
					title: getHTMLString('PAGE_STATUS_NETWORK_NO_SIM'), 
					info: getHTMLString('PAGE_STATUS_NETWORK_SIM_NOT_AVAILABLE') + '<br>'+getHTMLString('PAGE_STATUS_NETWORK_INSERT_SIM'), 
					warn: '',
					hideCrossBtn: true,
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});
			}else{
				if (!_this.modelUmts.isSimCardOK()){
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 1000,
						title: getHTMLString('PAGE_STATUS_NETWORK_INVALID_SIM'), 
						info: getHTMLString('PAGE_STATUS_NETWORK_NETWORK_LOCKED') + '<br>'+getHTMLString('PAGE_STATUS_NETWORK_INSERT_SIM'), 
						warn: '',
						hideCrossBtn: true,
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}else {
					if (_this.modelUmts.isPinEnabled()){
						if (_this.modelUmts.isPukAttempsExpired()){
							window.parent.location = 'pukattempsexpired.html';
						}
						if (_this.modelUmts.isPinLock()){
							// modelUmts data from GET
							app._popupViewing(POPUP_SIM_PIN_ENTRY);
							app.popup_view.model.set({
								id: 2000
							});
						}
					}/*else{
						_this.popupWaitSIMLoading();
					}*/
				}
			}
		}, wait);
	},
	popupWaitSIMLoading: function (){
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_WAIT') });//Loading, please wait.
				setTimeout(function(){
					app._popupViewingClose();					
				}, 3000);							
	},
	modelUmtsSync: function() {
		//console.log('PAGE_STATUS_NETWORK: modelUmtsSync');
		var _this = this;
		var _response = _this.model._response || null;
		if(_response){
			//console.log(_response);
		}
	},
	modelbootcauseChange: function() {
		//console.log('modelbootcauseChange');
		var _this = this;
		var bootCause = _this.modelbootcause.get('boot_cause').split(',');
		if(bootCause[0]==1){
			if(bootCause[1]=='17'){
				_this.popupWaitBCLoading();
				boot_cause = 17;
			}else if(bootCause[1]=='2'){
				_this.popupWaitBCLoading_FWUPG();
				boot_cause = 2;
			}
		}
	},
	modelAdmDeviceManagementChange: function() {
		//console.log(this.name, 'modelAdmDeviceManagementChange');
		var _this = this;
		var refresh_time = _sysFunc.remove_num_comma_in_value(_this.modelAdmDeviceManagement.get('refresh_time'));
		
		if (refresh_time > 0){
		  _this.intervalrefresh = setInterval(function(){
			  
			  _this.readData();			  

		  }, (refresh_time * 1000));
		  
		}

	},
	collectionSync: function() {
		//console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_STATUS_NETWORK_SCELL_PHYSICAL_CELL_ID",
			str: "Physical Cell ID"
		},{
			sort: true,
			lang: "PAGE_STATUS_NETWORK_SCELL_BAND",
			str: "Band"
		},{
			sort: true,
			lang: "PAGE_STATUS_NETWORK_SCELL_EARFCN",
			str: "NR-EARFCN"
		},{
			sort: true,
			lang: "PAGE_STATUS_NETWORK_SCELL_BANDWIDTH",
			str: "Bandwidth"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			
			if(val.pci.indexOf(",") >= 0){
				value = val.pci.split(',');
				val.pci = value[1];
			}
			if(val.band.indexOf(",") >= 0){
				value = val.band.split(',');
				val.band = value[1];
			}
			if(val.earfcn.indexOf(",") >= 0){
				value = val.earfcn.split(',');
				val.earfcn = value[1];
			}
			if(val.bandwidth.indexOf(",") >= 0){
				value = val.bandwidth.split(',');
				val.bandwidth = value[1];
			}
			
			lists.push([
				{
					str: val.pci
				},{
					str: val.band
				},{
					str: val.earfcn
				},{
					str: val.bandwidth
				}
			]);
		});
		_this.v_view1.model.set({ head: head, lists: lists });
	},
	popupWaitBCLoading: function (){
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_SUCCESSFULLY_CHANGED_LAN_MODE') });
		setTimeout(function(){
			app._popupViewingClose();
		}, 3000);
	},
	popupWaitBCLoading_FWUPG: function (){
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_SUCCESSFULLY_UPDATE_SW') });
		setTimeout(function(){
			app._popupViewingClose();
		}, 3000);
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(data.id === 1000){ //PAGE_STATUS_NETWORK_INVALID_SIM
			app._popupViewingClose();
		}
		if(data.id === 2000){ 
			// POPUP_SIM_PIN_ENTRY
			app._popupViewingClose();
			if (data.result === 1){
				_this.popupWaitSIMLoading();
			}

		}
		if(data.id === 3000){ 
		}
		if (data.id === 'reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS'){
			_this.do_reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS();
		}
	},
	reset_PAGE_STATUS_NETWORK_DEVICE_DATA_STATUS: function (e) {
		//console.log('reset_PAGE_STATUS_NETWORK_DEVICE_DATA_STATUS');
		e.preventDefault();
		//e.stopPropagation();
		var _this = this;
		_this.modelDevice.fetchOLDJSON();
	},
	reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS: function (e) {
		//console.log('reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS');
		e.preventDefault();
		//e.stopPropagation();
		
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 'reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS',
						warn_title: getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_DROP_1'),
						info: getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_DROP_2') + '<br/>' + getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_DROP_3'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
	},
	do_reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS: function () {
		//console.log('do_reset_PAGE_STATUS_NETWORK_NEIGHBOR_CELLULAR_CONNECTION_PARAMETERS');
		var _this = this;
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			var model = new m_SCAN_NEIGHBOR_CELL();
			var res = model.set({ rescan: "1" });
			model.savePOST(false);
			_this.interval_SCAN_NEIGHBOR_CELL = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval_SCAN_NEIGHBOR_CELL);
					_this.modelneighborcellparameters.fetchOLDJSON();
				}
			}, 5000);
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	renderDataSignalStrength: function(obj) {
		//console.log('renderDataSignalStrength');
		if(obj.lang === 'PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH'){
			//console.log(obj.data);
			var tmpVal = Number(obj.data) || 0;
			if(tmpVal == 0){
				obj['data'] = getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_NO_NETWORK'); //No Network
				obj['icon'] = 'jioIconSignalNone';
			}else if(tmpVal == 4){
				obj['data'] = getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH_EXCELLENT'); //Excellent
				obj['icon'] = 'jioIconSignalExcellent';
			}else if(tmpVal == 3){
				obj['data'] = getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH_GOOD'); //Very Good
				obj['icon'] = 'jioIconSignalGood';
			}else if(tmpVal == 2){
				obj['data'] = getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH_NORMAL'); //Good
				obj['icon'] = 'jioIconSignalNormal';
			}else if(tmpVal == 1){
				obj['data'] = getHTMLString('PAGE_STATUS_NETWORK_CELLULAR_SIGNAL_STRENGTH_BAD'); //Poor
				obj['icon'] = 'jioIconSignalBad';
			}else{
				//console.log("tmpVal: "+tmpVal);
				obj['data'] = '--'; //--
				obj['icon'] = 'jioIconSignalNone';
			}
		}
		return obj;
	},
	_close: function() {
		//console.log(this.name, "_close");
		var _this = this;
		if (_this.intervalrefresh){
			clearInterval(_this.intervalrefresh); 
			_this.intervalrefresh = 0;
		}
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_STATUS_LAN = Backbone.View.extend({
	name: "PAGE_STATUS_LAN_TITLE",
	template: "",
	model: null,
	v_jio2NoInput1: null,
	v_jio2NoInput2: null,
	v_jio2NoInput3: null,
	v_jio2NoInput4: null,
	events: {
                "click .reset_PAGE_STATUS_LAN_CDT_STATUS": "reset_PAGE_STATUS_LAN_CDT_STATUS",
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_NETWORK_STATUS_LAN();
		_this.collection = new c_CONNECTED_DEVICE();
		_this.collection1 = new c_ROUTING_TABLE();
		_this.collection2 = new c_CDT_STATUS();
	},
	initialize: function () {
		var _this = this;
		var temp;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.listenTo(_this.collection1, 'sync', _this.collection1Sync);
		_this.listenTo(_this.collection2, 'sync', _this.collection2Sync);
		if(_this.template === ""){
			if (hidden_dhcp == 0)
			{
				temp='templates/jioLanStatus_Route.html?_=';
			}
			else
			{
				temp='templates/jioLanStatus.html?_=';
			}
			Backbone.$.get(temp+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_jio2NoInput1 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput1', _this.$el) });
				_this.v_jio2NoInput2 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput2', _this.$el) });
				_this.v_jio2NoInput3 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput3', _this.$el) });
				_this.v_jio2NoInput4 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput4', _this.$el) });
				_this.model.fetchOLDJSON();
				_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
				_this.v_view2 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view2', _this.$el) });
				_this.v_view3 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view3', _this.$el) });
				_this.collection.fetch();
				_this.collection1.fetch();
				_this.collection2.fetch();
			});
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio2NoInput1.model.set({
				str: 'Operating Mode',
		                arr: [{
					str: 'Mode',
					lang: 'PAGE_STATUS_LAN_MODE',
					data: _this.model.get('mode')
                                }]
			});
			_this.v_jio2NoInput2.model.set({
				str: 'Ethernet Status',
				arr: [{
					str: 'Link Status',
					lang: 'PAGE_STATUS_LAN_LINK_STATUS',
					data: _this.model.get('link_status')
				},{
					str: 'Speed',
					lang: 'PAGE_STATUS_LAN_SPEED',
					data: _this.model.get('speed')+" Mbps"
				},{
					str: 'Duplex Mode',
					lang: 'PAGE_STATUS_LAN_DUPLEX_MODE',
					data: _this.model.get('duplex_mode')
				}]
			});
			_this.v_jio2NoInput3.model.set({
				str: 'LAN IPv4',
				arr: [{
					str: 'Host IP Address',
					lang: 'PAGE_STATUS_LAN_HOST_IPADDR',
					data: _this.model.get('ipv4_ipaddr')
				},{
					str: 'LAN Operating Mode',
					lang: 'PAGE_STATUS_LAN_OPERATING_MODE',
					data: _this.model.get('operating_mode')
				},{
					str: 'Subnet Mask',
					lang: 'PAGE_STATUS_LAN_SUBNET_MASK',
					data: _this.model.get('ipv4_subnet_mask')
				},{
					str: 'ODU / Gateway IP Address',
					lang: 'PAGE_STATUS_LAN_GATEWAY_IPADDR',
					data: _this.model.get('ipv4_default_gateway')
				}]
			});
			_this.v_jio2NoInput4.model.set({
				str: 'LAN IPv6',
				arr: [{
					str: 'Host IPv6 Address',
					lang: 'PAGE_STATUS_LAN_HOST_IPV6ADDR',
					data: _this.model.get('ipv6_ipaddr')
				},{
					str: 'LAN Operating Mode',
					lang: 'PAGE_STATUS_LAN_OPERATING_MODE',
					data: _this.model.get('ipv6_operating_mode')
				},{
					str: 'Subnet Mask',
					lang: 'PAGE_STATUS_LAN_IPV6_PRELEN',
					data: _this.model.get('ipv6_prelen')
				},{
					str: 'ODU / Gateway IPv6 Address',
					lang: 'PAGE_STATUS_LAN_GATEWAY_IPV6ADDR',
					data: _this.model.get('ipv6_default_gateway')
				}]
			});
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	collectionSync: function() {
		//console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_STATUS_LAN_CONNECTED_DEVICE_HOSTNAME",
			str: "Host Name"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CONNECTED_DEVICE_MAC",
			str: "MAC Address"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CONNECTED_DEVICE_IP",
			str: "IP address"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CONNECTED_DEVICE_TYPE",
			str: "Type"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CONNECTED_LEASE_TIME",
			str: "Lease Time"

		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			
			if(val.hostname.indexOf(",") >= 0){
				value = val.hostname.split(',');
				val.hostname = value[1];
			}
			if(val.mac.indexOf(",") >= 0){
				value = val.mac.split(',');
				val.mac = value[1];
			}
			if(val.ip.indexOf(",") >= 0){
				value = val.ip.split(',');
				val.ip = value[1];
			}
			if(val.device_type.indexOf(",") >= 0){
				value = val.device_type.split(',');
				val.device_type = value[1];
			}
			if(val.lease_time.indexOf(",") >= 0){
				value = val.lease_time.split(',');
				val.lease_time = value[1];
			}
			
			lists.push([
				{
					str: val.hostname
				},{
					str: val.mac
				},{
					str: val.ip
				},{
					str: val.device_type
				},{
					str: val.lease_time
				}
			]);
		});
		_this.v_view1.model.set({ head: head, lists: lists });
	},
	collection1Sync: function() {
		//console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_STATUS_ROUTING_DESTINATION",
			str: "Destination"
		},{
			sort: true,
			lang: "PAGE_STATUS_ROUTING_GATEWAY",
			str: "Gateway"
		},{
			sort: true,
			lang: "PAGE_STATUS_ROUTING_GENMASK",
			str: "Genmask"
		},{
			sort: true,
			lang: "PAGE_STATUS_ROUTING_INTERFACE",
			str: "Interface"
		}];
		var lists = [];
		var c_lists = _this.collection1.toJSON();
		_.map(c_lists, function (val, key) {
			lists.push([
				{
					str: val.destination
				},{
					str: val.gateway
				},{
					str: val.genmask
				},{
					str: val.iface
				}
			]);
		});
		_this.v_view2.model.set({ head: head, lists: lists });
	},
	collection2Sync: function() {
		//console.log('collection2Sync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_STATUS_LAN_CDT_PAIR_PAIR",
			str: "Pair"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CDT_PAIR_STATUS",
			str: "Status"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CDT_PAIR_LENGTH",
			str: "Length"
		},{
			sort: true,
			lang: "PAGE_STATUS_LAN_CDT_PAIR_DISTANCE_TO_FAULT",
			str: "Distance ot fault"
		}];
		var lists = [];
		var c_lists = _this.collection2.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			if(val.pair.indexOf(",") >= 0){
				value = val.pair.split(',');
				val.pair = value[1];
			}
			if(val.pair_status.indexOf(",") >= 0){
				value = val.pair_status.split(',');
				val.pair_status = value[1];
			}
			if(val.pair_length.indexOf(",") >= 0){
				value = val.pair_length.split(',');
				val.pair_length = value[1];
			}
			if(val.pair_distance_to_fault.indexOf(",") >= 0){
				value = val.pair_distance_to_fault.split(',');
				val.pair_distance_to_fault = value[1];
			}
			lists.push([
				{
					str: val.pair
				},{
					str: val.pair_status
				},{
					str: val.pair_length
				},{
					str: val.pair_distance_to_fault
				}
			]);
		});
		_this.v_view3.model.set({ head: head, lists: lists });
	},
        _popup_apply: function(data){
		var _this = this;
		if (data.id === 'reset_PAGE_STATUS_LAN_CDT_STATUS'){
			_this.do_reset_PAGE_STATUS_LAN_CDT_STATUS();
		}
	},
	reset_PAGE_STATUS_LAN_CDT_STATUS: function (e) {
		app._popupViewing(POPUP_CONFIRM_TEMPLATE);
		app.popup_view.model.set({
			id: 'reset_PAGE_STATUS_LAN_CDT_STATUS',
			warn_title: getHTMLString('PAGE_STATUS_LAN_CDT_STATUS_DROP_1'),
			info: getHTMLString('PAGE_STATUS_LAN_CDT_STATUS_DROP_2') + '<br/>' + getHTMLString('PAGE_STATUS_LAN_CDT_STATUS_DROP_3'),
			warn: '',
			btn: getHTMLString('MAIN_BTN_OK') //OK
		});
	},
	do_reset_PAGE_STATUS_LAN_CDT_STATUS: function (e) {
		var _this = this;
                _this.collection2.fetch();
                app._popupViewingClose();
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_STATUS_ODU = Backbone.View.extend({
	name: "PAGE_STATUS_ODU_TITLE",
	template: "",
	model: null,
	v_jio1NoInput1: null,
	v_jio1NoInput2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_NETWORK_STATUS_DEVICE();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioOduDevice.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_jio1NoInput1 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput1', _this.$el) });
				_this.v_jio1NoInput2 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput2', _this.$el) });
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio1NoInput1.model.set({
				arr: [{
					str: 'Current Local Date & Time',
					lang: 'PAGE_STATUS_ODU_CURRENT_LOCAL_DATE_TIME',
					data: _this.model.get('time')
				},{
					str: 'ODM',
					lang: 'PAGE_STATUS_ODU_ODM',
					data: _this.model.get('odm')
				},{
					str: 'EID',
					lang: 'PAGE_STATUS_ODU_EID',
					data: _this.model.get('eid')
				},{
					str: 'Product Name',
					lang: 'PAGE_STATUS_ODU_PRODUCT_ID_NAME_MODEL_NO',
					data: _this.model.get('product_id')
				},{
					str: 'Software Version',
					lang: 'PAGE_STATUS_ODU_SOFTWARE_VERSION',
					data: _this.model.get('sw_version')
				},{
					str: 'Hardware Version',
					lang: 'PAGE_STATUS_ODU_HARDWARE_VERSION',
					data: _this.model.get('hw_version')
				},/*{
					str: 'Device Make',
					lang: 'PAGE_STATUS_ODU_DEVICE_MAKE',
					data: _this.model.get('device_make')
				},*/{
					str: 'Serial Number',
					lang: 'PAGE_STATUS_ODU_SERIAL_NUMBER',
					data: _this.model.get('serial_number')
				},{
					str: 'IMEI',
					lang: 'PAGE_STATUS_ODU_IMEI',
					data: _this.model.get('imei')
				},{
					str: 'IMSI',
					lang: 'PAGE_STATUS_ODU_IMSI',
					data: _this.model.get('imsi')
				}]
			});
			//
			_this.v_jio1NoInput2.model.set({
				arr: [{
					str: 'MSISDN',
					lang: 'PAGE_STATUS_ODU_MSISDN',
					data: _this.model.get('msisdn')
				},{
					str: 'ICCID',
					lang: 'PAGE_STATUS_ODU_ICCID',
					data: _this.model.get('iccid')
				},{
					str: 'Software Creation Date',
					lang: 'PAGE_STATUS_ODU_SOFTWARE_CREATION_DATE',
					data: _this.model.get('sw_creation_date')
				},{
					str: 'Primary MAC ID',
					lang: 'PAGE_STATUS_ODU_PRIMARY_MAC_ID',
					data: _this.model.get('primary_mac_id')
				},{
					str: 'Device OUI',
					lang: 'PAGE_STATUS_ODU_DEVICE_OUI',
					data: _this.model.get('device_oui')
				},{
					str: 'Device Model',
					lang: 'PAGE_STATUS_ODU_DEVICE_MODEL',
					data: _this.model.get('device_model')
				},{
					str: 'Supported Bands',
					lang: 'PAGE_STATUS_ODU_SUPPORTED_BANDS',
					data: _this.model.get('supported_bands')
				},{
					str: 'Last Successful ACS Connection',
					lang: 'PAGE_ACS_SETTINGS_LAST_SUCCESSFUL_ACS_CONNECTION',
					data: _this.model.get('last_connection')
				},{
					//Add a blank line to keep the page formatted properly
					str: '',
					lang: '',
				}]
			});
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_STATUS_UTILIZATION = Backbone.View.extend({
	name: "PAGE_STATUS_UTILIZATION_TITLE",
	template: "",
	model: null,
	v_jio1NoInput1: null,
	v_jio2NoInput1: null,
	v_jio2NoInput2: null,
	v_jio2NoInput3: null,
	v_jio2NoInput4: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_NETWORK_STATUS_UTILIZATION();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioUtilization.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_jio1NoInput1 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput1', _this.$el) });
				_this.v_jio2NoInput1 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput1', _this.$el) });
				_this.v_jio2NoInput2 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput2', _this.$el) });
				_this.v_jio2NoInput3 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput3', _this.$el) });
				_this.v_jio2NoInput4 = new TEMP_JIO2SECTION_NOINPUT({ el: Backbone.$('.v_jio2NoInput4', _this.$el) });
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		_this.v_jio1NoInput1.model.set({
			arr: [{
				str: 'System Monitoring Duration',
				lang: 'PAGE_STATUS_UTILIZATION_SYSTEM_MONITORING_DURATION',
				data: _this.model.get('duration')+" Seconds"
			},{
				str: 'Device Uptime',
				lang: 'PAGE_STATUS_UTILIZATION_DEVICE_UPTIME',
				data: _this.model.get('uptime')
			},{
				str: 'Firewall Status',
				lang: 'PAGE_STATUS_UTILIZATION_FIREWALL_STATUS',
				data: _this.model.get('firewall_status')
			}]
		});
		//
		_this.v_jio2NoInput1.model.set({
			str: 'CPU Utilization',
			lang: 'PAGE_STATUS_UTILIZATION_CPU_UTILIZATION',
			arr: [_this.renderDataCPUPercentage({
				str: 'Current Usage',
				lang: 'PAGE_STATUS_UTILIZATION_CURRENT_USAGE',
				data: _this.model.get('cpu_current_usage')
			})]
		});
		//
		_this.v_jio2NoInput2.model.set({
			str: 'Memory Utilization',
			lang: 'PAGE_STATUS_UTILIZATION_MEMORY_UTILIZATION',
			arr: [{
				str: 'Current Usage',
				lang: 'PAGE_STATUS_UTILIZATION_CURRENT_USAGE',
				data: _this.model.get('mem_current_usage')+' MB'
			}]
		});
		//
		_this.v_jio2NoInput3.model.set({
			str: 'Uplink Data Speed',
			lang: 'PAGE_STATUS_UTILIZATION_UPLINK_DATA_SPEED',
			arr: [{
				str: 'Average Data Rate',
				lang: 'PAGE_STATUS_UTILIZATION_AVERAGE_DATA_RATE',
				data: _this.model.get('uplink_average_data_rate')+'ps'
			}]
		});
		//
		_this.v_jio2NoInput4.model.set({
			str: 'Downlink Data Speed',
			lang: 'PAGE_STATUS_UTILIZATION_DOWNLINK_DATA_SPEED',
			arr: [{
				str: 'Average Data Rate',
				lang: 'PAGE_STATUS_UTILIZATION_AVERAGE_DATA_RATE',
				data: _this.model.get('downlink_average_data_rate')+'ps'
			}]
		});
	},
	renderDataCPUPercentage: function(obj) {
		//console.log('renderDataCPUPercentage');
		var tmpVal = Number(obj.data) || 0;
		if(tmpVal > 80){
			obj['data'] = obj['data']+'%';
			obj['cpu'] = 'error';
		}else{
			obj['data'] = obj['data']+'%';
			obj['cpu'] = 'normal';
		}
		return obj;
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_CELLULAR = Backbone.View.extend({
	name: "PAGE_SETTINGS_CELLULAR_TITLE",
	template: ''
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_CELLULAR_USER_APNS_LIST">User APNs List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide user_apns_list"></div>'
//	+'</div>'
//	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS">Default APN Settings</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio2SectionWithInput jioH2MobileShowHide default_apn_settings"></div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
//	+'<div class="jioMobileSection">'
//	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_CELLULAR_PIN_MANAGEMENT">PIN Management</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide pin_management">'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_CELLULAR_CELL_LOCK">Cell Lock</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide cell_lock">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>',
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
        	v_view5: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(v) {
		//console.log('_list_event');
		//console.log(v);
		var _this = this;
		if(_this.v_view1._list_event){
			_this.v_view1._list_event(v);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view1._popup_apply){
			_this.v_view1._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_SETTINGS_CELLULAR_USER_APNS_LIST({ el: Backbone.$('.user_apns_list', _this.$el) });
		_this.v_view2 = new PAGE_SETTINGS_CELLULAR_CELLULAR_BAND_SELECTION({ el: Backbone.$('.cellilar_band_selection', _this.$el) });
		_this.v_view3 = new PAGE_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS({ el: Backbone.$('.default_apn_settings', _this.$el) });
		//_this.v_view4 = new PAGE_SETTINGS_CELLULAR_PIN_MANAGEMENT({ el: Backbone.$('.pin_management', _this.$el) });
		_this.v_view5 = new PAGE_SETTINGS_CELLULAR_CELL_LOCK({ el: Backbone.$('.cell_lock', _this.$el) });
	}
});

var user_apn_idx = 0;
var PAGE_SETTINGS_CELLULAR_USER_APNS_LIST = Backbone.View.extend({
	name: "PAGE_SETTINGS_CELLULAR_USER_APNS_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeading">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_CELLULAR_USER_APNS_LIST">User APNs List</div>'
	+'<div class="jioIconAddNew jioClickButton"></div>'
	+'<div class="jioH2 jioClickButton" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	v_view1: null,
	eventId: 0,
	apply1: {
		0: 'status',
		1: 'name',
		2: 'type'
	},
	events: {
		'click .jioClickButton': 'jioClickButton'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SETTINGS_CELLULAR_APNS();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_APN_STATUS",
			str: "APN Status"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_APN_NAME",
			str: "APN Name"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_CONNECTION_TYPE",
			str: "Connection Type"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			
			if(val.status.indexOf(",") >= 0){
				value = val.status.split(',');
				val.status = value[1];
			}
			if(val.name.indexOf(",") >= 0){
				value = val.name.split(',');
				val.name = value[1];
			}
			if(val.type.indexOf(",") >= 0){
				value = val.type.split(',');
				val.type = value[1];
			}
			
			lists.push([
				{
					enable: true,
					str: val.status
				},{
					str: val.name
				},{
					str: _this.typeInputStr(val.type)
				},{
					id: key,
					btn: [{
						type: 'edit'
					}, {
						type: 'del'
					}]
				}
			]);
		});
		_this.v_view1.model.set({ head: head, lists: lists });
	},
	jioClickButton: function() {
		//console.log('jioClickButton');
		var _this = this;
		if(_this.collection.length >= 1){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_USER_APNS'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SETTINGS_CELLULAR_APN();
			app.popup_view.model.set({
				id: 2000,
				title: getHTMLString('POPUP_ADD_NEW_USER_APN'), //Add New User APN
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'APN Status',
					lang: 'PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_APN_STATUS',
					checked: true,
					data: ''
				},{
					str: 'APN Name',
					lang: 'PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_APN_NAME',
					input: true,
					inputstr: '(ims)',
					data: ''
				},{
					str: 'Connection Type',
					lang: 'PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_CONNECTION_TYPE',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					},{
						str: 'IPv6',
						lang: '',
						data: 'IPv6'
					},{
						str: 'IPv4 & IPv6',
						lang: '',
						data: 'IPv4v6'
					}],
					data: ''
				}]
			};
			app.popup_view.apply1 = _this.apply1;
		}
	},
	_list_event: function(v) {
		//console.log('_list_event');
		//console.log(v);
		var _this = this;
		_this.model = new m_USER_APN_DEL();
		_this.eventId = v.id;
		var model = _this.collection.at(v.id);
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			var res = _this.model.set({ delete: model.attributes.name });
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model){
						model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}
			}, 8000);
		}else if(v.type === 'edit'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SETTINGS_CELLULAR_APN();
			app.popup_view.model.set({
				id: 3000,
				title: getHTMLString('POPUP_EDIT_USER_APN'), //Edit User APN
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'APN Status',
					lang: 'PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_APN_STATUS',
					checked: true,
					data: ''
				},{
					str: 'APN Name',
					lang: 'PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_APN_NAME',
					text: ''
				},{
					str: 'Connection Type',
					lang: 'PAGE_SETTINGS_CELLULAR_USER_APNS_LIST_CONNECTION_TYPE',
					text: _this.typeInputStr
				}]
			};
			app.popup_view.apply1 = _this.apply1;
			var attr = _.clone(model.attributes);
			var value;
			if(attr.status.indexOf(",") >= 0){
				value = attr.status.split(',');
				attr.status = value[1];
				user_apn_idx = value[0];
			}
			if(attr.name.indexOf(",") >= 0){
				value = attr.name.split(',');
				attr.name = value[1];
			}
			if(attr.type.indexOf(",") >= 0){
				value = attr.type.split(',');
				attr.type = value[1];
			}
			app.popup_view.modelInput.set(attr);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(data.id === 1000){ //You have reached the limit!
			app._popupViewingClose();
		}
		if(data.id === 2000){ //add
			var model = new m_SETTINGS_CELLULAR_APN();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');;
			var res = model.set(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			model.savePOST(false);
			/*
			if(!_.isEmpty(res.changed)){
				_this.collection.createPOST(false, model);
			}
			*/
			_this.interval = setInterval(function(){
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						_this.collection.fetch();
						clearInterval(_this.interval);
						// setTimeout(function(){
							app._popupViewingClose();
						// }, 3000);
					}
				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 1000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_APN_NAME'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}
		if(data.id === 3000){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				var attr = _.omit(popup_attr, 'id');;
				if(user_apn_idx!=0){
					attr.status = user_apn_idx+','+attr.status;
					attr.name = user_apn_idx+','+attr.name;
					attr.type = user_apn_idx+','+attr.type;
				}
				var res = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
				model.savePOST(false);
				/*
				if(!_.isEmpty(res.changed)){
					_this.collection.createPOST(false, model);
				}
				*/
			}
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_APN_NAME'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}
		if(data.id === 4000){
			// location.reload();
			app._popupViewingClose();
		}
	},
	typeInputStr: function(val) {
		//console.log('typeInputStr');
		if(val === 'IPv4'){
			return 'IPv4';
		}else if(val === 'IPv6'){
			return 'IPv6';
		}else if(val === 'IPv4v6'){
			return 'IPv4 & IPv6';
		}else{
			return val;
		}
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_CELLULAR_CELLULAR_BAND_SELECTION = Backbone.View.extend({
	name: "PAGE_SETTINGS_CELLULAR_CELLULAR_BAND_SELECTION",
	template: ''
	+'<div class="jioH2" langid="PAGE_SETTINGS_CELLULAR_CELLULAR_BAND_SELECTION">Cellular Band Selection</div>'
	+'<div class="v_view"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view: null,
	apply1: {
		0: 'scan_mode',
		1: 'operating_mode',
		2: 'band',
		3: 'bid'
	},
	set1: {
		arr: [{
			str: 'Scan Mode',
			lang: 'PAGE_SETTINGS_CELLULAR_SCAN_MODE',
			dropdown: true,
			visible: false,
			options: [{
				str: 'Full Scan',
				lang: '',
				data: 'nr_arfcn'
			}],
			data: ''
		},{
			str: 'Operating Mode',
			lang: 'PAGE_SETTINGS_CELLULAR_OPERATING_MODE',
			dropdown: true,
			visible: false,
			options: [{
				str: 'SA',
				lang: '',
				data: 'sa'
			}],
			data: ''
		},{
			str: 'Band(s)',
			lang: 'PAGE_SETTINGS_CELLULAR_BANDS',
			dropdown: true,
			visible: false,
			multiple: false,
			options: [{
				str: 'n78',
				lang: '',
				data: 'n78'
			},{
				str: 'n258',
				lang: '',
				data: 'n258'
			}],
			data: ''
		},{}]
	},
	set2: {
		arr: [{
			str: 'Scan Mode',
			lang: 'PAGE_SETTINGS_CELLULAR_SCAN_MODE',
			dropdown: true,
			visible: false,
			options: [{
				str: 'Full Scan',
				lang: '',
				data: 'nr_arfcn'
			}],
			data: ''
		},{
			str: 'Operating Mode',
			lang: 'PAGE_SETTINGS_CELLULAR_OPERATING_MODE',
			dropdown: true,
			visible: false,
			options: [{
				str: 'SA',
				lang: '',
				data: 'sa'
			}],
			data: ''
		},{
			str: 'Band(s)',
			lang: 'PAGE_SETTINGS_CELLULAR_BANDS',
			dropdown: true,
			visible: false,
			multiple: false,
			options: [{
				str: 'n78',
				lang: '',
				data: 'n78'
			}],
			data: ''
		},{}]
	},
	set3: {
		arr: [{
			str: 'Scan Mode',
			lang: 'PAGE_SETTINGS_CELLULAR_SCAN_MODE',
			dropdown: true,
			visible: false,
			options: [{
				str: 'Full Scan',
				lang: '',
				data: 'nr_arfcn'
			}],
			data: ''
		},{
			str: 'Operating Mode',
			lang: 'PAGE_SETTINGS_CELLULAR_OPERATING_MODE',
			dropdown: true,
			visible: false,
			options: [{
				str: 'SA',
				lang: '',
				data: 'sa'
			}],
			data: ''
		},{
			str: 'Band(s)',
			lang: 'PAGE_SETTINGS_CELLULAR_BANDS',
			dropdown: true,
			visible: false,
			multiple: false,
			options: [{
				str: 'n258',
				lang: '',
				data: 'n258'
			}],
			data: ''
		},{}]
	},

	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_CELLULAR_CELLULAR_BAND_SELECTION();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_dropdownSelected', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
		_this.listenTo(_this.v_view.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0;
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		// if(_response){
		// 	//console.log(_response);
		// }
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var res = _this._sChangeViews(_this.model, [JSON.parse(JSON.stringify(_this.set1))], [_this.v_view], [_this.apply1]);
	},
	v_viewModelChange: function() {
		//console.log('v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		var changed = false;
		if(v_attr.arr[i_apply1.scan_mode].data === 'full'){
				_.map(v_attr.arr, function(v, k){
				if(Number(i_apply1.scan_mode) !== Number(k) && !v.disabled){
						v.disabled = true;
						changed = true;
					}
				});
		}else{
				_.map(v_attr.arr, function(v, k){
				if(Number(i_apply1.scan_mode) !== Number(k) && v.disabled){
						v.disabled = false;
						changed = true;
					}
				});
			}
		//11:FR1-ONLY 12:FR2-ONLY 2x:FR1+FR2
		if(v_attr.arr[i_apply1.bid].data.substr(0, 2) === '11'){
			if(v_attr.arr[i_apply1.operating_mode].data === 'nsa'){
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = JSON.parse(JSON.stringify(_this.set2.arr[i_apply1.band].options));
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					changed = true;
				}
			}else if(v_attr.arr[i_apply1.operating_mode].data === 'lte'){
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = _.filter(JSON.parse(JSON.stringify(_this.set2.arr[i_apply1.band].options)), function(v){
					return v.data.indexOf('n') === -1;
				});
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					v_attr.arr[i_apply1.band].data = _.filter(v_attr.arr[i_apply1.band].data.split(','), function(v){
						return v.indexOf('n') === -1;
					}).join(',');
					changed = true;
				}
			}else{
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = _.filter(JSON.parse(JSON.stringify(_this.set2.arr[i_apply1.band].options)), function(v){
					return v.data.indexOf('lte') === -1;
				});
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					v_attr.arr[i_apply1.band].data = _.filter(v_attr.arr[i_apply1.band].data.split(','), function(v){
						return v.indexOf('lte') === -1;
					}).join(',');
					changed = true;
				}
			}
		}else if(v_attr.arr[i_apply1.bid].data.substr(0, 2) === '12'){
			if(v_attr.arr[i_apply1.operating_mode].data === 'nsa'){
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = JSON.parse(JSON.stringify(_this.set3.arr[i_apply1.band].options));
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					changed = true;
				}
			}else if(v_attr.arr[i_apply1.operating_mode].data === 'lte'){
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = _.filter(JSON.parse(JSON.stringify(_this.set3.arr[i_apply1.band].options)), function(v){
					return v.data.indexOf('n') === -1;
				});
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					v_attr.arr[i_apply1.band].data = _.filter(v_attr.arr[i_apply1.band].data.split(','), function(v){
						return v.indexOf('n') === -1;
					}).join(',');
					changed = true;
				}
			}else{
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = _.filter(JSON.parse(JSON.stringify(_this.set3.arr[i_apply1.band].options)), function(v){
					return v.data.indexOf('lte') === -1;
				});
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					v_attr.arr[i_apply1.band].data = _.filter(v_attr.arr[i_apply1.band].data.split(','), function(v){
						return v.indexOf('lte') === -1;
					}).join(',');
					changed = true;
				}
			}
		}else{
			if(v_attr.arr[i_apply1.operating_mode].data === 'nsa'){
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = JSON.parse(JSON.stringify(_this.set1.arr[i_apply1.band].options));
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					changed = true;
				}
			}else if(v_attr.arr[i_apply1.operating_mode].data === 'lte'){
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = _.filter(JSON.parse(JSON.stringify(_this.set1.arr[i_apply1.band].options)), function(v){
					return v.data.indexOf('n') === -1;
				});
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					v_attr.arr[i_apply1.band].data = _.filter(v_attr.arr[i_apply1.band].data.split(','), function(v){
						return v.indexOf('n') === -1;
					}).join(',');
					changed = true;
				}
			}else{
				var bandOptions = v_attr.arr[i_apply1.band].options;
				var targetOptions = _.filter(JSON.parse(JSON.stringify(_this.set1.arr[i_apply1.band].options)), function(v){
					return v.data.indexOf('lte') === -1;
				});
				if(bandOptions.length !== targetOptions.length){
					v_attr.arr[i_apply1.band].options = targetOptions;
					v_attr.arr[i_apply1.band].data = _.filter(v_attr.arr[i_apply1.band].data.split(','), function(v){
						return v.indexOf('lte') === -1;
					}).join(',');
					changed = true;
				}
			}
		}
		//
		if(changed){
			_this.v_view.model.set(v_attr);
			_this.v_view.model.trigger('change');
		}
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		//console.log(_this.model);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
                // TODO :: O322Q.AI1, Modify notification beacuse device need be reboot after changing band
				//app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS_BAND') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_dropdownSelected");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS = Backbone.View.extend({
	name: "PAGE_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS",
	template: ''
	+'<div class="jioH2" langid="PAGE_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS">Default APN Settings</div>'
	+'<div class="v_view"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view: null,
	apply1: {
		//0: 'apn_status',
		/*0: 'apn_name',
		1: 'connection_type'*/
		0: 'apn_network',
		1: 'apn_name',
		2: 'connection_type'
	},
	apply2: {
                0: 'apn_network'
        },
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_CELLULAR_DEFAULT_APN_SETTINGS();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
		_this.listenTo(_this.v_view.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0;
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		// if(_response){
		// 	//console.log(_response);
		// }

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 8000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [/*{
				str: 'APN Status',
				lang: 'PAGE_SETTINGS_CELLULAR_APN_STATUS',
				checked: true,
				disabled: true,
				data: ''
			},*/{
				str: 'APN Network',
				lang: 'PAGE_SETTINGS_CELLULAR_APN_NETWORK',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Automatic',
					lang: 'PAGE_SETTINGS_CELLULAR_AUTOMATIC',
					data: 'auto'
				},{
					str: 'Manual',
					lang: 'PAGE_SETTINGS_CELLULAR_MANUAL',
					data: 'manual'
				}],
				data: ''
			},{
				str: 'APN Name',
				lang: 'PAGE_SETTINGS_CELLULAR_APN_NAME',
				input: true,
				data: ''
			},{
				str: 'Connection Type',
				lang: 'PAGE_SETTINGS_CELLULAR_CONNECTION_TYPE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'IPv4',
					lang: '',
					data: 'IPv4'
				},{
					str: 'IPv6',
					lang: '',
					data: 'IPv6'
				},{
					str: 'IPv4 & IPv6',
					lang: '',
					data: 'IPv4v6'
				}],
				data: ''
			},{
			}]
		};
		var set2 = {
                	arr: [{
                                str: 'APN Network',
                                lang: 'PAGE_SETTINGS_CELLULAR_APN_NETWORK',
                                dropdown: true,
                                visible: false,
                                options: [{
                                        str: 'Automatic',
                                        lang: 'PAGE_SETTINGS_CELLULAR_AUTOMATIC',
                                        data: 'auto'
                                },{
                                        str: 'Manual',
                                        lang: 'PAGE_SETTINGS_CELLULAR_MANUAL',
                                        data: 'manual'
                                }],
                                data: ''
			}
                        ]
                };
		//if( _this.model.get('apn_network') === 'manual'){
			var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
		//}else{
		//	var res = _this._sChangeViews(_this.model, [set2], [_this.v_view], [_this.apply2]);		
		//}
	},
	v_viewModelChange: function() {
		//console.log('v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view.model.attributes);
		var apn_network = v_attr.arr[0].data;
		var changed = false;
		if(apn_network === 'auto'){
			_.map(v_attr.arr, function(v, k){
				if((Number(k) === 1 || Number(k) === 2) && !v.disabled){ //apn_name || connection_type
					v.disabled = true;
					v.hidden = true;
					changed = true;
				}
			});
		}else{
			_.map(v_attr.arr, function(v, k){
				if((Number(k) === 1 || Number(k) === 2) && v.disabled){ //apn_name || connection_type
					v.disabled = false;
					v.hidden = false;
					changed = true;
				}
			});
		}
		if(changed){
			_this.v_view.model.set(v_attr);
			_this.v_view.model.trigger('change');
		}
	},
	getViewModelValue: function(attrName){
		var _this = this;
		
		var viewWanted = _this.v_view;
		var applyWanted = _this.apply1;
				
		var v_attr1 = _.clone(viewWanted.model.attributes);
		var i_apply1 = _.invert(applyWanted);
		
		return v_attr1.arr[i_apply1[attrName]].data;

	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var apn_network = _this.getViewModelValue('apn_network');
		if(apn_network === 'manual'){
			var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		}else{
			var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply2]);
		}
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			}
		}
		this.modelChange();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_CELLULAR_PIN_MANAGEMENT = Backbone.View.extend({
	name: "PAGE_SETTINGS_CELLULAR_PIN_MANAGEMENT",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_CELLULAR_PIN_MANAGEMENT">PIN Management</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	v_view3: null,
	apply1: {
		0: 'pin_status'
	},
	apply2: {
		0: 'pin_code'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_CELLULAR_PIN_MANAGEMENT();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		//if(_response){
			//console.log(_response);
		//}
		_this.model.attributes.pin_code = "";		// for view, remove pin code

		var value;
		var attempt;
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
						_this.model.trigger('change');
						_this.$('.JioErrorLabel').removeClass('JioErrorLabelVisible');
					}else if(_response.indexOf(",") >= 0){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0
						value = _response.split(',');
						attempt = value[1];
						// console.log("is pin error");
						var errorMsgTemplate = getHTMLString('POPUP_SIM_INCORRECT_PIN');
						var errorMsg = errorMsgTemplate.replace('%ATTEMPT_NUM%', attempt);
						_this.v_view3.$('.JioErrorLabel').text(errorMsg).addClass('JioErrorLabelVisible');
						_this.$('.jioInputContainer').addClass('jioInputError');
					}
				}else{
					// NULL
					// console.log(_response);
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var value;
		var set1 = {
			arr: [{
				str: 'PIN Status',
				lang: 'PAGE_SETTINGS_CELLULAR_PIN_STATUS',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'PIN',
				lang: 'PAGE_SETTINGS_CELLULAR_PIN_CODE',
				input: true,
				password: [],
				data: ''
			}]
		};
		
		//for view
		if(_this.v_view3.model.attributes.arr[0]!=undefined){
			value = _this.v_view3.model.attributes.arr[0].data.split(",");
			_this.v_view3.model.attributes.arr[0].data = value[1];
		}
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var value;
		if(_this.v_view3.model.attributes.arr[0].data !== '')
			_this.v_view3.model.attributes.arr[0].data = _this.v_view2.model.attributes.arr[0].data+','+_this.v_view3.model.attributes.arr[0].data;
		
		// console.log(_this.v_view3.model.attributes.arr[0].data);
		var res = _this._sSaveModel(false, _this.model, [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
		// if(_this.model.changed.pin_code != undefined){
		if(_this.model.attributes.pin_code != _this.model._previousAttributes.pin_code){
			model_change_status = 1;
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			// var value = _this.model.attributes.pin_code.split(",");
			// _this.model.attributes.pin_code = value[1];
			// _this.model.trigger('change');
		}
	},
	_popup_apply: function(data){
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_LAN = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_TITLE",
	template: ''
	//+'<div class="jioMobileSection">'
	//+'<div class="jioH2Mobile jioOpen">'
	//+'<span class="jiotext" langid="PAGE_SETTINGS_LAN_OPERATION_MODE">Operation Mode</span>'
	//+'<span class="jioIconOpenDown"></span>'
	//+'</div>'
	//+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide operation_mode"></div>'
	//+'</div>'
	//+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_LAN_INTERNET_PROTOCOL">Internet Protocol</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide internet_protocol"></div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div id="lan_ipv4_static_address_list" class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST">IPv4 Static Address List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide ipv4_static_address_list">'
	+'</div>'
	+'</div>'
        +'<div class="jioContentRowsGap"></div>'
        +'<div class="jioMobileSection">'
        +'<div id="dhcp_lease_reservation_list" class="jioH2Mobile jioOpen">'
        +'<span class="jiotext" langid="PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST">Lease Reservation List</span>'
        +'<span class="jioIconOpenDown"></span>'
        +'</div>'
        +'<div class="jio1SectinGrid jioH2MobileShowHide lease_reservation_list">'
        +'</div>'
        +'</div>'
	+'<div class="jioPageEndinggap"></div>',
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	v_view5: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view1._list_event){
			_this.v_view1._list_event(data);
		}
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
		/*if(_this.v_view3._list_event){
			_this.v_view3._list_event(data);
		}*/
		if(_this.v_view4._list_event){
			_this.v_view4._list_event(data);
		}
		if(_this.v_view5._list_event){
			_this.v_view5._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view1._popup_apply){
			_this.v_view1._popup_apply(data);
		}
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
		/*if(_this.v_view3._popup_apply){
			_this.v_view3._popup_apply(data);
		}*/
		if(_this.v_view4._popup_apply){
			_this.v_view4._popup_apply(data);
		}
		if(_this.v_view5._popup_apply){
			_this.v_view5._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_SETTINGS_LAN_INTERNET_PROTOCOL({ el: Backbone.$('.internet_protocol', _this.$el) });
		if(hidden_dhcp == 0){
			_this.v_view2 = new PAGE_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST({ el: Backbone.$('.ipv4_static_address_list', _this.$el) });
		}else{
            document.getElementById('lan_ipv4_static_address_list').style.display='none';
            document.getElementById('dhcp_lease_reservation_list').style.display='none';
        }
		//_this.v_view3 = new PAGE_SETTINGS_LAN_OPERATION_MODE({ el: Backbone.$('.operation_mode', _this.$el) });
		_this.v_view4 = new PAGE_SETTINGS_PERIODIC_RA({ el: Backbone.$('.periodic_ra', _this.$el) });
		if(hidden_dhcp == 0){
			_this.v_view5 = new PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST({ el: Backbone.$('.lease_reservation_list', _this.$el) });
		}
	}
});

var timeout_id;
var PAGE_SETTINGS_LAN_INTERNET_PROTOCOL = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_INTERNET_PROTOCOL",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_LAN_INTERNET_PROTOCOL">Internet Protocol</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div>'
	+'</div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	b_viewReady: false,
	apply1: {
		//0: 'host_name',
		0: 'host_ipaddr_type',
		1: 'host_ipaddr',
		2: 'host_subnet_mask',
		//4: 'mtu'
	},
	apply2: {
                0: 'dhcp_enable',
                1: 'start_ipaddr',
                2: 'end_ipaddr',
                3: 'primary_dns',
                4: 'secondary_dns',
                5: 'lease_time',
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_LAN_INTERNET_PROTOCOL();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.$el.on('_dropdownlia', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		// if(_response){
			//console.log(_response);
		// }

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						clearInterval(timeout_id);
						model_change_status = 0;
					}
				}
			}, 2000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [/*{
				str: 'Operation Mode',
				lang: 'PAGE_SETTINGS_LAN_OPERATION_MODE',
				dropdown: true,
				options: [{
					str: 'Router',
					lang: '',
					data: '0'
				},{
					str: 'Bridge',
					lang: '',
					data: '1'
				}],
				data: ''
			},{
				str: 'Host Name',
				lang: 'PAGE_SETTINGS_LAN_HOST_NAME',
				input: true,
				data: ''
			},{
				str: 'Host IP Address Type',
				lang: 'PAGE_SETTINGS_LAN_HOST_IPADDR_TYPE',
				dropdown: true,
				options: [{
					str: 'Class C (192 - 223)',
					lang: '',
					data: 'c'
				}],
				data: ''
			},{
				str: 'Host Name',
				lang: 'PAGE_STATUS_NETWORK_HOST_NAME',
				text: _this.model.get('host_name'),
				data: ''
			},*/{
				str: 'Host IP Address Type',
				lang: 'PAGE_SETTINGS_LAN_HOST_IPADDR_TYPE',
				dropdown: true,
				options: [{
					str: 'Class A',
					lang: '',
					data: 'a'
				},{
					str: 'Class B',
					lang: '',
					data: 'b'
				},{
					str: 'Class C',
					lang: '',
					data: 'c'
				}],
				data: ''
			},{
				str: 'Host IP Address',
				lang: 'PAGE_SETTINGS_LAN_HOST_IPADDR',
				input: true,
				data: ''
			},{
				str: 'Host Subnet Mask',
				lang: 'PAGE_SETTINGS_LAN_HOST_SUBNET_MASK',
				input: true,
				data: ''
			}/*,{
				str: 'MTU',
				lang: 'PAGE_SETTINGS_LAN_MTU',
				input: true,
				inputstr: '(1280 - 1500)',
				data: ''
			}*/]
		};
		var set2 = {
			arr: [/*{
				str: 'Host Subnet Mask Type',
				lang: 'PAGE_SETTINGS_LAN_HOST_SUBNET_MASK_TYPE',
				dropdown: true,
				options: [{
					str: 'Class A',
					lang: '',
					data: 'a'
				}],
				data: ''
			},*/{
                                str: 'DHCP Server',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_SERVER',
                                checked: true,
                                data: ''
                        },{
                                str: 'Starting IP Address',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_STARTING_IP_ADDRESS',
                                input: true,
                                data: ''
                        },{
                                str: 'Ending IP Address',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_ENDING_IP_ADDRESS',
                                input: true,
                                data: ''
                        },/*{
                                str: 'Subnet Mask',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_SUBNET_MASK',
                                input: true,
                                data: ''
                        },*/{
                                str: 'Primary DNS',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_PRIMARY_DNS',
                                input: true,
                                data: ''
                        },{
                                str: 'Secondary DNS',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_SECONDARY_DNS',
                                input: true,
                                data: ''
                        },{
                                str: 'Lease time',
                                lang: 'PAGE_SETTINGS_DHCP_SERVER_LEASE_TIME',
                                input: true,
                                data: ''
                        },{
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		_this.b_viewReady = true;
	},
	v_viewModelChange: function() {
		var _this = this;
		var v_attr = _.clone(_this.v_view2.model.attributes);
		var i_apply = _.invert(_this.apply2);
		
		var changed = false;
		if(hidden_dhcp == 0){
			_.map(v_attr.arr, function(v, k){
				if(v.disabled){
					v.disabled = false;
					changed = true;
				}
			});
		}else{
			_.map(v_attr.arr, function(v, k){
				if(!v.disabled){
					v.disabled = true;
					changed = true;
				}
			});
		}
		if(changed){
			//console.log(v_attr);
			_this.v_view2.model.set(v_attr);
			_this.v_view2.model.trigger('change');
		}
		if (_this.b_viewReady){
		
		  if(v_attr.arr[i_apply.dhcp_enable].data === '0'){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('PAGE_SETTINGS_LAN_2'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		  }else{

		  }
		}
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS_MANAIP') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var ip_static_len;
var PAGE_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	// +'<div class="jioTableHeading">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST">IPv4 Static Address List</div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton"></div>'
	+'<div class="jioH2 jioClickButton" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1"></table>'
	+'</div>',
	collection: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	eventId: 0,
	apply1: {
		0: 'device_name',
		1: 'ipaddr',
		2: 'macaddr'
	},
	apply2: {
		0: 'device_name',
		1: 'ipaddr'
	},
	set1: {
		arr: [{
			str: 'Device Name',
			lang: 'PAGE_SETTINGS_LAN_DEVICE_NAME',
			input: true,
			data: ''
		},{
			str: 'IP Address',
			lang: 'PAGE_SETTINGS_LAN_IPADDR',
			input: true,
			data: ''
		},{
			str: 'MAC Address',
			lang: 'PAGE_SETTINGS_LAN_MACADDR',
			input: true,
			data: ''
		}]
	},
	set2: {
		arr: [{
			str: 'Device Name',
			lang: 'PAGE_SETTINGS_LAN_DEVICE_NAME',
			input: true,
			data: ''
		},{
			str: 'IP Address',
			lang: 'PAGE_SETTINGS_LAN_IPADDR',
			input: true,
			data: ''
		}]
	},
	events: {
		'click .jioClickButton': 'jioClickButton'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LISTS();
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el), parent: _this });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_SETTINGS_LAN_DEVICE_NAME",
			str: "Device Name"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_LAN_IPADDR",
			str: "IP Address"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_LAN_MACADDR",
			str: "MAC Address"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			
			if(val.device_name.indexOf(",") >= 0){
				value = val.device_name.split(',');
				val.device_name = value[1];
			}
			if(val.ipaddr.indexOf(",") >= 0){
				value = val.ipaddr.split(',');
				val.ipaddr = value[1];
			}
			if(val.macaddr.indexOf(",") >= 0){
				value = val.macaddr.split(',');
				val.macaddr = value[1];
			}

			lists.push([
				{
					str: val.device_name
				},{
					str: val.ipaddr
				},{
					str: val.macaddr
				},{
					id: key,
					btn: [{
						type: 'more'
					}, {
						type: 'edit'
					}, {
						type: 'del'
					}]
				}
			]);
		});
		ip_static_len = c_lists.length;
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	jioClickButton: function() {
		//console.log('jioClickButton');
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 4000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_IPV4_STATIC'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST();
			app.popup_view.model.set({
				id: 2000,
				title: getHTMLString('POPUP_ADD_NEW_IPV4_STATIC_ADDRESS'), //Add New IPv4 Static Address
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.set1));
			app.popup_view.apply1 = _this.apply1;
		}
	},
	_list_event: function(v) {
		//console.log('_list_event');
		//console.log(v);
		var _this = this;
		_this.model = new m_DHCP_CLIENT_DEL();
		_this.eventId = v.id;
		var model = _this.collection.at(v.id);
		var value;
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			if(model.attributes.ipaddr.indexOf(",") >= 0){
				value = model.attributes.ipaddr.split(',');
				model.attributes.ipaddr = value[1];
			}
			var res = _this.model.set({ delete_client: model.attributes.ipaddr });
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if (model) {
						model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}
			}, 5000);
		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST();
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_IPV4_STATIC_ADDRESS_DETAILS') //IPv4 Static Address Details
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Device Name',
					lang: 'PAGE_SETTINGS_LAN_DEVICE_NAME',
					text: ''
				},{
					str: 'IP Address',
					lang: 'PAGE_SETTINGS_LAN_IPADDR',
					text: ''
				},{
					str: 'Host Subnet Mask',
					lang: 'PAGE_SETTINGS_LAN_HOST_SUBNET_MASK',
					text: ''
				},{
					str: 'MAC Address',
					lang: 'PAGE_SETTINGS_LAN_MACADDR',
					text: ''
				},{
					str: 'Connection Type',
					lang: 'PAGE_SETTINGS_CELLULAR_CONNECTION_TYPE',
					text: _this.typeInputStr
				}]
			};
			app.popup_view.apply1 = {
				0: 'device_name',
				1: 'ipaddr',
				2: 'host_subnet_mask',
				3: 'macaddr',
				4: 'type'
			};
			var attr = _.clone(model.attributes);
			app.popup_view.modelInput.set(attr);
		}else if(v.type === 'edit'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST();
			app.popup_view.model.set({
				id: 3000,
				title: getHTMLString('POPUP_EDIT_IPV4_STATIC_ADDRESS'), //Edit IPv4 Static Address
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.set2));
			app.popup_view.apply1 = _this.apply2;
			var attr = _.clone(model.attributes);
			var value;
			if(attr.device_name.indexOf(",") >= 0){
				value = attr.device_name.split(',');
				attr.device_name = value[1];
			}
			if(attr.ipaddr.indexOf(",") >= 0){
				value = attr.ipaddr.split(',');
				attr.ipaddr = value[1];
			}
			if(attr.macaddr.indexOf(",") >= 0){
				value = attr.macaddr.split(',');
				attr.macaddr = value[1];
			}
			app.popup_view.modelInput.set(attr);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(data.id === 2000){ //add
			var model = new m_SETTINGS_LAN_IPV4_STATIC_ADDRESS_LIST();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			popup_attr.device_name = popup_attr.macaddr+','+popup_attr.device_name;
			popup_attr.ipaddr = popup_attr.macaddr+','+popup_attr.ipaddr;
			var attr = _.omit(popup_attr, 'id');
			var res = model.set(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			/*
			if(!_.isEmpty(res.changed)){
				_this.collection.createPOST(false, model);
			}
			*/
			model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						_this.collection.fetch();
						clearInterval(_this.interval);
						app._popupViewingClose();
					}					
				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString('INVALID_SETTINGS'),
						info: getHTMLString('PLEASE_CHECK_THE_SETTINGS') +'<br>'+getHTMLString('PLEASE_CHECK_THE_SETTINGS_2'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 3000);
		}
		if(data.id === 3000){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				popup_attr.device_name = popup_attr.macaddr+','+popup_attr.device_name;
				popup_attr.ipaddr = popup_attr.macaddr+','+popup_attr.ipaddr;
				popup_attr.macaddr = popup_attr.macaddr;
				var attr = _.omit(popup_attr, 'id');;
				var res = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				model.savePOST(false);
			}
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else{
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('INVALID_SETTINGS'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}
		if(data.id === 4000){
			app._popupViewingClose();
		}
	},
	typeInputStr: function(val) {
		//console.log('typeInputStr');
		if(val === 'ethernet'){
			return 'Ethernet';
		}else{
			return val;
		}
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_CELLULAR_CELL_LOCK = Backbone.View.extend({
	name: "PAGE_SETTINGS_CELLULAR_CELL_LOCK",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_CELLULAR_CELL_LOCK">Cell Lock</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	apply1: {
		0: 'cell_lock_enable',
	},
	apply2: {
		0: 'cell_lock_pci',
		1: 'cell_lock_arfcn',
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_CELL_LOCK();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_viewModelChange);
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		// if(_response){
		// 	//console.log(_response);
		// }

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 8000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var value;
		var set1 = {
			arr: [{
				str: 'Cell Lock Enable',
				lang: 'PAGE_SETTINGS_CELLULAR_CELL_LOCK_ENABLE',
				checked: true,
				data: ''
			}]
        };
		var set2 = {
			arr: [{
				str: 'PCI',
				lang: 'PAGE_SETTINGS_CELLULAR_CELL_LOCK_PCI',
				input: true,
				data: ''
			},{
				str: 'Arfcn',
				lang: 'PAGE_SETTINGS_CELLULAR_CELL_LOCK_ARFCN',
				input: true,
				data: ''
			}]
		};
		
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES:v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view1.model.attributes);
		var v_attr2 = _.clone(_this.v_view2.model.attributes);
		var CellLockEnbable = v_attr.arr[0].data;
		var changed = false;
		if(CellLockEnbable === '1'){
			_.map(v_attr2.arr, function(v, k){
				if(v.disabled){
					v.disabled = false;
					changed = true;
				}
			});
		}else{
			_.map(v_attr2.arr, function(v, k){
				if(!v.disabled){
					v.disabled = true;
					changed = true;
				}
			});
		}
		if(changed){
			//console.log(v_attr);
			_this.v_view2.model.set(v_attr2);
			_this.v_view2.model.trigger('change');
		}
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var value;
		
		// console.log(_this.v_view3.model.attributes.arr[0].data);
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS_MANAIP') });
				setTimeout(function(){
					app._sysLogout();
				}, 120000);	
			}
		}
	},
	_popup_apply: function(data){
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var v1_show=1;
var v2_show=1;
var PAGE_SETTINGS_LAN_OPERATION_MODE = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_OPERATION_MODE",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_LAN_1">LAN</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view3"></div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view4"></div>'
	+'</div>'
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_LAN_OPERATION_MODE">Operation Mode</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	apply1: {
		0: 'mode',
		1: 'mac_addr_type'
	},
	apply2: {
		0: 'enter_mac'
	},
	apply3: {
		0: 'host_name'
	},
	apply4: {
		0: 'mtu'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_LAN_OPERATION_MODE();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.$el.on('_dropdownlia', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.v_view4 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view4', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_viewModelChange);
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						clearInterval(timeout_id);
						model_change_status = 0;
					}
					if(_response == -1){
						app._popupViewingClose();
						clearInterval(_this.interval);
						clearInterval(timeout_id);
						model_change_status = 0;
						app._popupViewing(POPUP_CONFIRM_WITH_FOOTER_TEMPLATE);
						app.popup_view.model.set({
							id: 1000,
							title: getHTMLString('POPUP_ERROR_MESSAGE'), //Error Message
							info: '',
							warn: getHTMLString('POPUP_LAN_MODE_CHANGE_FAILED'), //LAN mode change failed.
							footer: getHTMLString('POPUP_LAN_MODE_CHANGE_FAILED_FOOTER'), //If front-end receives any error from the back-end within 60 seconds,<br>will show above error pop-up, otherwise device will reboot to apply LAN mode changes.
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 2000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Mode',
				lang: 'PAGE_STATUS_LAN_MODE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Router',
					lang: '',
					data: '0'
				},{
					str: 'Bridge',
					lang: '',
					data: '1'
				},{
					str: 'EoGRE',
					lang: '',
					data: '2' 
				}],
				data: ''
			},{
				str: 'MAC Address',
				lang: 'PAGE_SETTINGS_LAN_MACADDR',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Auto',
					lang: '',
					data: '1'
				},{
					str: 'Enter MAC Address',
					lang: '',
					data: '0'
				}],
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Enter MAC Address',
				lang: 'PAGE_SETTINGS_LAN_ENTER_MACADDR',
				input: true,
				visible: false,
				data: ''
			}]
		};
		var set3 = {
			arr: [{
				str: 'Host Name',
				lang: 'PAGE_STATUS_NETWORK_HOST_NAME',
				text: _this.model.get('host_name'),
				data: ''
			}]
		};
		var set4 = {
			arr: [{
				str: 'MTU',
				lang: 'PAGE_SETTINGS_LAN_MTU',
				input: true,
				inputstr: '(1280 - 1500)',
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2, set3, set4], [_this.v_view1, _this.v_view2, _this.v_view3, _this.v_view4], [_this.apply1, _this.apply2, _this.apply3, _this.apply4]);
	},
	v_viewModelChange: function() {
		//console.log('v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view1.model.attributes);
		var v_attr2 = _.clone(_this.v_view2.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		var i_apply2 = _.invert(_this.apply2);
		var changed = false;
		if(v_attr.arr[i_apply1.mode].data === '0' || v_attr.arr[i_apply1.mode].data === '2'){
			_.map(v_attr.arr, function(v, k){
				if(Number(i_apply1.mode) !== Number(k) && !v.disabled){
					v.disabled = true;
					changed = true;
				}
			});
			_.map(v_attr2.arr, function(v, k){
				if(!v.disabled){
					v.disabled = true;
					changed = true;
				}
			});
		}else{
			//console.log(v_attr2.arr);
			if(v_attr.arr.length !== 0){
				_.map(v_attr.arr, function(v, k){
					if(v.str == 'MAC Address' && v.disabled){
						v.disabled = false;
						changed = true;
					}
				});
				if(v_attr.arr[i_apply1.mac_addr_type].data === '1'){
					_.map(v_attr2.arr, function(v, k){
						//console.log(v);
						//console.log(k);
						if(v.str == 'Enter MAC Address' && !v.disabled){
							v.disabled = true;
							changed = true;
						}
					});
				}else{
					_.map(v_attr2.arr, function(v, k){
						if(v.str == 'Enter MAC Address' && v.disabled){
							v.disabled = false;
							changed = true;
						}
					});
				}
			}
		}
		if(changed){
			_this.v_view1.model.set(v_attr);
			_this.v_view1.model.trigger('change');
			_this.v_view2.model.set(v_attr2);
			_this.v_view2.model.trigger('change');
		}
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2, _this.v_view3, _this.v_view4], [_this.apply1, _this.apply2, _this.apply3, _this.apply4]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS_MANAIP') });
				setTimeout(function(){
					app._sysLogout();
				}, 120000);	
			}
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(data.id === 1000){
			app._popupViewingClose();
			_this.model.fetchOLDJSON();
			_this.model.trigger('change');
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_PERIODIC_RA = Backbone.View.extend({
	name: "PAGE_SETTINGS_PERIODIC_RA",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_PERIODIC_RA">Periodic RA</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div class="jioNote_forRA">'
	+'<span class="jioFontWeightBold" langid="MAIN_NOTE_HEAD">Note:</span>'
	+'<span langid="PAGE_PERIODIC_RA_NOTE">This function will start working when the IPv6 PDN connection is established.</span>'
	+'</div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	apply1: {
		0: 'enable',
	},
	apply2: {
		0: 'interval'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_PERIODIC_RA();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.$el.on('_dropdownlia', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 2000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Status',
				lang: 'PAGE_SETTINGS_PERIODIC_RA_STATUS',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Interval',
				lang: 'PAGE_SETTINGS_PERIODIC_RA_INTERVAL',
				dropdown: true,
				visible: false,
				options: [{
					str: '30',
					lang: '',
					data: '30'
				},{
					str: '60',
					lang: '',
					data: '60'
				},{
					str: '90',
					lang: '',
					data: '90'
				},{
					str: '120',
					lang: '',
					data: '120'
				},{
					str: '150',
					lang: '',
					data: '150'
				},{
					str: '180',
					lang: '',
					data: '180'
				}],
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_SETTINGS_DHCP_SERVER = Backbone.View.extend({
	name: "PAGE_SETTINGS_DHCP_SERVER_TITLE",
	template: ''
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_DHCP_SERVER_DHCP_SERVER">DHCP Server</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide dhcp_server"></div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST">Lease Reservation List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide lease_reservation_list">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>',
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view1._list_event){
			_this.v_view1._list_event(data);
		}
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view1._popup_apply){
			_this.v_view1._popup_apply(data);
		}
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_SETTINGS_DHCP_SERVER_DHCP_SERVER({ el: Backbone.$('.dhcp_server', _this.$el) });
		_this.v_view2 = new PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST({ el: Backbone.$('.lease_reservation_list', _this.$el) });
	}
});

var PAGE_SETTINGS_DHCP_SERVER_DHCP_SERVER = Backbone.View.extend({
	name: "PAGE_SETTINGS_DHCP_SERVER_DHCP_SERVER",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_DHCP_SERVER_DHCP_SERVER">DHCP Server</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	apply1: {
		0: 'dhcp_enable',
		1: 'start_ipaddr',
		2: 'end_ipaddr'
	},
	apply2: {
		0: 'subnet_mask',
		// 1: 'primary_dns',
		// 2: 'secondary_dns',
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_DHCP_SERVER_DHCP_SERVER();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		// if(_response){
			//console.log(_response);
		// }

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						clearInterval(_this.interval);
						model_change_status = 0;
						setTimeout(function(){location.reload()}, 3000);
					}
				}
			}, 8000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Server',
				lang: 'PAGE_SETTINGS_DHCP_SERVER_SERVER',
				checked: true,
				data: ''
			},{
				str: 'Starting IP Address',
				lang: 'PAGE_SETTINGS_DHCP_SERVER_STARTING_IP_ADDRESS',
				input: true,
				data: ''
			},{
				str: 'Ending IP Address',
				lang: 'PAGE_SETTINGS_DHCP_SERVER_ENDING_IP_ADDRESS',
				input: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Subnet Mask',
				lang: 'PAGE_SETTINGS_DHCP_SERVER_SUBNET_MASK',
				input: true,
				data: ''
			},/*{
				str: 'Primary DNS',
				lang: 'PAGE_SETTINGS_DHCP_SERVER_PRIMARY_DNS',
				input: true,
				data: ''
			},{
				str: 'Secondary DNS',
				lang: 'PAGE_SETTINGS_DHCP_SERVER_SECONDARY_DNS',
				input: true,
				data: ''
			},*/{
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS_LAN') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST = Backbone.View.extend({
	name: "PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST",
	template: ''
	+'<div class="jioTableSection">'
	+'<div class="jioTableHeading">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST">Lease Reservation List</div>'
	+'<div></div>'
	+'<div></div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1"></table>'
	+'</div>',
	collection: null,
	v_view1: null,
	eventId: 0,
	events: {
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el), parent: _this });
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_SETTINGS_DHCP_SERVER_CLIENT_HOST_NAME",
			str: "Client Host Name"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_LAN_IPADDR",
			str: "IP Address"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_LAN_MACADDR",
			str: "MAC Address"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_DHCP_SERVER_STATUS",
			str: "Status"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		_.map(c_lists, function (val, key) {
			lists.push([
				{
					str: val.host_name
				},{
					str: val.ipaddr
				},{
					str: val.macaddr
				},{
					str: _this.statusInputStr(val.status)
				},{
					id: key,
					btn: [{
						type: 'more1'
					}]
				}
			]);
		});
		_this.v_view1.model.set({ head: head, lists: lists });
	},
	_list_event: function(v) {
		//console.log('_list_event');
		//console.log(v);
		var _this = this;
		_this.eventId = v.id;
		var model = _this.collection.at(v.id);
		if(v.type === 'del'){
		//	app._popupViewing(POPUP_CONFIRM_TEMPLATE);
		//	app.popup_view.model.set({
		//		id: 1000,
		//		title: getHTMLString('POPUP_DELETE_RECORD'), //Delete Record!
		//		info: getHTMLString('POPUP_DELETE_RECORD_INFO'), //Are you sure?<br>Do you want to delete "DHCP Lease Reservation".
		//		warn: '',
		//		btn: getHTMLString('MAIN_BTN_DELETE') //Delete
		//	});
		}else if(v.type === 'more1'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SETTINGS_DHCP_SERVER_LEASE_RESERVATION_LIST();
			app.popup_view.model.set({
				id: 0,
				title: getHTMLString('PAGE_SETTINGS_DHCP_SERVER_DHCP_CLIENT_DETAILS') //DHCP Client Details
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Client Host Name',
					lang: 'PAGE_SETTINGS_DHCP_SERVER_CLIENT_HOST_NAME',
					text: ''
				},{
					str: 'IP Address',
					lang: 'PAGE_SETTINGS_LAN_IPADDR',
					text: ''
				},{
					str: 'MAC Address',
					lang: 'PAGE_SETTINGS_LAN_MACADDR',
					text: ''
				},{
					str: 'Status',
					lang: 'PAGE_SETTINGS_DHCP_SERVER_STATUS',
					text: _this.statusInputStr
				}/*,{
					str: 'Support Type',
					lang: 'PAGE_SETTINGS_DHCP_SERVER_SUPPORT_TYPE',
					text: _this.typeInputStr
				}*/,{
					str: 'Description',
					lang: 'PAGE_SETTINGS_DHCP_SERVER_DESCRIPTION',
					text: ''
				}]
			};
			app.popup_view.apply1 = {
				0: 'host_name',
				1: 'ipaddr',
				2: 'macaddr',
				3: 'status',
				// 4: 'support_type',
				4: 'description'
			};
			var attr = _.clone(model.attributes);
			app.popup_view.modelInput.set(attr);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		_this.model = new m_DHCP_CLIENT_DEL();
		if(data.id === 1000){ //delete
			var model = _this.collection.at(_this.eventId);
			if(model){
				model.destroyPOST(false);
				_this.collection.trigger('sync');
			}
			app._popupViewingClose();
			_this.model.set({ delete_client: model.attributes.ipaddr });
			_this.model.savePOST(false);
		}
	},
	statusInputStr: function(val) {
		//console.log('statusInputStr');
		if(val === '1'){
			return 'Connected';
		}else{
			return 'Not Connected';
		}
	},
	typeInputStr: function(val) {
		//console.log('typeInputStr');
		if(val === 'both'){
			return 'Both (DHCP & BOOTP)';
		}else{
			return val;
		}
	},
	render: function() {
		//console.log('render');
	}
});

/*
var PAGE_SETTINGS_ALG = Backbone.View.extend({
	name: "PAGE_SETTINGS_ALG_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_ALG_SERVICES">ALG Services</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide PAGE_ALG_SERVICES">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	events: {
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
		_this.render();
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_ALG_SERVICES({ el: Backbone.$('.PAGE_ALG_SERVICES', _this.$el) });	
	}
});
*/

var PAGE_SETTINGS_FIREWALL = Backbone.View.extend({
	name: "PAGE_SETTINGS_FIREWALL_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide PAGE_FIREWALL_SERVICES">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
    ,
	v_view1: null,
	events: {
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.render();
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view1._popup_apply){
			_this.v_view1._popup_apply(data);
		}
	},
	_popup_close: function(data){
		//console.log('_popup_close');
		//console.log(data);
		var _this = this;
		if(_this.v_view1._popup_close){
			_this.v_view1._popup_close(data);
		}else{
			app._popupViewingClose();
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new FIREWALL_FIREWALL({ el: Backbone.$('.PAGE_FIREWALL_SERVICES', _this.$el) });	
	}
});

var PAGE_ADMIN_USER_MANAGEMENT = Backbone.View.extend({
	name: "PAGE_ADMIN_USER_MANAGEMENT_TITLE",
	template: "",
	model: null,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile",
		'click .btn_restore': 'btn_restore',
		'click .btn_reboot': 'btn_reboot'
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		if(_this.template === ""){
			Backbone.$.get('templates/jioUsermanagement.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.render();
			});
		}
	},
	btn_restore: function() {
		//console.log('btn_restore');
		app._popupViewing(POPUP_CONFIRM_TEMPLATE);
		app.popup_view.model.set({
			id: 1000,
			title: getHTMLString('POPUP_RESTORE_CONFIRMATION_TITLE'), //Restore Confirmation
			info: getHTMLString('POPUP_RESTORE_CONFIRMATION_INFO'), //Are you sure?<br>Do you want to restore the device.
			warn: getHTMLString('POPUP_RESTORE_CONFIRMATION_WARN'), //Warning: This option resets the device to factory default.<br>Current configuration will be erased.
			btn: getHTMLString('MAIN_BTN_RESTORE') //Restore
		});
	},
	btn_reboot: function() {
		//console.log('btn_reboot');
		app._popupViewing(POPUP_CONFIRM_TEMPLATE);
		app.popup_view.model.set({
			id: 2000,
			title: getHTMLString('POPUP_REBOOT_CONFIRMATION_TITLE'), //Reboot Confirmation
			info: getHTMLString('POPUP_REBOOT_CONFIRMATION_INFO'), //Are you sure?<br>Do you want to reboot the device.
			warn: getHTMLString('POPUP_REBOOT_CONFIRMATION_WARN'), //Warning: All current sessions will be closed.<br>Device will be down for about 90-150 seconds.
			btn: getHTMLString('MAIN_BTN_REBOOT') //Reboot
		});
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data.id);
		var _this = this;
		_this.model = new m_ADMIN_SYSTEM_MANAGEMENT();
		if(data.id === 1000){ //restore
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_RESTORING') });//Restoring, please wait.
			// _this.model.set({ restore: '1' });
			_this.model.set({ factory_reset: '1' });
			_this.model.savePOST(false);
			setTimeout(function(){
				app._sysLogout();
			}, 90000);
		}
		if(data.id === 2000){ //reboot
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_REBOOTING') });//Rebooting, please wait.
			_this.model.set({ reboot: '1' });
			_this.model.savePOST(false);
			setTimeout(function(){
				app._sysLogout();
			}, 80000);

		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_ADMIN_ACCOUNT_MANAGEMENT({ el: Backbone.$('#account_management', _this.$el) });
		_this.v_view2 = new PAGE_ADMIN_DEVICE_MANAGEMENT({ el: Backbone.$('.device_management', _this.$el) });
		_this.v_view3 = new PAGE_ADMIN_USER_MANAGEMENT_CONNECTION_ADDR_NETWORK_HEALTH_MTR({ el: Backbone.$('.connaddr_netmtr', _this.$el) });	
		_this.v_view4 = new PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS({ el: Backbone.$('.auto_reboot_settings', _this.$el) });	
	}
});

var PAGE_ADMIN_ACCOUNT_MANAGEMENT = Backbone.View.extend({
	name: "PAGE_ADMIN_ACCOUNT_MANAGEMENT",
	template: "",
	model: null,
	model_pwd_strength: null,
	v_view: null,
	v_view2: null,
	apply1: {
		0: 'username',
		1: 'old_pwd',
		2: 'new_pwd',
		3: 'confirm_new_pwd'
	},
	apply2: {
		0: 'pwd_strength'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_ACCOUNT_MANAGEMENT();
		_this.model_pwd_strength = new m_PWD_STRENGTH();		

	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioAccountmanagement.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
				_this.listenTo(_this.v_view.model, 'change', _this.v_view_ModelChange);
				_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
				_this.model.fetchOLDJSON();
				
				$(_this.$el).data('view', _this);
			});
		}
	},
	modelSync: function() {
		//console.log('modelSync');
		//console.log(this.model);
		var _this = this;
		var _response = _this.model._response || null;
		var v_attr = _.clone(_this.v_view.model.attributes);
		if(_response){
			//console.log(_response);
			if(_response === '1'){
				_this.interval = setInterval(function(){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
					_this.v_view.model.trigger('change');
					window.parent.location = '/login.html';
				}, 8000);

			}else if(_response === '10'){
				app._popupViewingClose();
				_.map(_this.apply1, function(v, k){
					if(v === 'new_pwd' || v === 'confirm_new_pwd' ){
						v_attr.arr[k].error = {
							enable: true,
							str: '',
							lang: 'MAIN_MSG_PASSWORD_USED_RECENTLY'
						};
					}
				});
				_this.v_view.model.set(v_attr);
				_this.v_view.model.trigger('change');

			}else if(_response === '2'){
				app._popupViewingClose();
				_.map(_this.apply1, function(v, k){
					if(v === 'old_pwd'){
						v_attr.arr[k].error = {
							enable: true,
							str: '',
							lang: 'MAIN_MSG_INCORRECT_PASSWORD'
						};
					}
				});
				_this.v_view.model.set(v_attr);
				_this.v_view.model.trigger('change');
			}else {
				app._popupViewingClose();
				_.map(_this.apply1, function(v, k){
					if(v === 'new_pwd' || v === 'confirm_new_pwd' ){
						v_attr.arr[k].error = {
							enable: true,
							str: '',
							lang: 'INVALID_SETTINGS'
						};
					}
				});
				_this.v_view.model.set(v_attr);
				_this.v_view.model.trigger('change');
			}
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		//console.log(this.model);
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Username',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_USERNAME',
				input: true,
				data: ''
			},{
				str: 'Password',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_PWD',
				input: true,
				password: { checked: false },
				data: ''
			},{
				str: 'New Password',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_NEW_PWD',
				input: true,
				password: { checked: false },
				id: 'new_pwd',
				data: ''
			},{
				str: 'Confirm New Password',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_CONFIRM_NEW_PWD',
				input: true,
				password: { checked: false },
				data: ''

			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
		
		var set2 = {
			arr: [{
				str: 'Password Strength',
				lang: 'MAIN_PWD_STRENGTH',
				pwd_strength: true,
				data: 0,
				text0: 'MAIN_PWD_STRENGTH_0',
				text1: 'MAIN_PWD_STRENGTH_1',
				text2: 'MAIN_PWD_STRENGTH_2',
				text3: 'MAIN_PWD_STRENGTH_3',
				text4: 'MAIN_PWD_STRENGTH_4',
				text5: 'MAIN_PWD_STRENGTH_5'
			}]
		};
		var res = _this._sChangeViews(_this.model_pwd_strength, [set2], [_this.v_view2], [_this.apply2]);
	},
	v_view_ModelChange: function() {	
		//console.log('v_view_ModelChange');
		var _this = this;
		
		_this.update_pwd_strength();
	},
	_JioInput_Edit: function(e, v) {
		//console.log('PAGE_ADMIN_ACCOUNT_MANAGEMENT::_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

		const htmlElement = document.getElementById('account_management');
		const _this_backboneView = $(htmlElement).data('view');		
		//console.log(_this_backboneView);
		
		_this_backboneView.update_pwd_strength();

	},
	update_pwd_strength: function(){
		var _this_backboneView = this;
	
		var v_2_1 = _this_backboneView.v_view;
		var apply_2_1 =  _this_backboneView.apply1;
		var v_2_2 = _this_backboneView.v_view2;
				
		var v_attr2_1 = _.clone(v_2_1.model.attributes);
		var i_apply2_1 = _.invert(apply_2_1);
		
		var v_attr2_2 = _.clone(v_2_2.model.attributes);
				
		if (v_attr2_2.arr.length > 0){
		
		  var changed2_2 = false;
		  var changed2_1 = false;
		  
		  //var new_pwd = v_attr2_1.arr[i_apply2_1.new_pwd].data;
		  var new_pwd = Backbone.$('#new_pwd', _this_backboneView.$el).val();
		  var cur_strength = _this_backboneView.model_pwd_strength.calculate_pwd_strength(new_pwd);
		  //console.log(new_pwd, cur_strength);
		  
		  _.map(v_attr2_2.arr, function(v, k){
		  		//console.log(v);
					v.data = cur_strength;
					changed2_2 = true;
		  });
		  
		  if(changed2_2){
			v_2_2.model.set(v_attr2_2);
			v_2_2.model.trigger('change');
		  }
	  }
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		// encode pw before sending
		if(_this.v_view.model.attributes.arr[1].data !== ''){
			_this.v_view.model.attributes.arr[1].data = btoa(_this.v_view.model.attributes.arr[1].data);
		}
		if(_this.v_view.model.attributes.arr[2].data !== ''){
			_this.v_view.model.attributes.arr[2].data = btoa(_this.v_view.model.attributes.arr[2].data);
		}
		if(_this.v_view.model.attributes.arr[3].data !== ''){
			_this.v_view.model.attributes.arr[3].data = btoa(_this.v_view.model.attributes.arr[3].data);
		}
		_this.stopListening(_this.model, 'sync', _this.modelSync);
		_this.stopListening(_this.model, 'change', _this.modelChange);
		var pwd_forbidden = _this.model.get('pwd_forbidden');
		_this.model = new m_ADMIN_ACCOUNT_MANAGEMENT({ pwd_forbidden: pwd_forbidden});
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		
		// decode pw for show on web page
		if(_this.v_view.model.attributes.arr[1].data !== ''){
			_this.v_view.model.attributes.arr[1].data = atob(_this.v_view.model.attributes.arr[1].data);
		}
		if(_this.v_view.model.attributes.arr[2].data !== ''){
			_this.v_view.model.attributes.arr[2].data = atob(_this.v_view.model.attributes.arr[2].data);
		}
		if(_this.v_view.model.attributes.arr[3].data !== ''){
			_this.v_view.model.attributes.arr[3].data = atob(_this.v_view.model.attributes.arr[3].data);
		}
		_this.v_view.model.trigger('change');
		
		// check value change
		if(_this.model.attributes !== _this.model._previousAttributes){
			// console.log('OK');
			model_change_status = 1;
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_UPDATING_PASSWORD') });
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_ADMIN_DEVICE_MANAGEMENT = Backbone.View.extend({
	name: "PAGE_ADMIN_DEVICE_MANAGEMENT",
	template: "",
	model: null,
	v_view: null,
	apply1: {
		0: 'session_timeout',
		1: 'refresh_time',
		2: 'language',
		3: '' 
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_DEVICE_MANAGEMENT();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioDevicemanagement.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		/*
		if(_response){
			//console.log(_response);
		}
		*/
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Session Timeout',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_SESSION_TIMEOUT',
				input: true,
				inputstr: '(1 - 60 Minutes)',
				inputlang: 'PAGE_ADMIN_USER_MANAGEMENT_SESSION_TIMEOUT_DESCRIPTION',
				data: ''
			},{
				str: 'Screen Refresh Time',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_SCREEN_REFRESH_TIME',
				input: true,
				inputstr: '(0/60 - 300 Seconds)',
				inputlang: 'PAGE_ADMIN_USER_MANAGEMENT_SCREEN_REFRESH_TIME_DESCRIPTION',
				data: ''
			},{
				str: 'Language',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_LANGUAGE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'English',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_LANGUAGE_ENGLISH',
					data: 'en'
				}],
				data: ''
			},{
				str: '',
				lang: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});
var g_swUpgrade_isFileUploading = false;
var PAGE_ADMIN_SOFTWARE_UPGRADE = Backbone.View.extend({
	name: "PAGE_ADMIN_SOFTWARE_UPGRADE_TITLE",
	template: "",
	model: null,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	files: {},
	attributes: {},
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile",
		'change .v_view1 input[type="file"]': 'upgradeInput',
		'change .v_view2 input[type="file"]': 'restoreInput',
		'click .btn_upgrade': 'btn_upgrade',
		'click .btn_restore': 'btn_restore',
		'click .btn_backup': 'btn_backup'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_SOFTWARE_UPGRADE();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioSoftwareUpgrade.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
				_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
				_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
				_this.v_view4 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view4', _this.$el) });
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		//console.log(_response);
		if(_response){
			app._popupViewingClose();
			window.parent.location = 'backup.cfg';
			_this.model.set(_this.attributes);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var upgrade_path = _this.renderUpload('upgrade_path', _this.model.get('upgrade_path'));
		var upgrade_size = _this.renderUpload('upgrade_size', _this.model.get('upgrade_size'));
		_this.v_view1.model.set({
			arr: [{
				str: 'Select New Software',
				lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_SELECT_NEW_SOFTWARE',
				error: {
					str: 'Invalid file format or size, select a valid software file.',
					lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_SELECT_ERROR',
					enable: upgrade_path.error || upgrade_size.error
				},
				upload: upgrade_path
			}]
		});
		//
		var restore_path = _this.renderUpload('restore_path', _this.model.get('restore_path'));
		var restore_size = _this.renderUpload('restore_size', _this.model.get('restore_size'));
		_this.v_view2.model.set({
			arr: [{
				str: 'Restore Configuration',
				lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_RESTORE_CONFIGURATION',
				error: {
					str: 'Invalid file format or size, select a valid configuration file.',
					lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_RESTORE_ERROR',
					enable: restore_path.error || restore_size.error
				},
				upload: restore_path
			}]
		});
		//
		_this.v_view3.model.set({
			arr: [{
				str: 'Current Software Version',
				lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_CURRENT_SOFTWARE_VERSION',
				text: _this.model.get('sw_version')
			}]
		});
		_this.v_view4.model.set({
			arr: [{
				str: 'Current Software Date',
				lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_CURRENT_SOFTWARE_DATE',
				text: _this.model.get('sw_date')
			},{}]
		});
	},
	renderUpload: function(str, value) {
		//console.log('renderUpload');
		var _this = this;
		var ret = {
			str: 'Browse & Upload',
			lang: 'PAGE_ADMIN_SOFTWARE_UPGRADE_BROWSE_UPLOAD',
			error: false
		};
		if(value !== ''){
			var tmpModel = new m_ADMIN_SOFTWARE_UPGRADE();
			var res;
			if(str === 'upgrade_path'){
				res = tmpModel.set({ upgrade_path: value });
			}
			if(str === 'restore_path'){
				res = tmpModel.set({ restore_path: value });
			}
			if(str === 'upgrade_size'){
				res = tmpModel.set({ upgrade_size: value });
			}
			if(str === 'restore_size'){
				res = tmpModel.set({ restore_size: value });
			}
			ret.str = value;
			ret.lang = '';
			ret.error = !res.isValid();
			// var ext = ret.str.substring(ret.str.lastIndexOf('.') + 1);
			if(str === 'upgrade_path'){
				if(ret.error){
				// if(ext != "ffw"){
					Backbone.$('.btn_upgrade', _this.$el).prop('disabled', true);
				}else{
					Backbone.$('.btn_upgrade', _this.$el).prop('disabled', false);
				}
			}
			if(str === 'restore_path'){
				if(ret.error){
				// if(ext != "cfg"){
					Backbone.$('.btn_restore', _this.$el).prop('disabled', true);
				}else{
					Backbone.$('.btn_restore', _this.$el).prop('disabled', false);
				}
			}
			if(str === 'upgrade_size'){
				if(ret.error){
				// if(ext != "ffw"){
					Backbone.$('.btn_upgrade', _this.$el).prop('disabled', true);
				}
			}
			if(str === 'restore_size'){
				if(ret.error){
				// if(ext != "cfg"){
					Backbone.$('.btn_restore', _this.$el).prop('disabled', true);
				}
			}

		}
		return ret;
	},
	upgradeInput: function(e) { //upgrade_path
		//console.log('upgradeInput');
		var _this = this;
		_this.files.upgrade =  e.currentTarget.files;
		var name = e.currentTarget.files[0].name;
		var size = e.currentTarget.files[0].size;
		_this.model.set({ upgrade_path: name });
		_this.model.set({ upgrade_size: size });
	},
	restoreInput: function(e) { //restore_path
		//console.log('restoreInput');
		var _this = this;
		_this.files.restore =  e.currentTarget.files;
		var name = e.currentTarget.files[0].name;
		var size = e.currentTarget.files[0].size;
		_this.model.set({ restore_path: name });
		_this.model.set({ restore_size: size });
	},
	btn_upgrade: function(e) {
		//console.log('btn_upgrade');
		var _this = this;
		var attr = _this.model.attributes;
		if(attr.upgrade_path !== ''){
			app._popupViewing(POPUP_SW_UPGRADE);
		}
	},
	btn_restore: function(e) {
		//console.log('btn_restore');
		var _this = this;
		var attr = _this.model.attributes;
		if(attr.restore_path !== ''){
			app._popupViewing(POPUP_SW_RESTORE);
		}
	},
	btn_backup: function(e) {
		//console.log('btn_backup');
		var _this = this;
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
		_this.attributes = _.clone(_this.model.attributes);
		var res = _this.model.set({ backup: '1' });
		if(res.isValid()){
			res.savePOST(false);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		switch(data.name){
			case 'POPUP_SW_UPGRADE':
				if(data.timeup === true){
					/*
					app._popupViewing(POPUP_SW_VERSION);
					upgrade_interval = setInterval(function(){
						upgrade_wait_time = upgrade_wait_time+5;
					}, 5000);
					*/
					// upgrade time > 300 sec
					//alert("Software Upgrade Timeout!");
					app._sysLogout();
				}
				if(data.timeup === false){
					var formData = new FormData();
					var download_millisecond = 0;
					_this.interval = setInterval(function(){
						download_millisecond = download_millisecond + 1000;
					}, 1000);
					formData.append('uploadedfile', _this.files.upgrade[0]);
										
					g_swUpgrade_isFileUploading = true;
					Backbone.$.ajax({ url: 'sercomm_upgrade_cgi?_='+new Date().getTime(), type: 'POST', cache: false, data: formData, processData: false, contentType: false })
					.done(function(res) {
						g_swUpgrade_isFileUploading = false;
						clearInterval(_this.interval);
						if(res.search("pass") == -1){
							//app._popupViewing(POPUP_SW_UPGRADE_FAILED);
							//sw_upgrade_error_code_m = res;
							app._popupViewing(POPUP_CONFIRM_WITH_FOOTER_TEMPLATE);
							app.popup_view.model.set({
								id: 1000,
								title: getHTMLString('POPUP_ERROR_MESSAGE'), //Error Message
								info: '',
								warn: getHTMLString('POPUP_SW_VERSION_NOT_VALID'), //Software version is an older than present version or not valid software. Please use latest and valid software, and try again.
								footer: getHTMLString('POPUP_SW_VERSION_NOT_VALID_FOOTER'), //If front-end receives any error from the back-end within 30 seconds,<br>will show above error pop-up, otherwise device will proceed for "Upgrade Process".
								btn: getHTMLString('MAIN_BTN_OK') //OK
							});
						}else{
							var ret_val = res.split(",");
							new_ver = "SRM_JOD1640_"+ret_val[1].padStart(4,'0');
							var time_str = ret_val[2].split("_");
							let gettimestamp = new Date(Date.parse(time_str[0]+"T"+time_str[1]+"+08:00"));
							var tt = gettimestamp.toLocaleString('en-GB', 
							{timeZone: 'Asia/Calcutta', month: 'long', day: 'numeric', year: 'numeric', 
							hour: '2-digit', minute: '2-digit', second: '2-digit'}
							);	// 18 March 2022, xx:xx:xx
							var tt_val = tt.split(",");
							var dd_val = tt_val[0].split(" ");
							var wait_upgrade_millisecond = 355000 - download_millisecond;
							new_buildtime = dd_val[0]+' '+dd_val[1]+', '+dd_val[2]+' -'+tt_val[1]+' (IST)';
							// app._popupViewing(POPUP_SW_VERSION);	// this page is for online upgrade(not support)
							upgrade_interval = setInterval(function(){
								upgrade_wait_time = upgrade_wait_time+5;
							}, 5000);
							/*setInterval(function(){
								app._sysLogout();
							}, wait_upgrade_millisecond);*/
						}
						//console.log(res);
					}).fail(function(error) {
						//console.log(error);
						//app._popupViewing(POPUP_SW_UPGRADE_FAILED);
						g_swUpgrade_isFileUploading = false;
						app._popupViewing(POPUP_CONFIRM_WITH_FOOTER_TEMPLATE);
						app.popup_view.model.set({
							id: 1000,
							title: getHTMLString('POPUP_ERROR_MESSAGE'), //Error Message
							info: '',
							warn: getHTMLString('POPUP_SW_VERSION_NOT_VALID'), //Software version is an older than present version or not valid software. Please use latest and valid software, and try again.
							footer: getHTMLString('POPUP_SW_VERSION_NOT_VALID_FOOTER'), //If front-end receives any error from the back-end within 30 seconds,<br>will show above error pop-up, otherwise device will proceed for "Upgrade Process".
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					});
				}
				break;
			case 'POPUP_SW_RESTORE':
				if(data.timeup === true){
					app._sysLogout();
				}
				if(data.timeup === false){
					var formData = new FormData();
					formData.append('uploadedfile', _this.files.restore[0]);
					Backbone.$.ajax({ url: 'sercomm_cfgupload_cgi?_='+new Date().getTime(), type: 'POST', cache: false, data: formData, processData: false, contentType: false })
					.done(function(res) {
						//console.log(res);
						if(res.search("Error config") != -1){
							app._popupViewing(POPUP_CONFIRM_TEMPLATE);
							app.popup_view.model.set({
								id: 1000,
								title: getHTMLString('POPUP_ERROR_MESSAGE'),
								info: '',
								warn: getHTMLString('POPUP_SW_RESTORE_FAIL'),
								btn: getHTMLString('MAIN_BTN_OK')
							});
						}
					}).fail(function(error) {
						//console.log(error);
					});
				}
				break;
			case 'POPUP_SW_VERSION':
				app._sysLogout();
				break;
			case 'POPUP_CONFIRM_TEMPLATE':
				app._popupViewingClose();
				break;
		}
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_HELP_ABOUT = Backbone.View.extend({
	name: "PAGE_HELP_ABOUT_TITLE",
	template: "",
	model: null,
	v_jio1NoInput1: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile",
		'click .jioIconDownload': 'jioIconDownload'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_HELP_ABOUT();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioAboutDevice.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_jio1NoInput1 = new TEMP_JIO1SECTION_NOINPUT({ el: Backbone.$('.v_jio1NoInput1', _this.$el) });
				_this.model.fetchOLDJSON();
			});
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		if(_this.template !== ""){
			_this.v_jio1NoInput1.model.set({
				arr: [{
					str: 'Device Name & Model',
					lang: 'PAGE_HELP_ABOUT_DEVICE_NAME_MODEL',
					data: _this.model.get('device_model')
				},{
					str: 'Web UI Version',
					lang: 'PAGE_HELP_ABOUT_WEB_UI_VERSION',
					data: _this.model.get('web_ui_version')
				},{
					str: 'Software Version',
					lang: 'PAGE_HELP_ABOUT_SOFTWARE_VERSION',
					data: _this.model.get('software_version')
				},{
					str: 'Hardware Version',
					lang: 'PAGE_HELP_ABOUT_HARDWARE_VERSION',
					data: _this.model.get('hardware_version')
				},{
					str: 'EID',
					lang: 'PAGE_HELP_ABOUT_EID',
					data: _this.model.get('eid')
				},{
					str: 'IMEI',
					lang: 'PAGE_HELP_ABOUT_IMEI',
					data: _this.model.get('imei')
				},{
					str: 'MAC Address',
					lang: 'PAGE_HELP_ABOUT_MAC_ADDR',
					data: _this.model.get('mac_addr')
				},{
					str: "User's Guide",
					lang: 'PAGE_HELP_ABOUT_USERS_GUIDE',
					icon: "jioIconDownload",
					data: ''
				}]
			});
			//
			Backbone.$('[langid="PAGE_HELP_ABOUT_USERS_GUIDE"]', _this.$el).closest('.jioInputSet').find('.jioLabelInline')
			.attr('langid', 'PAGE_HELP_ABOUT_DOWNLOAD_USERS_GUIDE').text(getHTMLString('PAGE_HELP_ABOUT_DOWNLOAD_USERS_GUIDE'));
			Backbone.$('.jioIcon', _this.$el).addClass('jioClickButton');
			//
		}
	},
	jioIconDownload: function(e) {
		//console.log('jioIconDownload');
		e.preventDefault();
		//e.stopPropagation();
		window.parent.location = 'users_guide.zip';
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_HELP_LOGS = Backbone.View.extend({
	name: "PAGE_HELP_LOGS_TITLE",
	template: "",
	collection: null,
	model: null,
	interval: null,
	v_forJioTableSort: null,
	attributes: {},
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile",
		"click .jioClickButton": "jioClickButton"
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_HELP_LOGS();
		_this.model = new m_HELP_LOG_COLLECT();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		if(_this.template === ""){
			Backbone.$.get('templates/jioLogs.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.v_forJioTableSort = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.forJioTableSort', _this.$el) });
				_this.collection.fetch();
			});
		}
	},
	collectionSync: function() {
		//console.log('collectionSync');
		var _this = this;
		if(_this.template !== ""){
			var head = [{
				sort: true,
				lang: "PAGE_HELP_LOGS_PARAMETERS",
				str: "Parameters"
			},{
				sort: true,
				lang: "PAGE_HELP_LOGS_WAN",
				str: "WAN"
			},{
				sort: true,
				lang: "PAGE_HELP_LOGS_LAN",
				str: "LAN"
			}];
			var lists = [];
			var c_lists = _this.collection.toJSON();
			_.map(c_lists, function (val, key) {
				lists.push([
					{
						str: val.parameters
					},{
						str: val.wan
					},{
						str: val.lan
					}
				]);
			});
			_this.v_forJioTableSort.model.set({ head: head, lists: lists });
		}
	},
    modelSync: function() {
        // console.log('modelSync');
        var _this = this;
        var _response = _this.model._response || null;
        // console.log(_response);
        _this.interval = setInterval(function(){
            if(_response){
                app._popupViewingClose();
                clearInterval(_this.interval);
                // console.log('popupclose');
                window.parent.location = 'system_logs.tgz';
                _this.model.set(_this.attributes);
            }
        }, 3000);
    },
	jioClickButton: function(e) {
		//console.log('jioClickButton');
		e.preventDefault();
		var _this = this;
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
		_this.attributes = _.clone(_this.model.attributes);
		var res = _this.model.set({ Collect_Log: '1' });
		if(res.isValid()){
			res.savePOST(false);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_ACS_SETTINGS = Backbone.View.extend({
	name: "PAGE_ACS_SETTINGS_TITLE",
	template: '',
	v_view1: null,
	v_view2: null,
	popup_view: null,
	modelLogin: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile",
		'click .btn_format': 'btn_format'
	},
	preinitialize: function () {
		var _this = this;
		_this.modelLogin = new m_ACS_LOGIN();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.modelLogin, 'sync', _this.modelLoginSync);
		
	  if(!login_acs){
			app._popupViewing(POPUP_LOGIN_ACS_ENTRY);
			app.popup_view.model.set({
				id: 1000,
			});
	  }else{
		  _this.initPage(false);
	  }
	},
	initPage: function (bRenderView){
		var _this = this;
		if(_this.template === ""){
			Backbone.$.get('templates/jioACSSettings.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.$el.show();
				_this.modelLogin.fetchOLDJSON();
				if (bRenderView){
					_this.render();
				}

			});
		}
	},
	btn_format: function() {
		//console.log('btn_format');
		app._popupViewing(POPUP_CONFIRM_TEMPLATE);
		app.popup_view.model.set({
			id: 2000,
			title: getHTMLString('POPUP_FORMAT_CONFIRMATION_TITLE'), //Reboot Confirmation
			info: getHTMLString('POPUP_FORMAT_CONFIRMATION_INFO'), //Are you sure?<br>Do you want to reboot the device.
			warn: getHTMLString('POPUP_FORMAT_CONFIRMATION_WARN'), //Warning: All current sessions will be closed.<br>Device will be down for about 90-150 seconds.
			btn: getHTMLString('MAIN_BTN_FORMAT_DATA') //Reboot
		});
	},
	modelLoginSync: function() {
		//console.log('modelLoginSync');
		var _this = this;

	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		_this.model = new m_ADMIN_SYSTEM_MANAGEMENT();
		if(data.id === 1000){
			if(login_acs){	//login_acs==1
				app._popupViewingClose();
				_this.initPage(true);
				
			}
		}
		if(data.id === 2000){ //format
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_FORMATING') });//formating, please wait.
			_this.model.set({ format: '1' });
			_this.model.savePOST(false);
			setTimeout(function(){
				app._sysLogout();
			}, 80000);

		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_ACS_SETTINGS_ACS_URL({ el: Backbone.$('.acs_url', _this.$el) });
		// _this.v_view2 = new PAGE_ACS_SETTINGS_TELNET_CONFIGURATION({ el: Backbone.$('.telnet_configuration', _this.$el) });
	}
});

var PAGE_ACS_SETTINGS_ACS_URL = Backbone.View.extend({
	name: "PAGE_ACS_SETTINGS_ACS_URL",
	template: ''
	/*
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_ACS_SETTINGS_ACS_URL">ACS URL</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	*/
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_ACS_SETTINGS_ACS_CONFIGURATION">ACS Configuration</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'<div></div>'
	/*
	+'<div class="jio1SectionWithInput v_view4">'
	+'</div>'
	*/
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	apply1: {
		0: 'acs_url',
		1: 'last_connection'
	},
	/*
	apply2: {
		0: 'last_connection'
	},
	*/
	apply3: {
		0: 'username',
		1: 'password',
		//2: 'periodic_inform_status',
	},
	apply4: {
		0: 'periodic_inform_interval',
		1: 'connection_request_username',
		2: 'connection_request_password',
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ACS_CONFIGURATION();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		// _this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.v_view4 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view4', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		/*
		if(_response){
			//console.log(_response);
		}
		*/
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'ACS URL',
				lang: 'PAGE_ACS_SETTINGS_ACS_URL',
				input: true,
				data: '',
				copy: true
			},{
				str: 'Last Successful ACS Connection',
				lang: 'PAGE_ACS_SETTINGS_LAST_SUCCESSFUL_ACS_CONNECTION',
				text: ''
			}]
		};
		/*
		var set2 = {
			arr: [{
				str: 'Last Successful ACS Connection',
				lang: 'PAGE_ACS_SETTINGS_LAST_SUCCESSFUL_ACS_CONNECTION',
				text: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		*/
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view1], [_this.apply1]);
		var set3 = {
			arr: [{
				str: 'Username',
				lang: 'PAGE_ACS_SETTINGS_USERNAME',
				input: true,
				data: ''
			},{
				str: 'Password',
				lang: 'PAGE_ACS_SETTINGS_PASSWORD',
				input: true,
				password: { checked: false },
				data: ''
			}/*,{
				str: 'Periodic Inform Status',
				lang: 'PAGE_ACS_SETTINGS_PERIODIC_INFORM_STATUS',
				checked: true,
				data: ''
			}*/]
		};
		var set4 = {
			arr: [{
				str: 'Periodic Inform Interval',
				lang: 'PAGE_ACS_SETTINGS_PERIODIC_INFORM_INTERVAL',
				input: true,
				inputstr: '(Seconds)',
				inputlang: 'PAGE_ACS_SETTINGS_PERIODIC_INFORM_INTERVAL_STR',
				data: ''
			},{
				str: 'Connection Request Username',
				lang: 'PAGE_ACS_SETTINGS_CONNECTION_REQUEST_USERNAME',
				input: true,
				data: ''
			},{
				str: 'Connection Request Password',
				lang: 'PAGE_ACS_SETTINGS_CONNECTION_REQUEST_PASSWORD',
				input: true,
				password: { checked: false },
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set3, set4], [_this.v_view3, _this.v_view4], [_this.apply3, _this.apply4]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		// var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2, _this.v_view3, _this.v_view4], [_this.apply1, _this.apply2, _this.apply3, _this.apply4]);
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view3, _this.v_view4], [_this.apply1, _this.apply3, _this.apply4]);
		if(!_.isEmpty(_this.model.changed)){
			model_change_status = 1;
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_ACS_SETTINGS_TELNET_CONFIGURATION = Backbone.View.extend({
	name: "PAGE_ACS_SETTINGS_TELNET_CONFIGURATION",
	template: '',
	// +'<div class="jioContentHeaderContainer_1">'
	// +'<div class="jioH2" langid="PAGE_ACS_SETTINGS_TELNET_CONFIGURATION">Telnet Configuration</div>'
	// +'</div>'
	// +'<div class="jio2SectionGridFor1Section">'
	// +'<div class="jio1SectionWithInput v_view5">'
	// +'</div>'
	// +'</div>'
	// +'<div class="jioInputButton">'
	// +'<div></div>'
	// +'<div>'
	// +'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	// +'</div>'
	// +'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	apply1: {
		0: 'acs_url_status'
	},
	apply2: {
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_TELNET_CONFIGURATION();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._jioOnOffLabel);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view5', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		if(_response){
			//console.log(_response);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'ACS URL Status',
				lang: 'PAGE_ACS_SETTINGS_ACS_URL_STATUS',
				checked: true,
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view1], [_this.apply1]);
	},
	_jioOnOffLabel: function(e, v) {
		//console.log('_jioOnOffLabel');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1], [_this.apply1]);
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_ADMIN_UPNP_PORT_FORWADING = Backbone.View.extend({
	// name: "PAGE_ADMIN_UPNP_PORT_FORWADING_TITLE",
	name: "PAGE_ADMIN_PORT_FORWADING_TITLE",
	template: ''
	+'<div class="jio2SectionGrid">'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_UPNP_UPNP">UPnP</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio2SectionWithInput jioH2MobileShowHide upnp"></div>'
	+'</div>'
	+'<div></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_UPNP_PORT_FORWARDING">Port Forwarding</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio2SectionWithInput jioH2MobileShowHide port_forwarding"></div>'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div id="port_forward_list_title" class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_UPNP_PORT_FORWARDING_LIST">Port Forwarding Rules List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div id="port_forward_list" class="jio1SectinGrid jioH2MobileShowHide port_forwarding_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>',
	v_view1: null,
	v_view2: null,
	v_view3: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._jioOnOffLabel);
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(v) {
		//console.log('_list_event');
		//console.log(v);
		var _this = this;
		if(_this.v_view1._list_event){
			_this.v_view1._list_event(v);
		}
	},
	v_viewModelChange: function(v) {		// 11/01 '21 add this block
		var _this = this;
		//console.log('v_viewModelChange in main view - port forwarding');
		//console.log(_this.eventId);
		//console.log(v);
		if(v === '1')
		{
			//$(_this.v_view1.el).show();	// 11/01 '21
			//_this.eventId = 0;
			document.getElementById('port_forward_list_title').style.display='';
			document.getElementById('port_forward_list').style.display='';
		}
		else {
			//$(_this.v_view1.el).hide();	// 11/01 '21
			//_this.eventId = 1;
			document.getElementById('port_forward_list_title').style.display='none';
			document.getElementById('port_forward_list').style.display='none';
		}
		/* if(_this.v_view2.v_viewModelChange){
			_this.v_view2.v_viewModelChange(v);
			$(_this.v_view1.el).hide();	// 10/29 '21
		}*/
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view1._popup_apply){
			_this.v_view1._popup_apply(data);
		}
	},
	_jioOnOffLabel: function(e, v) {
		//console.log('PAGE_ADMIN_UPNP_PORT_FORWADING: _jioOnOffLabel');
		if (typeof e.target == typeof this.v_view3){console.log('PAGE_ADMIN_UPNP_PORT_FORWADING: _jioOnOffLabel from PAGE_UPNP_PORT_FORWARDING');}
		else if (e.target == this.v_view2){console.log('PAGE_ADMIN_UPNP_PORT_FORWADING: _jioOnOffLabel from PAGE_UPNP_UPNP');}
		var _this = this;
		//Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_UPNP_PORT_FORWARDING_LIST({ el: Backbone.$('.port_forwarding_list', _this.$el) });
		_this.v_view2 = new PAGE_UPNP_UPNP({ el: Backbone.$('.upnp', _this.$el) });
		_this.v_view3 = new PAGE_UPNP_PORT_FORWARDING({ el: Backbone.$('.port_forwarding', _this.$el) });
		//$(_this.v_view1.el).hide();
		document.getElementById('port_forward_list_title').style.display='none';
		document.getElementById('port_forward_list').style.display='none';
	}
});

var port_map_idx = 0;
var PAGE_UPNP_PORT_FORWARDING_LIST = Backbone.View.extend({
	name: "PAGE_UPNP_PORT_FORWARDING_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="PAGE_UPNP_PORT_FORWARDING_LIST">Port Forwarding Rules List</div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1"></table>'
	+'</div>',
	collection: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	applyEditAdd: {
		0: "protocol",
		1: "port_type",
		2: "port_begin",
		3: "port_end",
		4: "ip",
		5: "lan_port_begin",
		6: "status",
		7: "description",
		//6: "interface"
	},
	setEditAdd: {
		arr: [{
				str: 'Protocol',
				lang: 'PAGE_UPNP_PORT_FORWARDING_PROTOCOL',
				dropdown: true,
				visible: false,
				options: [{
					str: 'TCP',
					lang: 'PAGE_UPNP_PORT_FORWARDING_TCP',
					data: 'TCP'
				},{
					str: 'UDP',
					lang: 'PAGE_UPNP_PORT_FORWARDING_UDP',
					data: 'UDP'
				},{
					str: 'Both (TCP & UDP)',
					lang: 'PAGE_UPNP_PORT_FORWARDING_BOTH',
					data: 'Both'
				}],
				data: ''
			},{
				str: 'WAN Port Type',
				lang: 'PAGE_UPNP_PORT_FORWARDING_WAN_PORT_TYPE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Single',
					lang: 'PAGE_UPNP_PORT_FORWARDING_SINGLE',
					data: 'single'
				},{
					str: 'Range',
					lang: 'PAGE_UPNP_PORT_FORWARDING_RANGE',
					data: 'range'
				}],
				data: ''
			},{
				str: 'WAN Port Begin',
				lang: 'PAGE_UPNP_PORT_FORWARDING_WAN_PORT_BEGIN',
				input: true,
				inputstr: '(1 - 65535)',
				data: ''
			},{
				str: 'WAN Port End',
				lang: 'PAGE_UPNP_PORT_FORWARDING_WAN_PORT_END',
				input: true,
				inputstr: '',
				data: ''
			},{
				str: 'Port Forwarding LAN IP',
				lang: 'PAGE_UPNP_PORT_FORWARDING_IP',
				input: true,
				data: ''
			},{
				str: 'Lan Port Begin',
				lang: 'PAGE_UPNP_PORT_FORWARDING_LAN_PORT_BEGIN',
				input: true,
				data: ''
			},{
				str: 'Port Forwarding Status',
				lang: 'PAGE_UPNP_PORT_FORWARDING_STATUS',
				checked: true,
				data: ''
			},{
				str: 'Description (Optional)',
				lang: 'PAGE_UPNP_PORT_FORWARDING_DESCRIPTION_OPT',
				input: true,
				data: ''
			/*},{
				str: 'Port Forwarding Interface',
				lang: 'PAGE_UPNP_PORT_FORWARDING_INTERFACE',
				input: true,
				inputstr: '(APN name)',
				data: ''*/
			}],
	},
	events: {
		'click .btnAdd': 'onbtnAdd'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_PORTFORWARDING_RULES();
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 8});
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el), parent: _this });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log('PAGE_UPNP_PORT_FORWARDING_LIST : collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_UPNP_PORT_FORWARDING_PROTOCOL",
			str: "Protocol"
		},{
			sort: true,
			lang: "PAGE_UPNP_PORT_FORWARDING_PORT_RANGE_BE",
			str: "WAN Port Range (Begin - End)"
		},{
			sort: true,
			lang: "PAGE_UPNP_PORT_FORWARDING_LAN_IP",
			str: "LAN IP"
		},{
			sort: true,
			lang: "PAGE_UPNP_PORT_FORWARDING_STATUS",
			str: "Status"
		//},{
		//	sort: true,
		//	lang: "PAGE_UPNP_PORT_FORWARDING_INTERFACE",
		//	str: "Interface"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {

			if(val.protocol.indexOf(",") >= 0){
				value = val.protocol.split(',');
				val.protocol = value[1];
			}
			if(val.port_type.indexOf(",") >= 0){
				value = val.port_type.split(',');
				val.port_type = value[1];
			}
			if(val.port_begin.indexOf(",") >= 0){
				value = val.port_begin.split(',');
				val.port_begin = value[1];
			}
			if(val.port_end.indexOf(",") >= 0){
				value = val.port_end.split(',');
				val.port_end = value[1];
			}
			if(val.ip.indexOf(",") >= 0){
				value = val.ip.split(',');
				val.ip = value[1];
			}
			if(val.lan_port_begin.indexOf(",") >= 0){
				value = val.lan_port_begin.split(',');
				val.lan_port_begin = value[1];
			}
			if(val.status.indexOf(",") >= 0){
				value = val.status.split(',');
				val.status = value[1];
			}
			if(val.description.indexOf(",") >= 0){
				value = val.description.split(',');
				val.description = value[1];
			}
			/*if(val.interface.indexOf(",") >= 0){
				value = val.interface.split(',');
				val.interface = value[1];
			}*/

			lists.push([
				{
					str: _this.ui_protocol(val)
				},{
					str: _this.ui_port_range(val)
				},{
					str: val.ip
				},{
					hide_text: false,
					enable: true,
					str: val.status
				//},{
				//	str: val.interface
				},{
					id: key,
					btn: [{
						type: 'more'
					}, {
						type: 'edit'
					}, {
						type: 'del'
					}]
				}
			]);
		});
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	onbtnAdd: function() {
		// console.log('PAGE_UPNP_PORT_FORWARDING_LIST:onbtnAdd');
		var _this = this;
		var maxLimit = _this.modelMaxLimit.get("maxLimit");
		if(_this.collection.length >= maxLimit){
			
			var strFormat = getHTMLString('POPUP_MAXIMUM_NUM_RULES');
			var str = strFormat.replace("%NUM%", maxLimit);

			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 4000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: str, 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {
			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_PORTFORWARDING_RULE();
			app.popup_view.model.set({
				id: 2000,
				title: getHTMLString('PAGE_UPNP_PORT_FORWARDING_ADD_TITLE'), //Add Port Forwarding Rule
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setEditAdd));
			app.popup_view.apply1 = _this.applyEditAdd;
			
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onEditAddPopupInputChanged);

		}
	},
	_list_event: function(v) {
		// console.log('PAGE_UPNP_PORT_FORWARDING_LIST:_list_event');
		var _this = this;
		_this.model = new m_PORT_F_DEL();
		_this.eventId = v.id;
		var model = _this.collection.at(v.id);
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			// if(model){
			// 	model.destroyPOST(false);
			// 	_this.collection.trigger('sync');
			// }
			var res = _this.model.set({ delete_port: model.attributes.ip });
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model){
						model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_PORTFORWARDING_RULE();
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('PAGE_UPNP_PORT_FORWARDING_RULE_DETAILS') //Port Forwarding Rule Details
			});

			var attr = _.clone(model.attributes);
			var value;
			if(attr.protocol.indexOf(",") >= 0){
				value = attr.protocol.split(',');
				attr.protocol = value[1];
			}
			if(attr.port_type.indexOf(",") >= 0){
				value = attr.port_type.split(',');
				attr.port_type = value[1];
			}
			if(attr.port_begin.indexOf(",") >= 0){
				value = attr.port_begin.split(',');
				attr.port_begin = value[1];
			}
			if(attr.port_end.indexOf(",") >= 0){
				value = attr.port_end.split(',');
				attr.port_end = value[1];
			}
			if(attr.ip.indexOf(",") >= 0){
				value = attr.ip.split(',');
				attr.ip = value[1];
			}
			if(attr.lan_port_begin.indexOf(",") >= 0){
				value = attr.lan_port_begin.split(',');
				//If not specified the lan_port_begin (""), the datamodel will force to be set to 0. GUI has to show "".
				if (value[1] == 0)
				{
					attr.lan_port_begin = "";
				}
				else
				{
					attr.lan_port_begin = value[1];
				}
			}
			if(attr.status.indexOf(",") >= 0){
				value = attr.status.split(',');
				attr.status = value[1];
			}
			if(attr.description.indexOf(",") >= 0){
				value = attr.description.split(',');
				attr.description = value[1];
			}
			if (attr.description.length == 0){
				 attr.description = '---';
			}
			/*if(attr.interface.indexOf(",") >= 0){
				value = attr.interface.split(',');
				attr.interface = value[1];
			}*/
			if (attr.port_type == 'single') attr.port_end = '';
			
			app.popup_view.set1 = {
				arr: [{
					str: 'Protocol',
					lang: 'PAGE_UPNP_PORT_FORWARDING_PROTOCOL',
					text: ''
				},{
					str: 'WAN Port Begin',
					lang: 'PAGE_UPNP_PORT_FORWARDING_WAN_PORT_BEGIN',
					text: ''
				},{
					str: 'WAN Port End',
					lang: 'PAGE_UPNP_PORT_FORWARDING_WAN_PORT_END',
					disabled: (attr.port_type == 'single'),
					text: ''
				},{
					str: 'Port Forwarding LAN IP',
					lang: 'PAGE_UPNP_PORT_FORWARDING_IP',
					text: ''
				},{
					str: 'Lan Port Begin',
					lang: 'PAGE_UPNP_PORT_FORWARDING_LAN_PORT_BEGIN',
					text: ''
				},{
					str: 'Status',
					lang: 'PAGE_UPNP_PORT_FORWARDING_STATUS',
					iconStatus: true,
					data: ''
				},{
					str: 'Description',
					lang: 'PAGE_UPNP_PORT_FORWARDING_DESCRIPTION',
					text: ''
				/*},{
					str: 'Interface',
					lang: 'PAGE_UPNP_PORT_FORWARDING_INTERFACE',
					text: ''
				*/
				}]
			};
			app.popup_view.apply1 = {
				0: "protocol",
				1: "port_begin",
				2: "port_end",
				3: "ip",
				4: "lan_port_begin",
				5: "status",
				6: "description",
				//5: "interface"
			};

			app.popup_view.modelInput.set(attr);
						
		}else if(v.type === 'edit'){
			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_PORTFORWARDING_RULE();
			app.popup_view.model.set({
				id: 3000,
				title: getHTMLString('PAGE_UPNP_PORT_FORWARDING_EDIT_TITLE'), //Edit Port Forwarding Rule
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setEditAdd));
			app.popup_view.apply1 = _this.applyEditAdd;
			var attr = _.clone(model.attributes);
			var value;
			
			if(attr.protocol.indexOf(",") >= 0){
				value = attr.protocol.split(',');
				attr.protocol = value[1];
				port_map_idx = value[0];
			}
			if(attr.port_type.indexOf(",") >= 0){
				value = attr.port_type.split(',');
				attr.port_type = value[1];
			}
			if(attr.port_begin.indexOf(",") >= 0){
				value = attr.port_begin.split(',');
				attr.port_begin = value[1];
			}
			if(attr.port_end.indexOf(",") >= 0){
				value = attr.port_end.split(',');
				attr.port_end = value[1];
			}
			if(attr.ip.indexOf(",") >= 0){
				value = attr.ip.split(',');
				attr.ip = value[1];
			}
			if(attr.status.indexOf(",") >= 0){
				value = attr.status.split(',');
				attr.status = value[1];
			}
			if(attr.lan_port_begin.indexOf(",") >= 0){
				value = attr.lan_port_begin.split(',');
				//If not specified the lan_port_begin (""), the datamodel will force to be set to 0. GUI has to show "".
				if (value[1] == 0)
				{
					attr.lan_port_begin = "";
				}
				else
				{
					attr.lan_port_begin = value[1];
				}
			}
			if(attr.description.indexOf(",") >= 0){
				value = attr.description.split(',');
				attr.description = value[1];
			}
			/*if(attr.interface.indexOf(",") >= 0){
				value = attr.interface.split(',');
				attr.interface = value[1];
			}*/
			app.popup_view.modelInput.set(attr);
		
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onEditAddPopupInputChanged);
			
		}
	},
	onEditAddPopupInputChanged: function(o) {
		//console.log(this.name, 'onEditAddPopupInputChanged');
		//console.log(o);		

		var _this = this;		
		_this.popupDoChangeInputAttr(o, _this.applyEditAdd);
		
	},	
	popupDoChangeInputAttr: function(o, apply){

		var popupViewModel = o.viewModel;
		///// .port_type == "range"){
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply = _.invert(apply);
		var changed = false;
		if(v_attr.arr[i_apply.port_type].data === 'single'){
			var v = v_attr.arr[i_apply.port_end];
			if (!v.disabled){
				v.disabled = true;
				v.data = '0';
				changed = true;
			}
		}else{
			var v = v_attr.arr[i_apply.port_end];
			if (v.disabled){
				v.disabled = false;
				changed = true;
			}
		}

		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	_popup_apply: function(data){
		// console.log('PAGE_UPNP_PORT_FORWARDING_LIST:_popup_apply');
		var _this = this;
		if(data.id === 2000){ //add
			var model = new m_PORTFORWARDING_RULE();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');
			var res = model.set(attr);
			// if(!_.isEmpty(res.changed)){
			// 	_this.collection.createPOST(false, model);
			// }
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						_this.collection.fetch();
						clearInterval(_this.interval);
						setTimeout(function(){
							app._popupViewingClose();
						}, 8000);
						//_this.collection.createPOST(false, model);
					}
				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}
		if(data.id === 3000){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				var attr = _.omit(popup_attr, 'id');;
				if(port_map_idx!=0){
					attr.protocol = port_map_idx+','+attr.protocol;
					attr.port_type = port_map_idx+','+attr.port_type;
					attr.port_begin = port_map_idx+','+attr.port_begin;
					attr.port_end = port_map_idx+','+attr.port_end;
					attr.ip = port_map_idx+','+attr.ip;
					attr.status = port_map_idx+','+attr.status;
					attr.lan_port_begin = port_map_idx+','+attr.lan_port_begin;
					attr.description = port_map_idx+','+attr.description;
					//attr.interface = port_map_idx+','+attr.interface;
				}
				var res = model.set(attr);
				// if(!_.isEmpty(res.changed)){
				// 	_this.collection.createPOST(false, model);
				// }
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				model.savePOST(false);
			}
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					/*
					if(!_.isEmpty(res.changed)){
						_this.collection.createPOST(false, model);
					}
					*/
				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}
		if(data.id === 4000){
			app._popupViewingClose();
		}
	},
	ui_protocol: function(m){
		switch(m.protocol){
			case 'TCP': 
				return getHTMLString('PAGE_UPNP_PORT_FORWARDING_TCP') ;
			case 'UDP': 
				return getHTMLString('PAGE_UPNP_PORT_FORWARDING_UDP') ;
			case 'Both': 
				return getHTMLString('PAGE_UPNP_PORT_FORWARDING_BOTH') ;
			default: 
				return '';
		}
	},
	ui_port_range: function(m){
		switch(m.port_type){
			case 'single': 
				return m.port_begin ;
			case 'range': 
				return m.port_begin + ' - ' + m.port_end ;
			default: 
				return '';
		}
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_UPNP_PORT_FORWARDING = Backbone.View.extend({
	name: "PAGE_UPNP_PORT_FORWARDING",
	template: ''
	+'<div class="jioH2" langid="PAGE_UPNP_PORT_FORWARDING">Port Forwarding</div>'
	+'<div class="v_view"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view: null,
	apply1: {
		0: 'port_forwarding_status'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_UPNP_PORT_FORWARDING();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		//_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
		_this.listenTo(_this.v_view.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		//console.log('PAGE_UPNP_PORT_FORWARDING: modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}else if(_response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('PAGE_UPNP_PORT_FORWARDING: modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Port Forwarding Status',
				lang: 'PAGE_UPNP_PORT_FORWARDING_STATUS',
				checked: true,
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
	},
	v_viewModelChange: function() {
		//console.log('PAGE_UPNP_PORT_FORWARDING: v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view.model.attributes);
		//console.log(v_attr.arr[0].data);	// 10/29 '21
		app.router_view.v_viewModelChange(v_attr.arr[0].data); // 11/01 '21
	},
	_JioInput_Edit: function(e, v) {
		//console.log('PAGE_UPNP_PORT_FORWARDING: _JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('PAGE_UPNP_PORT_FORWARDING: btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		if(_this.model.attributes.port_forwarding_status == _this.model._previousAttributes.port_forwarding_status){
			// app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			// app.popup_view.model.set({
			// 	id: 4000,
			// 	title: getHTMLString(''),
			// 	info: getHTMLString('POPUP_NO_CHANGES'),
			// 	warn: '',
			// 	btn: getHTMLString('MAIN_BTN_OK') //OK
			// });
		}else{
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_close: function() {
		//console.log("PAGE_UPNP_PORT_FORWARDING: _close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('PAGE_UPNP_PORT_FORWARDING: render');
	}
});

var PAGE_UPNP_UPNP = Backbone.View.extend({
	name: "PAGE_UPNP_UPNP",
	template: ''
	+'<div class="jioH2" langid="PAGE_UPNP_UPNP">UPnP</div>'
	+'<div class="v_view"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view: null,
	apply1: {
		0: 'upnp_status'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_UPNP_UPNP();
	},
	initialize: function () {
		var _this = this;
		console.log("PAGE_UPNP_UPNP: initialize");

		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		//_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		
		_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
		_this.listenTo(_this.v_view.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('PAGE_UPNP_UPNP: modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		if(_response){
			//console.log(_response);
		}
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}else if(_response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('PAGE_UPNP_UPNP: modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'UPnP Status',
				lang: 'PAGE_UPNP_UPNP_STATUS',
				checked: true,
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
	},
	v_viewModelChange: function() {
		//console.log('PAGE_UPNP_UPNP: v_viewModelChange');
	},
	_JioInput_Edit: function(e, v) {
		//console.log('PAGE_UPNP_UPNP: _JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('PAGE_UPNP_UPNP: btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		if(_this.model.attributes.upnp_status != _this.model._previousAttributes.upnp_status){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_close: function() {
		//console.log("PAGE_UPNP_UPNP: _close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('PAGE_UPNP_UPNP: render');
	}
});



var PAGE_ADMIN_MACADDR_FILTER = Backbone.View.extend({
	name: "PAGE_ADMIN_MACADDR_FILTER_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_MACADDR_FILTERING">MAC Address Filtering</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide macaddress_filtering">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen" id="macfilter_list_title">'
	+'<span class="jiotext" langid="PAGE_MACADDRESS_FILTERING_LIST">MAC Address Filtering List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide filtering_list" id="macfilter_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	v_viewModelChange: function(v) {		// 10/29 '21 add this block
		var _this = this;
		//console.log('v_viewModelChange in main view');
		//console.log(_this.eventId);
		//console.log(v);
		if(v === '1')
		{
			//$(_this.v_view2.el).show();	// 10/29 '21
			//_this.eventId = 0;
			document.getElementById('macfilter_list_title').style.display='';
			document.getElementById('macfilter_list').style.display='';
		}
		else {
			//$(_this.v_view2.el).hide();	// 10/29 '21
			//_this.eventId = 1;
			document.getElementById('macfilter_list_title').style.display='none';
			document.getElementById('macfilter_list').style.display='none';
		}
		/* if(_this.v_view2.v_viewModelChange){
			_this.v_view2.v_viewModelChange(v);
			$(_this.v_view1.el).hide();	// 10/29 '21
		}*/
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_MACADDRESS_FILTERING({ el: Backbone.$('.macaddress_filtering', _this.$el) });	
		_this.v_view2 = new PAGE_MACADDRESS_FILTERING_LIST({ el: Backbone.$('.filtering_list', _this.$el) });
		$(_this.v_view2.el).hide();
	}
});

var MAX_LIMIT = Backbone.View.extend({
	name: "MAX_LIMIT",  
	template: ''
	+'<div class="jioMaxLimit'
	+'<% if(isError){ %>'+' jioColorError '+'<% } else { %>'+' <% } %>' 
	+'"><span langid="PAGE_MACADDR_MAX_LIMIT">Max Limit:</span> <%- maxLimit %></div>'
	,
	model: null,
	islog: false,
	preinitialize: function () {
		var _this = this;
	},
	initialize: function () {
		if(this.islog) console.log("MAX_LIMIT initialize");
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		//_this.$el.html(_this.template(_this.model.attributes));
		//transHTMLString(_this.$el);		
		_this.render();
	},
	modelChange: function(){
		if(this.islog) console.log("MAX_LIMIT modelChange");		
		var _this = this;
		_this.render();
	},
	render: function() {
		if(this.islog) console.log("MAX_LIMIT render");		
		var _this = this;
		_this.$el.html(_this.template(_this.model.attributes));
		transHTMLString(_this.$el);
	}
});

var mac_filter_len;
var PAGE_MACADDRESS_FILTERING_LIST = Backbone.View.extend({
	name: "PAGE_MACADDRESS_FILTERING_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
/*
	+'<div class="jioTableHeading">'
*/
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="PAGE_MACADDRESS_FILTERING_LIST">MAC Address Filtering List</div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	apply1: {
		//0: 'select',
		0: 'devname',
		1: 'macaddr'
	},
	events: {
		'click .btnAdd': 'btnAdd'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_MACADRRESS_FILTERS();
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		// console.log('collectionSync');
		var _this = this;
		var head = [{
			sort: true,
			lang: "PAGE_MACADDRESS_DEVICE_NAME",
			str: "Device Name"
		},{
			sort: true,
			lang: "PAGE_MACADDRESS_MAC_ADDRESS",
			str: "MAC Address"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			if(val.devname.indexOf(",") >= 0){
				value = val.devname.split(',');
				val.devname = value[1];
			}
			if(val.macaddr.indexOf(",") >= 0){
				value = val.macaddr.split(',');
				val.macaddr = value[1];
			}
			lists.push([
				{
					str: val.devname
				},{
					str: val.macaddr
				},{
					id: key,
					btn: [{
						type: 'del'
					}]
				}
			]);
		});
		mac_filter_len = c_lists.length;
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	btnAdd: function() {
		// console.log('PAGE_MACADDRESS_FILTERING_LIST btnAdd');
		
		var _this = this;
		// if (0){
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_RULES'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_MACADRRESS_FILTER();
			app.popup_view.model.set({
				id: 2000,
				title: getHTMLString('PAGE_MACADDR_ADD_NEW_REC'), //Add New
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Device Name',
					lang: 'PAGE_MACADDRESS_DEVICE_NAME',
					input: true,
					data: ''
				},{
					str: 'New MAC Address',
					lang: 'PAGE_MACADDR_NEW_MAC_ADDR',
					input: true,
					data: ''
				}]
			};
			app.popup_view.apply1 = _this.apply1;
		}
	},
	_list_event: function(v) {
		// console.log('PAGE_MACADDRESS_FILTERING_LIST _list_event');
		var _this = this;
		_this.eventId = v.id;
		// console.log(v.id);
		_this.model = new m_MAC_F_DEL();
		var model = _this.collection.at(v.id);
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			// if(model){
			// 	model.destroyPOST(false);
			// 	_this.collection.trigger('sync');
			// }
			var res = _this.model.set({ delete_mac: v.id });
			// console.log(res._response);
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model){
						model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}else{
					if(res._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_ALL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 5000);
		}
	},
	_popup_apply: function(data){
		//console.log('PAGE_MACADDRESS_FILTERING_LIST _popup_apply');
		var _this = this;
		if(data.id === 1000 || data.id === 3000){
			app._popupViewingClose();
		}
		if(data.id === 4000){ //para_chk error
			app._popupViewingClose();
		}
		if(data.id === 2000){ //add
			//console.log("PAGE_MACADDRESS_FILTERING_LIST add");
			var model = new m_MACADRRESS_FILTER();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');;
			attr.devname = (mac_filter_len+1)+','+attr.devname;
			attr.macaddr = (mac_filter_len+1)+','+attr.macaddr;
			var res = model.set(attr);
			// console.log(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			model.savePOST(false);
			_this.interval = setInterval(function(){
				// console.log(res._response);
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else if(res._response == 'para_chk error'){
					// _this.collection.createPOST(false, model);
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_MACFILTER_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}

	},

	render: function() {
		//console.log('render');
	}
});

var PAGE_MACADDRESS_FILTERING = Backbone.View.extend({
	name: "PAGE_MACADDR_FILTERING",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_MACADDR_FILTERING">MAC Address Filtering</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	v_view3: null,
	apply1: {
		0: 'filtering_status'
	},
	apply2: {
		0: 'filtering_mode'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADM_MACADDR_FILTERING();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);	// 10/29 '21
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Filtering Status',
				lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Filtering Mode',
				lang: 'PAGE_MACADDR_FILTERING_MODE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Allow',
					lang: '',
					data: 'Allow'
				},{
					str: 'Deny',
					lang: '',
					data: 'Deny'
				}],
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {	// 10/29 '21
		//console.log('v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view2.model.attributes);
		//console.log(v_attr.arr[0].data);	// 10/29 '21
		app.router_view.v_viewModelChange(v_attr.arr[0].data); //10/29 '21
	},
	_JioInput_Modify: function(e, v) {
		// console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		if(_this.model.attributes.filtering_mode == _this.v_view3.model.attributes.arr[0].data &&
		   _this.model.attributes.filtering_status == _this.v_view2.model.attributes.arr[0].data){
			// app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			// app.popup_view.model.set({
			// 	id: 1000,
			// 	title: getHTMLString(''),
			// 	info: getHTMLString('POPUP_NO_CHANGES'),
			// 	warn: '',
			// 	btn: getHTMLString('MAIN_BTN_OK') //OK
			// });
		}else if( _this.v_view2.model.attributes.arr[0].data=="1" &&
				 mac_filter_len==0){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('POPUP_ADD_RULE'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			var res = _this._sSaveModel(false, _this.model, [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_popup_apply: function(data){
		if(data.id === 1000 || data.id === 2000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_FIREWALL_SERVICES = Backbone.View.extend({
	name: "PAGE_FIREWALL_SERVICES",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_FIREWALL_SERVICES">Firewall Services</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	apply1: {
		0: 'ddos',
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_FIREWALL_SERVICES();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		var _this = this;
		var _response = _this.model._response || null;
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		var _this = this;
		var set1 = {
			arr: [{
				str: 'DDoS',
				checked: true,
				data: ''
			}
			]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view2], [_this.apply1]);
	},
	_JioInput_Modify: function(e, v) {
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view2], [_this.apply1]);
		if(!_.isEmpty(_this.model.changed)){
			model_change_status = 1;
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		//_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

/*
var PAGE_ALG_SERVICES = Backbone.View.extend({
	name: "PAGE_ALG_SERVICES",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_ALG_SERVICES">ALG Services</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	v_view3: null,
	apply1: {
		0: 'sip',
		1: 'rtsp',
		2: 'h323',
		3: 'ftp'
	},
	apply2: {
		0: 'tftp',
		1: 'pptp_pass',
		2: 'l2tp_pass',
		3: 'ipsec_pass'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ALG_SERVICES();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		//_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		if(_response){
			//console.log(_response);
		}
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'SIP',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			},
			{
				str: 'RTSP',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			},
			{
				str: 'H323',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			},
			{
				str: 'FTP',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			}
			]
		};
		var set2 = {
			arr: [
			{
				str: 'TFTP',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			},
			{
				str: 'PPTP Passthrough',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			},
			{
				str: 'L2TP Passthrough',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			},
			{
				str: 'IPSec Passthrough',
				//lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
	//	console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
			model_change_status = 1;
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		//_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});
*/

var POPUP_SIM_PIN_ENTRY = Backbone.View.extend({
	name: "POPUP_SIM_PIN_ENTRY",
	template: "",
	model: null,
	modelUmts: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply',
		'keypress input[type="text"]': 'editChange'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0
			}
		}));
		_this.modelUmts = new m_INTERNET_UMTS();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		_this.listenTo(_this.modelUmts, 'change', _this.modelUmtsChange);
		_this.listenTo(_this.modelUmts, 'sync', _this.modelUmtsSync);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPOPUP_SIM_PIN_ENTRY.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.render();
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("POPUP_SIM_PIN_ENTRY renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	modelUmtsChange: function() {
		//console.log('POPUP_SIM_PIN_ENTRY modelUmtsChange');
		var _this = this;
		//console.log(_this.modelUmts);
		
	},
	modelUmtsSync: function() {
		//console.log('POPUP_SIM_PIN_ENTRY: modelUmtsSync');
		var _this = this;
		var _response = _this.modelUmts._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
			if(_response == '1'){
				//console.log("pin valid");
				if(app.router_view._popup_apply){
					app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id, result: 1});
				}
			}else if(_response.indexOf(",") >= 0){
				//console.log("is pin error");
				value = _response.split(',');
				//status = value[0];
				attempt = value[1];
				if (attempt=='0'){
					window.parent.location = 'pukattempsexpired.html';
				}else{
					var errorMsgTemplate = getHTMLString('POPUP_SIM_INCORRECT_PIN');
					var errorMsg = errorMsgTemplate.replace('%ATTEMPT_NUM%', attempt);
					_this.$('.errormsg_umts_pin_code').text(errorMsg).addClass('JioErrorLabelVisible');	
					_this.$('.umts_pin_code').closest('.jioInputContainer').addClass('jioInputError');
				}
			}
			/*var res = JSON.parse(_response);
			var modelUmtsRet = new m_INTERNET_UMTS(res);
			if (modelUmtsRet.isPinOK()){
				//console.log("pin valid");
				if(app.router_view._popup_apply){
					app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id, result: 1});
				}
			}else{
				//console.log("is pin error");
				 var errorMsgTemplate = getHTMLString('POPUP_SIM_INCORRECT_PIN');
				 var errorMsg = errorMsgTemplate.replace('%ATTEMPT_NUM%', modelUmtsRet.get('umts_pin_code_attempt'));
				 _this.$('.errormsg_umts_pin_code').text(errorMsg).addClass('JioErrorLabelVisible');	
				 _this.$('.umts_pin_code').closest('.jioInputContainer').addClass('jioInputError');	 				
			}*/
		}
	},
	editChange: function(e){
		//console.log("POPUP_SIM_PIN_ENTRY editChange");
		//console.log(e);
		var _this = this;
		_this.$(e.target).attr('modified', 'modified');
	},
	btn_apply: function() {
		//console.log("POPUP_SIM_PIN_ENTRY btn_apply");
		var _this = this;
		
		var modelInput = _this.modelUmts;

		var changedValues = {};
		if (_this.$('.umts_pin_code').attr("modified") == "modified"){

			_this.$('.errormsg_umts_pin_code').removeClass('JioErrorLabelVisible');	
			_this.$('.umts_pin_code').closest('.jioInputContainer').removeClass('jioInputError');	 				

			changedValues["umts_pin_code"] = _this.$('.umts_pin_code').val();	
			modelInput.set(changedValues);
			modelInput.savePOST(false);
			_this.$('.umts_pin_code').removeAttr("modified");			
		}

		//console.log(modelInput);

		/*if(app.router_view._popup_apply){
			app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id });
		}*/
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_LOGIN_ACS_ENTRY = Backbone.View.extend({
	name: "POPUP_LOGIN_ACS_ENTRY",
	template: "",
	model: null,
	modellogin: null,
	popup_view: null,
	events: {
		'click .JioButton input[type="button"]': 'btn_apply',
		'keypress input[type="text"]': 'editChange',
		"keyup": "_sysKeyup",
		"input #LoginName": "_sysKeyup",
		"input #LoginPWD": "_sysKeyup",
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0
			}
		}));
		_this.modellogin = new m_ACS_LOGIN();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		_this.listenTo(_this.modellogin, 'change', _this.modelloginChange);
		_this.listenTo(_this.modellogin, 'sync', _this.modelloginSync);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPOPUP_LOGIN_ACS.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				transHTMLString(_this.$el);
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("POPUP_LOGIN_ACS_ENTRY renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	modelloginChange: function() {
		//console.log('POPUP_LOGIN_ACS_ENTRY modelloginChange');
		var _this = this;
		//console.log(_this.modellogin);
	},
	modelloginSync: function() {
		//console.log('POPUP_LOGIN_ACS_ENTRY: modelloginSync');
		var _this = this;
		var _response = _this.modellogin._response || null;
		if(_response){
			if(_response == '1'){
				login_acs = 1;
				if(app.router_view._popup_apply){
					app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id, result: 1});
				}
			}else{
				var errorMsgTemplate = getHTMLString('POPUP_LOGIN_ACS_INCORRECT');
				_this.$('.errormsg_loginerr').text(errorMsgTemplate).addClass('JioErrorLabelVisible');	
				Backbone.$('#BTN_Login', _this.$el).attr('disabled', true);
			}
		}
	},
	editChange: function(e){
		//console.log("POPUP_LOGIN_ACS_ENTRY editChange");
		//console.log(e);
		var _this = this;
		_this.$(e.target).attr('modified', 'modified');
	},
	btn_apply: function() {
		//console.log("POPUP_LOGIN_ACS_ENTRY btn_apply");
		var _this = this;
		var username = Backbone.$('#LoginName', _this.$el).val();
		var password = btoa(Backbone.$('#LoginPWD', _this.$el).val());
		if(username=="" || password==""){
			var errorMsgTemplate = getHTMLString('POPUP_LOGIN_ACS_INCORRECT');
			_this.$('.errormsg_loginerr').text(errorMsgTemplate).addClass('JioErrorLabelVisible');	
			Backbone.$('#BTN_Login', _this.$el).attr('disabled', true);
		}

		_this.modellogin = new m_ACS_LOGIN();
		_this.listenTo(_this.modellogin, 'change', _this.modelloginChange);
		_this.listenTo(_this.modellogin, 'sync', _this.modelloginSync);
		
		var res = _this.modellogin.set({LoginName:username, LoginPWD:password});
		if(res.isValid()){
			res.savePOST(false);
		}
	},
	_sysKeyup: function (e) {
		//console.log('_sysKeyup');
		var _this = this;
		_this.$('.errormsg_loginerr').removeClass('JioErrorLabelVisible');	
		Backbone.$('#BTN_Login', _this.$el).removeAttr('disabled');
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_ADD_MACADDRESS_FILTERING_LIST = Backbone.View.extend({
	name: "POPUP_ADD_MACADDRESS_FILTERING_LIST",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply',
		'keypress input[type="text"]': 'editChange'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				info: "",
				warn: "",
				btn: ''
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopup_ADD_MACADDRESS_FILTERING_LIST.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.render();
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	editChange: function(e){
		//console.log("POPUP_ADD_MACADDRESS_FILTERING_LIST editChange");
		//console.log(e);
		var _this = this;
		_this.$(e.target).attr('modified', 'modified');
	},
	btn_apply: function() {
		//console.log("POPUP_ADD_MACADDRESS_FILTERING_LIST btn_apply");
		var _this = this;
		var modelInput = _this.modelInput;

		var changedValues = {};
		if (_this.$('.devname').attr("modified"))	changedValues["devname"] = _this.$('.devname').val();	
		if (_this.$('.macaddr').attr("modified")) changedValues["macaddr"] = _this.$('.macaddr').val();	
		modelInput.set(changedValues);

		//console.log(modelInput);

		if(app.router_view._popup_apply){
			app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id });
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});



var PAGE_PUK_ATTEMPTS_EXPIRED = Backbone.View.extend({
	name: "PAGE_PUK_ATTEMPTS_EXPIRED",
	el: '#app',
	template: "",
	model: null,
	popup_view: null,
	events: {
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new SYS_USER_LANG();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'sync', _this._modelSync);
		//transHTMLString(_this.$el);
		_this.model.fetchOLDJSON();

	},
	_modelSync: function () {
		//console.log('_modelSync');
		var _this = this;
		document.title = _this.model.get('device_type');
		var errorMsgTemplate = getHTMLString('PAGE_PUK_ATTEMPTS_EXPIRED');
		var errorMsgBold = getHTMLString('PAGE_PUK_ATTEMPTS_EXPIRED_BOLD');
		var errorMsg = errorMsgTemplate.replace('%BOLD_TEXT%', errorMsgBold);
		_this.$('#pukText').html(errorMsg);	

		transHTMLString(_this.$el);
	},
	_popupViewing: function (view){
		//console.log('_popupViewing');
		var _this = this;
		Backbone.$('.jioModalWindow_row', _this.$el).html('<div class="jiomodalBoxContainer"></div>');
		if (_this.popup_view !== null) {
			_this.popup_view._sClose();
		}
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: grid;');
		_this.popup_view = new view({ el: '.jiomodalBoxContainer' });
	},
	_popupViewingClose: function (){
		//console.log('_popupViewingClose');
		var _this = this;
		Backbone.$('.jioModalWindow', _this.$el).attr('style', 'display: none;');
		_this.popup_view._sClose();
	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_ADMIN_USER_MANAGEMENT_CONNECTION_ADDR_NETWORK_HEALTH_MTR = Backbone.View.extend({
	name: "PAGE_ADMIN_USER_MANAGEMENT_CONNECTION_ADDR_NETWORK_HEALTH_MTR",
	template: ''
	+'<div class="jioH2" langid="PAGE_ADMIN_USER_MANAGEMENT_CONNECTION_ADDR_NETWORK_HEALTH_MTR">Connection Address & Network Health Monitor</div>'
	+'<div class="v_view2">'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	apply1: {
		0: 'connection_address',
		1: 'network_health_monitor',
		2: ''
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_CONNECTION_ADDR_NETWORK_HEALTH_MTR();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
		// 	//console.log(_response);
		// }
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 5000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Connection Address',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_CONNECTION_ADDR',
				text: _this.model.get("connection_address"),
				data: ''
			},{
				str: 'Network Health Monitor',
				lang: 'PAGE_ADMIN_USER_MANAGEMENT_NETWORK_HEALTH_MTR',
				checked: true,
				data: ''
			},{
				str: '',
				lang: '',
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view2], [_this.apply1]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view2], [_this.apply1]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_ESIM = Backbone.View.extend({
	name: "PAGE_SETTINGS_ESIM_TITLE",
	template: ''
	+'<div class="jio1SectionGrid">'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES">Add eSIM Profiles</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio2SectionWithInput jioH2MobileShowHide v_topleft"></div>'
	+'</div>'
	+'<div></div>'
	//+'<div class="jioMobileSection">'
	//+'<div class="jioH2Mobile jioOpen">'
	//+'<span class="jiotext" langid="PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS">Bluetooth Settings</span>'
	//+'<span class="jioIconOpenDown"></span>'
	//+'</div>'
	//+'<div class="jio2SectionWithInput jioH2MobileShowHide v_topright"></div>'
	//+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_ESIM_PROFILES_LIST">eSIM Profiles List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide V_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>',
	V_list: null,
	v_topleft: null,
	v_topright: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(v) {
		//console.log('_list_event');
		//console.log(v);
		var _this = this;
		if(_this.V_list._list_event){
			_this.V_list._list_event(v);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if((data.id >= 1000) && (data.id <=1999)){
		  if(_this.V_list._popup_apply){
			_this.V_list._popup_apply(data);
		  }
		}else if((data.id >= 2000) && (data.id <=2999)){
		  if(_this.v_topleft._popup_apply){
			_this.v_topleft._popup_apply(data);
		  }
		}else if((data.id >= 3000) && (data.id <=3999)){
		  if(_this.v_topright._popup_apply){
			_this.v_topright._popup_apply(data);
		  }
		}else{
			app._popupViewingClose();
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	v_viewModelChange: function(d) {
		var _this = this;
		//console.log('v_viewModelChange in main view');
		//console.log(d);
		if(d.event == 'updateList')
		{
			_this.V_list.updateList();
		}
		else {
			
		}

	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.V_list = new PAGE_SETTINGS_ESIM_PROFILES_LIST({ el: Backbone.$('.V_list', _this.$el) });
		_this.v_topleft = new PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES({ el: Backbone.$('.v_topleft', _this.$el) });
		_this.v_topright = new PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS({ el: Backbone.$('.v_topright', _this.$el) });
		_this.v_topleft.setBluetoothModel(_this.v_topright.model);
	}
});

var PAGE_SETTINGS_ESIM_PROFILES_LIST = Backbone.View.extend({
	name: "PAGE_SETTINGS_ESIM_PROFILES_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeading">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_ESIM_PROFILES_LIST">eSIM Profiles List</div>'
	//+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	//+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	v_view1: null,
	islog: false,
	eventId: 0,
	set_delete: {
			arr: [{
			str: 'Enter Password',
			lang: 'PAGE_SETTINGS_ESIM_DELETE_ENTER_PASSWORD',
			input: true,
			password: { checked: false },
			data: ''
			}]
	},
	apply_delete: {
		0: 'esim_delete_password'
	},
	apply1: {
		0: 'eSIMProfileProvider',
		1: 'eSIMProfileName',
		2: 'eSIMProfileStatus',
		3: 'eSIMIccid'
	},
	events: {

	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_ESIM_PROFILES();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);

		_this.collection.fetch();
	},
	collectionSync: function() {
		// console.log('collectionSync');
		var _this = this;
		var c_lists = _this.collection.toJSON();
		if (c_lists.length == 0){
			return;
		}
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		var head = [{
			sort: true,
			lang: "PAGE_SETTINGS_ESIM_SERVICE_PROVIDER",
			str: "Service Provider"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_ESIM_PROFILE_NAME",
			str: "Profile Name"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_ESIM_PROFILE_STATUS",
			str: "Profile Status"
		},{
			sort: true,
			lang: "PAGE_SETTINGS_ESIM_SERVICE_ICCID",
			str: "Service ICCID"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var value;
		_.map(c_lists, function (val, key) {
            if(val.eSIMProfileStatus === '1'){
                lists.push([
                    {
                        str: val.eSIMProfileProvider
                    },{
                        str: val.eSIMProfileName
                    },{
                        enable: true,
                        str: val.eSIMProfileStatus
                    },{
                        str: val.eSIMIccid
                    },{
                        id: key,
                        btn: [{
                            type: 'more'
                        }, {
                            type: 'forbidden'
                        }]
                    }
                ]);
            }else{
                lists.push([
                    {
                        str: val.eSIMProfileProvider
                    },{
                        str: val.eSIMProfileName
                    },{
                        enable: true,
                        str: val.eSIMProfileStatus
                    },{
                        str: val.eSIMIccid
                    },{
                        id: key,
                        btn: [{
                            type: 'more'
                        }, {
                            type: 'enablenew'
                        }, {
                            type: 'del'
                        }]
                    }
                ]);
            }
        });

		_this.v_view1.model.set({ head: head, lists: lists });
	},
	_list_event: function(v) {
		// console.log('PAGE_SETTINGS_ESIM_PROFILES_LIST _list_event');
		var _this = this;
		_this.eventId = v.id;
		//console.log(v.id);
		_this.model = new m_ESIM_PROFILE_DEL();
		var model = _this.collection.at(v.id);
		if(v.type === 'del'){
			clearInterval(_this.interval);
/*
            app._popupViewing(POPUP_CONFIRM_TEMPLATE);
            app.popup_view.model.set({
                id: 1000,
                title: getHTMLString('PAGE_SETTINGS_ESIM_DELETE_PROFILE'),
                info: getHTMLString('PAGE_SETTINGS_ESIM_DELETE_PROFILE_DETAILS'),
                warn: '',
                btn: getHTMLString('MAIN_BTN_OK') //OK
            });
*/
			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_TEMPLATE_FILE, { template_file: 'templates/jioPopupEsimDelete.html'});
			app.popup_view.modelInput = new m_ESIM_PROFILE_DEL_PASSWORD();
			app.popup_view.model.set({
				id: 1100,
				title: getHTMLString('PAGE_SETTINGS_ESIM_DELETE_PROFILE'),
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
			app.popup_view.set1 = _this.set_delete;
			app.popup_view.apply1 = _this.apply_delete;
		}else if(v.type === 'enablenew'){
			if(model){
				//app._popupViewingClose();
				clearInterval(_this.interval);
				app._popupViewing(POPUP_CONFIRM_TEMPLATE);
				app.popup_view.model.set({
					id: 1004,
					title: getHTMLString('PAGE_SETTINGS_ESIM_ENABLE_PROFILE'),
					info: getHTMLString('PAGE_SETTINGS_ESIM_ENABLE_PROFILE_DETAILS'),
					warn: '',
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});
			}
		}else if(v.type === 'forbidden'){
			if(model){
				//app._popupViewingClose();
				clearInterval(_this.interval);
				app._popupViewing(POPUP_CONFIRM_TEMPLATE);
				app.popup_view.model.set({
					id: 1002,
					title: getHTMLString('PAGE_SETTINGS_ESIM_DISABLE_PROFILE'),
					info: getHTMLString('PAGE_SETTINGS_ESIM_DISABLE_PROFILE_DETAILS'),
					warn: '',
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});
			}
		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_ESIM_PROFILE();
			app.popup_view.model.set({
				id: 1006,
				title: getHTMLString('PAGE_SETTINGS_ESIM_PROFILE') 
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Service Provider',
					lang: 'PAGE_SETTINGS_ESIM_SERVICE_PROVIDER',
					text: ''
				},{
					str: 'Profile Name',
					lang: 'PAGE_SETTINGS_ESIM_PROFILE_NAME',
					text: ''
				},{
					str: 'Profile Status',
					lang: 'PAGE_SETTINGS_ESIM_PROFILE_STATUS',
					iconStatus: true,
					data: ''
				},{
					str: 'ICCID',
					lang: 'PAGE_SETTINGS_ESIM_ICCID',
					text: ''
				}]
			};
			app.popup_view.apply1 = {
				0: 'eSIMProfileProvider',
				1: 'eSIMProfileName',
				2: 'eSIMProfileStatus',
				3: 'eSIMIccid'
			};
			var attr = _.clone(model.attributes);
			app.popup_view.modelInput.set(attr);
		}
	},
	_popup_apply: function(data){
		//console.log('PAGE_SETTINGS_ESIM_PROFILES_LIST _popup_apply');
		var _this = this;
		if(data.id === 1001 || data.id === 1003){
			app._popupViewingClose();
        }else if(data.id === 1000){ // PAGE_SETTINGS_ESIM_DELETE_PROFILE
            _this.model = new m_ESIM_PROFILE_DEL();
            var model = _this.collection.at(_this.eventId);
            if(model){
                app._popupViewing(POPUP_LOADING);
                app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
                var profile_id = _this.eventId;
                var res = _this.model.set({ delete_esim: profile_id });
                _this.model.savePOST(false);
            }
            _this.interval = setInterval(function(){
                if(res._response == 1){
                    setTimeout(function(){location.reload()}, 500);
                    /*app._popupViewingClose();
                    clearInterval(_this.interval);
                    if(model){
                        model.destroyPOST(false);
                        _this.collection.trigger('sync');
                    }*/
                }else{
                    if(res._response == 'del error'){
                        app._popupViewingClose();
                        clearInterval(_this.interval);
                        app._popupViewing(POPUP_CONFIRM_TEMPLATE);
                        app.popup_view.model.set({
                            id: 1001,
                            title: getHTMLString(''),
                            info: getHTMLString('INVALID_SETTINGS'),
                            warn: '',
                            btn: getHTMLString('MAIN_BTN_OK') //OK
                        });
                    }
                }
            }, 5000);
		}else if(data.id === 1100){
				//console.log("delete_with_pw");
			_this.model = new m_ESIM_PROFILE_DEL_PASSWORD();
			var model = _this.collection.at(_this.eventId);
			if(model){
				var res = _this.model.set({ delete_esim: _this.eventId, esim_delete_password: app.popup_view.modelInput.get('esim_delete_password') });
				
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
				
				_this.model.savePOST(false);
			}
			_this.interval = setInterval(function(){
				if(res._response == 1){
					setTimeout(function(){location.reload()}, 500);
					/*app._popupViewingClose();
					clearInterval(_this.interval);
					if(model){
					    model.destroyPOST(false);
					    _this.collection.trigger('sync');
					}*/
				}else{
					if(res._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 6000);
		}else if(data.id === 1002){ // PAGE_SETTINGS_ESIM_DISABLE_PROFILE
			_this.model = new m_ESIM_PROFILE_EDIT();
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(model.attributes);
				popup_attr.eSIMProfileStatus = '0';
				var attr = _.omit(popup_attr, 'id');;
				var res_m = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				//model.savePOST(false);
				var res = _this.model.set({ disable_esim: _this.eventId });
				_this.model.savePOST(false);	
			}
			_this.interval = setInterval(function(){
				if(res._response){
					if(res._response == 1){
						setTimeout(function(){location.reload()}, 500);
						/*
						app._popupViewingClose();
						clearInterval(_this.interval);
						if(model){
							_this.collection.trigger('sync');
						}
						*/
					}else{
						app._popupViewingClose();
						clearInterval(_this.interval);
						_this.collection.fetch();
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1003,
							title: getHTMLString('PAGE_SETTINGS_ESIM_DISABLE_PROFILE'),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 5000);
		}else if(data.id === 1004){ // PAGE_SETTINGS_ESIM_ENABLE_PROFILE
			_this.model = new m_ESIM_PROFILE_EDIT();
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(model.attributes);
				popup_attr.eSIMProfileStatus = '1';
				var attr = _.omit(popup_attr, 'id');;
				var res_m = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				//model.savePOST(false);
				var res = _this.model.set({ enable_esim: _this.eventId });
				_this.model.savePOST(false);	
			}
			_this.interval = setInterval(function(){
				if(res._response){
					if(res._response == 1){
						setTimeout(function(){location.reload()}, 500);
						/*
						app._popupViewingClose();
						clearInterval(_this.interval);
						if(model){
							_this.collection.trigger('sync');
						}
						*/
					}else{
						app._popupViewingClose();
						clearInterval(_this.interval);
						_this.collection.fetch();
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1005,
							title: getHTMLString('PAGE_SETTINGS_ESIM_ENABLE_PROFILE'),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 5000);
		}else{
			app._popupViewingClose();
		}

	},
	updateList:function(){
		var _this = this;
		//console.log("PAGE_SETTINGS_ESIM_PROFILES_LIST: updateList");
		_this.collection.fetch();
	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES = Backbone.View.extend({
	name: "PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES",
	template: ''
	+'<div class="jioH2" langid="PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES">Add eSIM Profiles</div>'
	+'<div class="v_view"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="PAGE_SETTINGS_ESIM_ADD_ESIM" value="ADD ESIM">'
	+'</div>'
	+'</div>',
	model: null,
	modelBluetooth: null,
	modelProgress: null,
	v_view: null,
	apply1: {
                0: 'defaultSMDPAddress',
		1: 'activateCodeEnbable',
		2: 'activateCode',
		3: 'eSIMProfileDownload'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	model_change_status: 0,
	setBluetoothModel: function(m){
		this.modelBluetooth = m;
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_ESIM_ADD_PROFILES();
		_this.modelProgress = new m_SETTINGS_ESIM_ADD_PROFILES_PROGRESS();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.listenTo(_this.modelProgress, 'sync', _this.modelProgressSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
		_this.listenTo(_this.v_view.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		_this.model_change_status = 0;
	},
	modelProgressSync: function() {
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES:modelProgressSync');
		var _this = this;

		if(_this.model_change_status == 1){			
		  if (_this.modelProgress.attributes.Pogress == '1'){
			_this.model_change_status = 0;
			app._popupViewingClose();
			clearInterval(_this.interval);

			// update list
			//app.router_view.v_viewModelChange({event: 'updateList'});		
			setTimeout(function(){location.reload()}, 100);
		  }else if (_this.modelProgress.attributes.Pogress == '0'){
			_this.model_change_status = 0;
			app._popupViewingClose();
			clearInterval(_this.interval);

			// show error msg
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 2001,
				title: getHTMLString('PAGE_SETTINGS_ESIM_ESIM_PROFILES'),
				info: '',
				warn: getHTMLString('PAGE_SETTINGS_ESIM_ERROR_POPUP_PART_1')+'('+_this.modelProgress.attributes.error_code+')'+getHTMLString('PAGE_SETTINGS_ESIM_ERROR_POPUP_PART_2'),
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});			  
		  }else{

		  }
		}

	},
	modelSync: function() {
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES:modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		//console.log(_this.model);
		
		_this.model.attributes.eSIMProfileDownload = "";		

		// if(_response){
		// 	//console.log(_response);
		// }
		/*if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}*/

	},
	modelChange: function() {
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES:modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Default SMDP Adress',
				lang: 'PAGE_SETTINGS_ESIM_DEFAULT_SMDP_ADDRESS',
                                disable: true,
                                text: _this.model.get('defaultSMDPAddress'),
				data: ''
			},{
				str: 'Activate with Code',
				lang: 'PAGE_SETTINGS_ESIM_ACTIVATE_WITH_CODE',
				checked: true,
				data: ''
			},{
				str: 'Activation Code Token',
				lang: 'PAGE_SETTINGS_ESIM_ACTIVATE_CODE',
				input: true,
				disabled: true,
				data: ''
			},{
				str: 'eSIMProfileDownload',
				lang: '',
				input: true,
				hidden: true,
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
	},
	v_viewModelChange: function() {
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES:v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view.model.attributes);
		var activateCodeEnbable = v_attr.arr[1].data;
		var changed = false;
		if(activateCodeEnbable === '1'){
			_.map(v_attr.arr, function(v, k){
				if((Number(k) === 2) && v.disabled){ //activateCode
					v.disabled = false;
					changed = true;
				}
			});
		}else{
			_.map(v_attr.arr, function(v, k){
				if((Number(k) === 2) && !v.disabled){ //activateCode
					v.disabled = true;
					changed = true;
				}
			});
		}
		if(changed){
			//console.log(v_attr);
			_this.v_view.model.set(v_attr);
			_this.v_view.model.trigger('change');
		}
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES:btn_save');
		var _this = this;

		if(_this.modelBluetooth.get('BluetoothEnable').length == '0'){
			// show error msg
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 2002,
				title: getHTMLString('PAGE_SETTINGS_ESIM_ESIM_PROFILES'),
				info: getHTMLString('PAGE_SETTINGS_ESIM_NO_INTERNET'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});					
			return;
		}
		
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);
		//If the input token is invalid, when click the "ADD ESIM" on GUI, the INSTRUCTIONS should not popup.
		if(res == ""){
			app._popupViewing(POPUP_ESIM_ADD_INSTRUCTIONS);
		}
				
		app.popup_view.model.set({
				id: 2003,
				title: getHTMLString('PAGE_SETTINGS_ESIM_ESIM_PROFILES'),
				info: getHTMLString('PAGE_SETTINGS_ESIM_NO_INTERNET'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
		});					
		return;

	},
	_popup_apply: function(data){
		//console.log('PAGE_SETTINGS_ESIM_ADD_ESIM_PROFILES::_popup_apply', data);
		var _this = this;
		if (data.id === 2003){
		  app._popupViewingClose();
		  _this.v_view.model.attributes.arr[3].data = '1';
		  var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);		
		  //if(!_.isEmpty(_this.model.changed)){
				_this.model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('PAGE_SETTINGS_ESIM_ADDING_PLEASEWAIT') });
				
				// do get json every 5 seconds.
				_this.modelProgress.set({"Pogress": ""});
				_this.interval = setInterval(function(){
						_this.modelProgress.fetchOLDJSON();
				}, 5000);		
		  //}
		  

		}else if(data.id === 2002){
			app._popupViewingClose();
		}else{
			app._popupViewingClose();
		}

	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var POPUP_ESIM_ADD_INSTRUCTIONS = Backbone.View.extend({
	name: "POPUP_ESIM_ADD_INSTRUCTIONS",
	template: "",
	model: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupAddESIMInstructions.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log("renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
		}
	},
	btn_apply: function() {
		//console.log("POPUP_ESIM_ADD_INSTRUCTIONS::btn_apply");
		var _this = this;
		var attr = _this.model.attributes;
		if(app.router_view._popup_apply){
			app.router_view._popup_apply({ name: _this.name, id: attr.id });
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});


var PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS = Backbone.View.extend({
	name: "PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS",
	template: ''
	+'<div class="jioH2" langid="PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS">Bluetooth Settings</div>'
	+'<div class="v_view"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view: null,
	apply1: {
		0: 'BluetoothEnable',
		1: 'BTConenctedDev'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	model_change_status: 0,
	intervalUpdateData: 0,
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SETTINGS_ESIM_BLUETOOTH_SETTINGS();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view', _this.$el) });
		_this.listenTo(_this.v_view.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		_this.model_change_status = 0;
	},
	modelSync: function() {
		//console.log('PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS:modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		//console.log(_this.model);
		
		
		// if(_response){
		// 	//console.log(_response);
		// }
		if(_this.model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 3000);
		}
		if (_this.model.get('BluetoothEnable') == 1){
			_this.invokeIntervalUpdateData(false);

		}else{
			if (_this.intervalUpdateData){
				clearInterval(_this.intervalUpdateData);
				_this.intervalUpdateData = 0;				
			}else{

			}
		}


	},
	modelChange: function() {
		//console.log('PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS:modelChange');
		var _this = this;
		var BTConenctedDev = _this.model.get('BTConenctedDev');
		
		var set1 = {
			arr: [{
				str: 'Bluetooth Status',
				lang: 'PAGE_SETTINGS_ESIM_BLUETOOTH_STATUS',
				checked: true,
				data: ''
			},{
				str: 'Connected Device',
				lang: 'PAGE_SETTINGS_ESIM_CONNECTED_DEVICE',
				text: _this.getShowConnectedDevice()
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view], [_this.apply1]);
	},
	getShowConnectedDevice: function(){
		var _this = this;
		var BTConenctedDev = _this.model.get('BTConenctedDev');
		return _this.model.get('BluetoothEnable') == 1 ? (BTConenctedDev.length > 0 ? BTConenctedDev : '---') : '---';

	},
	v_viewModelChange: function() {
		//console.log('PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS:v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view.model.attributes);
		var BluetoothEnable = v_attr.arr[0].data;
		var changed = false;
		if(BluetoothEnable === '1'){
			var showDevice = _this.getShowConnectedDevice();
			_.map(v_attr.arr, function(v, k){
				if((Number(k) === 1) && showDevice != v.text){ //BTConenctedDev
					v.text = _this.getShowConnectedDevice();
					changed = true;
				}
			});
		}else{
			_.map(v_attr.arr, function(v, k){
				if((Number(k) === 1)  && '---' != v.text){ //BTConenctedDev
					v.text =  '---';
					changed = true;
				}
			});
		}
		if(changed){
			//console.log(v_attr);
			_this.v_view.model.set(v_attr);
			_this.v_view.model.trigger('change');
		}
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('PAGE_SETTINGS_ESIM_BLUETOOTH_SETTINGS:btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view], [_this.apply1]);		
		if(!_.isEmpty(_this.model.changed)){
				_this.model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
				if (_this.model.get('BluetoothEnable')  == 1){
					_this.invokeIntervalUpdateData(true);
				}

		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(data.id === 3001){
			app._popupViewingClose();
		}else{
			app._popupViewingClose();
		}

	},
	invokeIntervalUpdateData: function(bReset){
			var _this = this;
			var interval = 30000;
			if (bReset){
				clearInterval(_this.intervalUpdateData);
				_this.intervalUpdateData = 0;				
			}
			if (_this.intervalUpdateData){
			}else{
				//console.log("start querying json");
				_this.intervalUpdateData = setInterval(function(){
					_this.model.fetchOLDJSON();
				}, interval);
			}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
		
		if (_this.intervalUpdateData){
				clearInterval(_this.intervalUpdateData);
				_this.intervalUpdateData = 0;				
		}else{

		}
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SMS_INBOX = Backbone.View.extend({
	name: "PAGE_SMS_INBOX_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SMS_INBOX_TITLE">Inbox</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide mail_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();

	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view2 = new SMS_INBOX_LIST({ el: Backbone.$('.mail_list', _this.$el) });
	}
});

var SMS_INBOX_LIST = Backbone.View.extend({
	name: "SMS_INBOX_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+
`
<div class="jioTableHeaderButton2">
        <div class="jioH2"></div>
        <div class="jioTableSearchContainer">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <rect class="jioColorFillNone" width="24" height="24"></rect>
              <path class="jioColorFillPrimary" d="M-2713.8-1256.2a.674.674,0,0,1,0-.954l5.823-5.828a6.718,6.718,0,0,1-1.522-4.265,6.758,6.758,0,0,1,6.75-6.751,6.759,6.759,0,0,1,6.75,6.751,6.759,6.759,0,0,1-6.75,6.751,6.719,6.719,0,0,1-4.275-1.53l-5.823,5.829a.672.672,0,0,1-.476.2A.67.67,0,0,1-2713.8-1256.2Zm5.609-11.048a5.449,5.449,0,0,0,5.443,5.443,5.45,5.45,0,0,0,5.444-5.443,5.45,5.45,0,0,0-5.444-5.444A5.449,5.449,0,0,0-2708.193-1267.249Z" transform="translate(2717 1277)"></path>
            </svg>
          </div>
          <div>
            <input type="text" id="searchInput" class="jioTableSearchInput" placeholder="Search" autocomplete="off">
          </div>
        </div>
        <div></div>
        <div></div>
        <button id="composeNewSMS" class="jioIconButtonSet">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-2355.126,5587a1.876,1.876,0,0,1-1.874-1.875v-13.332a1.875,1.875,0,0,1,1.874-1.873h9.631a.642.642,0,0,1,.643.643.642.642,0,0,1-.643.643h-9.631a.588.588,0,0,0-.588.587v13.332a.589.589,0,0,0,.588.588h13.337a.59.59,0,0,0,.589-.588V5575.5a.643.643,0,0,1,.643-.643.644.644,0,0,1,.643.643v9.627a1.877,1.877,0,0,1-1.875,1.875Zm5.3-7.72a26.533,26.533,0,0,1,1.119-2.589.318.318,0,0,1,.28-.179.246.246,0,0,1,.176.071l1.671,1.671a.292.292,0,0,1-.107.456,26.656,26.656,0,0,1-2.59,1.12.829.829,0,0,1-.291.06C-2349.854,5579.888-2349.969,5579.656-2349.827,5579.278Zm4.122-1.821-1.75-1.751a.208.208,0,0,1,0-.294l6.229-6.229a.623.623,0,0,1,.442-.183.624.624,0,0,1,.441.182l1.162,1.164a.623.623,0,0,1,0,.882l-6.229,6.229a.211.211,0,0,1-.147.061A.209.209,0,0,1-2345.706,5577.457Z" transform="translate(2359.999 -5566)"></path>
          </svg>
          <div langid="SMS_INBOX_14">Compose SMS</div>
        </button>
        <button id="deleteSMS" class="jioIconButtonSet">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-1800.824-1829.4a2.506,2.506,0,0,1-2.521-2.485v-11.521h-1.4a.647.647,0,0,1-.652-.643.647.647,0,0,1,.652-.643h3.426v-.223a.844.844,0,0,1,.009-.12,2.494,2.494,0,0,1,2.512-2.366h3.8a2.507,2.507,0,0,1,2.521,2.486v.223h3.426a.648.648,0,0,1,.652.643.648.648,0,0,1-.652.643h-1.4v11.521a.843.843,0,0,1-.009.119,2.5,2.5,0,0,1-2.512,2.366Zm-1.217-2.485a1.21,1.21,0,0,0,1.217,1.2h7.845a1.2,1.2,0,0,0,1.21-1.154c0-.027,0-.052.007-.077v-11.489h-10.28Zm2.029-13.075c0,.027,0,.053-.007.078v.191h6.235v-.223a1.209,1.209,0,0,0-1.217-1.2h-3.8A1.2,1.2,0,0,0-1800.012-1844.962Zm5.4,11.514v-6.93a.647.647,0,0,1,.652-.643.647.647,0,0,1,.652.643v6.93a.647.647,0,0,1-.652.643A.647.647,0,0,1-1794.616-1833.448Zm-2.937,0v-6.93a.648.648,0,0,1,.652-.643.648.648,0,0,1,.653.643v6.93a.648.648,0,0,1-.653.643A.648.648,0,0,1-1797.553-1833.448Zm-2.937,0v-6.93a.648.648,0,0,1,.653-.643.647.647,0,0,1,.652.643v6.93a.647.647,0,0,1-.652.643A.648.648,0,0,1-1800.49-1833.448Z" transform="translate(1808.901 1850.4)"></path>
          </svg>
          <div langid="SMS_INBOX_15">Delete Selected</div>
        </button>
        <div class="jioSMSlabel">
          <label><span class="startOfCurrentPage">0</span>—<span class="endOfCurrentPage">0</span> of <span class="totalNum">0</span></label>
        </div>
        <div class="jioIcon32" id="previousPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(-2388 -2856) rotate(180)"></path>
          </svg>
        </div>
        <div class="jioIcon32" id="nextPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(2420 2888)"></path>
          </svg>
        </div>
      </div>
`
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	v_view1: null,
	ar_dataCurrentlyView: [],
	maxInOnePage: 10,
	idxStartOfCurrentPage: 0,	
	model_listeningSync: null,
	islog: false,
	eventId: 0,
	events: {
		'click #previousPage': 'onpreviousPage',
		'click #nextPage': 'onnextPage',
		
		'click #deleteSMS': 'onDeleteSMS',
		'click #composeNewSMS': 'onComposeNewSMS',
		'keyup #searchInput': 'onDisplaySearchItems'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SMS_INBOX();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		Backbone.$('#searchInput', _this.$el).attr('placeholder', getHTMLString('SMS_INBOX_16'));
		transHTMLString(_this.$el);
		
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.collection.fetch();
	},
	collectionSync: function() {
		// console.log(this.name, 'collectionSync');
		var _this = this;
		_this.UpdateListViewWithCriteria('', _this.maxInOnePage);
		_this.$('#deleteSMS').attr('disabled', 'disabled');		

	},
	modelDeleteListeningSync: function() {
		//console.log(this.name, 'modelDeleteListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					var arIdx = _this.model_listeningSync.get('delete_sms').split(',').reverse();
					var arModels = [];
					arIdx.forEach(function(e){
						var model_collection = _this.collection.at(e);
						if(model_collection){
							model_collection.destroyPOST(false); // send to server
						}
						arModels.push(model_collection);
					});
					//_this.collection.remove(arModels); // not send to server
					_this.collection.trigger('sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	modelListeningSync: function() {
		//console.log(this.name, 'modelListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	UpdateListView: function(from_lists){
		//console.log(this.name, 'UpdateListView');
		var _this = this;
		
		var lists = [];
		var tr = [];
		var i;
		
		for (i = _this.idxStartOfCurrentPage; 
			 (i < _this.idxStartOfCurrentPage + _this.maxInOnePage) && (i < from_lists.length);
			 i++
			){
				
			var val = from_lists[i];
			var key = i;
			tr.push({
				id: key,
				ex_class: val.select ? "jioTableRowSelect"	: "",	
				require_row_event: true
			});
			lists.push([
				{
					id: key,
					checkbox: true,
					stopPropagation: true,
					str: val.check ? '1' : '0'
				},{
					id: key,
					str: val.name,
					ex_class: "jioSMSnamecolomn"
				},{
					id: key,
					str: val.message,
					ex_class: "jioTableSMSContent"
				},{
					str: val.select ? val.date	: val.date_short,
					ex_class: "jioSMSdatecolomn"
					
				},{
					id: key,
					btn: (val.select ? 
							  [{	type: 'reply', stopPropagation: true}, {type: 'forward', stopPropagation: true}, {type: 'del', stopPropagation: true}]	
							: [{	type: 'dummy'}, {type: 'dummy'}, {type: 'del', stopPropagation: true}]),
					
				}
			]);			
		}

		_this.v_view1.model.set({ /*head: head,*/ lists: lists, tr:tr });		

		_this.$('.totalNum').text(_this.ar_dataCurrentlyView.length);
		_this.$('.startOfCurrentPage').text(lists.length ? _this.idxStartOfCurrentPage + 1 : 0);
		_this.$('.endOfCurrentPage').text(_this.idxStartOfCurrentPage + lists.length);
		

	},
	_list_event: function(v) {
		//console.log(this.name, ' _list_event');
		var _this = this;
		//console.log(v);
		if(v.type === 'del'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);
			if(model_collection){
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 1000,
						title: getHTMLString('SMS_INBOX_1'),
						info: getHTMLString('SMS_INBOX_2'),
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});
			}
		}else if(v.type === 'forward'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			app._popupViewing(POPUP_COMMON_INPUT_WITH_TEMPLATE_FILE, { template_file: 'templates/jioPOPUP_SMS_FORWARD.html'});
			app.popup_view.modelInput = new m_SMS_FORWARD();
			app.popup_view.modelInput.set({
				"sms_msg" : curd.message,
				"sms_forward_original_from" : curd.name,
				"sms_forward_idx" : curd.id_collection
			});			
			app.popup_view.model.set({
				id: 2000,
				"sms_msg" : curd.message,
				"sms_forward_original_from" : curd.name,
				"sms_forward_idx" : curd.id_collection

			});
			
		}else if(v.type === 'reply'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			app._popupViewing(POPUP_SMS_REPLY, { template_file: 'templates/jioPOPUP_SMS_REPLY.html'});
			app.popup_view.modelInput = new m_SMS_REPLY();
			app.popup_view.modelInput.set({
				"sms_to" : curd.name,
				"sms_reply_idx" : curd.id_collection
			});			
			app.popup_view.model.set({
				id: 4000,
				"sms_to" : curd.name,
				"sms_reply_idx" : curd.id_collection

			});
		}else if (v.type === 'checkbox'){
			var cur = _this.ar_dataCurrentlyView[v.id];
			cur.check = cur.check ? false : true;
			_this.UpdateListView(_this.ar_dataCurrentlyView);	
			if (cur.check){
				_this.$('#deleteSMS').removeAttr('disabled');
			}else{
				if (_this.ar_dataCurrentlyView.find(function(o){ return o.check;}) == undefined){
					// not found 
					_this.$('#deleteSMS').attr('disabled', 'disabled');
				}else{
					_this.$('#deleteSMS').removeAttr('disabled');
				}
			}
			
		}else if (v.type === 'row'){
			_this.ar_dataCurrentlyView.forEach(function (item, index) {
				item.select = false;
			});
			var curd = _this.ar_dataCurrentlyView[v.id];			
			curd.select = true;
			_this.UpdateListView(_this.ar_dataCurrentlyView);
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		var _this = this;
		if(data.id === 1000){  // delete
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];

			_this.sendDeleteAndWaitForResponse([event_obj.id_collection]);
			return;

		}else if(data.id === 2000){ //forward
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];
		  var eventModel = new m_SMS_FORWARD();
			
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
			

		}else if(data.id === 4000){ //reply
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];
		  var eventModel = new m_SMS_REPLY();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
		}else if(data.id === 5000){ //compose
			var eventModel = new m_SMS_COMPOSE();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
		}else if(data.id === 6000){ //delete selected
		
			var arSelected = [];			
			_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					arSelected.push(val.id_collection);
				}
			});

			if(arSelected.length > 0){
			  _this.sendDeleteAndWaitForResponse(arSelected);
			}
			return;
		}else{
			app._popupViewingClose();
		}
	},
	sendDeleteAndWaitForResponse: function(arIdxDel){
		//console.log(this.name, "sendDeleteAndWaitForResponse");
			var _this = this;		
			var working_model = new m_SMS_INBOX_DEL();
			var res = working_model.set({ delete_sms: arIdxDel.toString() });

			_this.model_listeningSync = working_model;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelDeleteListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	sendSMSAndWaitForResponse: function(modelSent, modelData){
		var _this = this;			
			var attrinput = _.clone(modelData.attributes);
			var attr = _.omit(attrinput, 'id');
			var res = modelSent.set(attr);

			_this.model_listeningSync = modelSent;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	onComposeNewSMS: function(){
		//console.log(this.name, 'onComposeNewSMS');
		var _this = this;
			app._popupViewing(POPUP_SMS_COMPOSE, { template_file: 'templates/jioPOPUP_SMS_COMPOSE.html'});
			app.popup_view.modelInput = new m_SMS_COMPOSE();
			app.popup_view.model.set({
				id: 5000,
				"sms_to" : '',
				"sms_msg" : ''

			});
	},
	onDeleteSMS: function(){
		//console.log(this.name, 'onDeleteSMS');
		var _this = this;
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 6000,
						title: getHTMLString('SMS_INBOX_1'),
						info: getHTMLString('SMS_INBOX_2'),
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	onpreviousPage: function(){
		var _this = this;
		_this.idxStartOfCurrentPage -= _this.maxInOnePage;
		if (_this.idxStartOfCurrentPage < 0) _this.idxStartOfCurrentPage = 0;
			
		_this.UpdateListView(_this.ar_dataCurrentlyView);
		
	},
	onnextPage: function(){
		var _this = this;
		var nextStart = _this.idxStartOfCurrentPage + _this.maxInOnePage;
		if (nextStart >= _this.ar_dataCurrentlyView.length){
		}else{			
			_this.idxStartOfCurrentPage = nextStart;
			_this.UpdateListView(_this.ar_dataCurrentlyView);	
		}
	},

	onDisplaySearchItems: function(e){
		//console.log(this.name, 'onDisplaySearchItems');
		var _this = this;
		var search = $('#searchInput').val();
		_this.UpdateListViewWithCriteria(search, _this.maxInOnePage);
	},
	UpdateListViewWithCriteria: function(search, numberInOnePage){
		var _this = this;
		_this.idxStartOfCurrentPage = 0;
		_this.ar_dataCurrentlyView = [];	
		var c_lists = _this.collection.toJSON();	
		
		if (search.length > 0){
		  _.map(c_lists, function (val, key) {
			if (val.name.search(search) >= 0){
				var date_short = val.date.split('-')[0].trim();
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					name: val.name,
					date_short: date_short,
					date: val.date,
					message: val.message
					}
				);
			}
		  });
		
		}else{
		  _.map(c_lists, function (val, key) {
				var date_short = val.date.split('-')[0].trim();
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					name: val.name,
					date_short: date_short,
					date: val.date,
					message: val.message
					}
				);
		  });
		}
		_this.UpdateListView(_this.ar_dataCurrentlyView);

	},
	render: function() {
		//console.log('render');
	}
});


var POPUP_COMMON_INPUT_WITH_TEMPLATE_FILE = Backbone.View.extend({
	name: "POPUP_COMMON_INPUT_WITH_TEMPLATE_FILE",
	template: "",
	template_file: "",
	model: null,
	modelInput: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply',		
		'input textarea': 'editChange',
		'keypress input[type="text"]': 'editChange'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.template_file = o.template_file;
		
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get(_this.template_file +'?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				//_this.$el.html(_this.template());
				transHTMLString(_this.$el);
				//_this.render();
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log(this.name, "renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			_this.listenTo(_this.modelInput, 'change', _this.modelInputChange);
		}
	},
	modelInputChange: function() {
		//console.log(this.name, "modelInputChange');
		var _this = this;
	},
	editChange: function(e){
		//console.log(this.name+" editChange");
		//console.log(e);
		var _this = this;
		_this.$(e.target).attr('modified', 'modified');
	},
	btn_apply: function() {
		//console.log(this.name+" btn_apply");
		var _this = this;
		
		var modelInput = _this.modelInput;
		var modelInput_attr = _.clone(modelInput.attributes);
		var attr = _.omit(modelInput_attr, 'id');
		var changedValues = {};
		Object.keys(attr).forEach(key => {
			
			_this.$('.'+key).closest('.jioInputContainer').find('.JioErrorLabel').removeClass('JioErrorLabelVisible');	
			_this.$('.'+key).closest('.jioInputContainer').removeClass('jioInputError');	 				

			if (_this.$('.'+key).attr("modified") == "modified"){
				changedValues[key] = _this.$('.'+key).val();
			}
		});
		modelInput.set(changedValues);
		var err = _this.validateInputs(modelInput);
		//console.log(err);
		if (err.length > 0){
		  _.map(err, function (val, key) {							
					var errorMsg = getHTMLString(val.msg);
					_this.$('.'+val.key).closest('.jioInputContainer').find('.JioErrorLabel').text(errorMsg).addClass('JioErrorLabelVisible');	
					_this.$('.'+val.key).closest('.jioInputContainer').addClass('jioInputError');
		  });
		  
		}else{
			if(app.router_view._popup_apply){
				app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id });
			}
		}		

	},
    validateInputs: function (model, views, applys) {
        var _this = this;
        var attr = _.clone(model.attributes);

        var res = model.set(attr);
        var validationError = [];
		//console.log(model);
        if(res.isValid()){
			//console.log("valid", res);
        }else{
			//console.log("error ", res);
            validationError = _.clone(res.validationError);
        }
        return validationError;
    },
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
	},
	render: function() {
		//console.log("render");
	}
});

var POPUP_SMS_REPLY = Backbone.View.extend({
	name: "POPUP_SMS_REPLY",
	template: "",
	template_file: "",
	model: null,
	modelInput: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply',
		'input textarea': 'textAreaEditChange',
		'keypress input[type="text"]': 'editChange'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.template_file = o.template_file;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.model, 'change', _this.renderChange);
		if(_this.template === ""){
			Backbone.$.get(_this.template_file +'?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				transHTMLString(_this.$el);
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log(this.name+" renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			_this.listenTo(_this.modelInput, 'change', _this.modelInputChange);
		}
	},
	modelInputChange: function() {
		//console.log(this.name+" modelInputChange");
		var _this = this;
	},
	editChange: function(e){
		//console.log(this.name+" editChange", e);
		var _this = this;
		_this.$(e.target).attr('modified', 'modified');		
	},
	textAreaEditChange: function(e){
		//console.log(this.name+" textAreaEditChange", e);
		var _this = this;
		_this.$(e.target).attr('modified', 'modified');		
		var sms_msg = _this.$('.sms_msg').val();		
		_this.$('#textSizeEntered').text(sms_msg.length + '/160');		
	},
	btn_apply: function() {
		//console.log(this.name+" btn_apply test");
		var _this = this;
		
		var modelInput = _this.modelInput;
		var modelInput_attr = _.clone(modelInput.attributes);
		var attr = _.omit(modelInput_attr, 'id');
		var changedValues = {};
		Object.keys(attr).forEach(key => {			
			_this.$('.'+key).closest('.jioInputContainer').find('.JioErrorLabel').removeClass('JioErrorLabelVisible');	
			_this.$('.'+key).closest('.jioInputContainer').removeClass('jioInputError');	 				
			if (_this.$('.'+key).attr("modified") == "modified"){
				changedValues[key] = _this.$('.'+key).val();
			}
		});
		modelInput.set(changedValues);
		var err = _this.validateInputs(modelInput);
		if (err.length > 0){
		  _.map(err, function (val, key) {							
					var errorMsg = getHTMLString(val.msg);
					_this.$('.'+val.key).closest('.jioInputContainer').find('.JioErrorLabel').text(errorMsg).addClass('JioErrorLabelVisible');	
					_this.$('.'+val.key).closest('.jioInputContainer').addClass('jioInputError');
		  });		  
		}else{
			if(app.router_view._popup_apply){
				app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id });
			}
		}		

	},
    validateInputs: function (model, views, applys) {
        var _this = this;
        var attr = _.clone(model.attributes);
        var res = model.set(attr);
        var validationError = [];
        if(res.isValid()){
        }else{
            validationError = _.clone(res.validationError);
        }
        return validationError;
    },
	btn_close: function() {
		app._popupViewingClose();
	},
	_close: function() {
	},
	render: function() {
	}
});

var POPUP_SMS_COMPOSE = POPUP_SMS_REPLY.extend({
	name: "POPUP_SMS_COMPOSE",
});
var POPUP_SMS_GROUP_SEND = POPUP_SMS_REPLY.extend({
	name: "POPUP_SMS_GROUP_SEND",
	btn_apply: function() {
		//console.log(this.name+" btn_apply test");
		var _this = this;
		
		var modelInput = _this.modelInput;
		var modelInput_attr = _.clone(modelInput.attributes);
		var attr = _.omit(modelInput_attr, 'id');
		var changedValues = {};
		Object.keys(attr).forEach(key => {			
			_this.$('.'+key).closest('.smsTextBoxContainer').find('.JioErrorLabel').removeClass('JioErrorLabelVisible');	
			_this.$('.'+key).closest('.smsTextBoxContainer').removeClass('jioInputError');	 				
			if (_this.$('.'+key).attr("modified") == "modified"){
				changedValues[key] = _this.$('.'+key).val();
			}
		});
		modelInput.set(changedValues);
		var err = _this.validateInputs(modelInput);
		if (err.length > 0){
		  _.map(err, function (val, key) {							
					var errorMsg = getHTMLString(val.msg);
					_this.$('.'+val.key).closest('.smsTextBoxContainer').find('.JioErrorLabel').text(errorMsg).addClass('JioErrorLabelVisible');	
					_this.$('.'+val.key).closest('.smsTextBoxContainer').addClass('jioInputError');
		  });		  
		}else{
			if(app.router_view._popup_apply){
				app.router_view._popup_apply({ name: _this.name, id: _this.model.attributes.id });
			}
		}		

	},
});


var PAGE_SMS_CONTACTS = Backbone.View.extend({
	name: "PAGE_SMS_CONTACTS_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SMS_CONTACTS_TITLE"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide mail_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();

	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view2 = new SMS_CONTACTS_LIST({ el: Backbone.$('.mail_list', _this.$el) });
	}
});

var SMS_CONTACTS_LIST = Backbone.View.extend({
	name: "SMS_CONTACTS_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+
`
<div class="jioTableHeaderButton3">
        <div class="jioH2"></div>
        <div class="jioTableSearchContainer">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <rect class="jioColorFillNone" width="24" height="24"></rect>
              <path class="jioColorFillPrimary" d="M-2713.8-1256.2a.674.674,0,0,1,0-.954l5.823-5.828a6.718,6.718,0,0,1-1.522-4.265,6.758,6.758,0,0,1,6.75-6.751,6.759,6.759,0,0,1,6.75,6.751,6.759,6.759,0,0,1-6.75,6.751,6.719,6.719,0,0,1-4.275-1.53l-5.823,5.829a.672.672,0,0,1-.476.2A.67.67,0,0,1-2713.8-1256.2Zm5.609-11.048a5.449,5.449,0,0,0,5.443,5.443,5.45,5.45,0,0,0,5.444-5.443,5.45,5.45,0,0,0-5.444-5.444A5.449,5.449,0,0,0-2708.193-1267.249Z" transform="translate(2717 1277)"></path>
            </svg>
          </div>
          <div>
            <input type="text" id="searchInput" class="jioTableSearchInput" placeholder="Search" autocomplete="off">
          </div>
        </div>
        <div></div>
        <button id="createNew" class="jioIconButtonSet">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-2355.126,5587a1.876,1.876,0,0,1-1.874-1.875v-13.332a1.875,1.875,0,0,1,1.874-1.873h9.631a.642.642,0,0,1,.643.643.642.642,0,0,1-.643.643h-9.631a.588.588,0,0,0-.588.587v13.332a.589.589,0,0,0,.588.588h13.337a.59.59,0,0,0,.589-.588V5575.5a.643.643,0,0,1,.643-.643.644.644,0,0,1,.643.643v9.627a1.877,1.877,0,0,1-1.875,1.875Zm5.3-7.72a26.533,26.533,0,0,1,1.119-2.589.318.318,0,0,1,.28-.179.246.246,0,0,1,.176.071l1.671,1.671a.292.292,0,0,1-.107.456,26.656,26.656,0,0,1-2.59,1.12.829.829,0,0,1-.291.06C-2349.854,5579.888-2349.969,5579.656-2349.827,5579.278Zm4.122-1.821-1.75-1.751a.208.208,0,0,1,0-.294l6.229-6.229a.623.623,0,0,1,.442-.183.624.624,0,0,1,.441.182l1.162,1.164a.623.623,0,0,1,0,.882l-6.229,6.229a.211.211,0,0,1-.147.061A.209.209,0,0,1-2345.706,5577.457Z" transform="translate(2359.999 -5566)"></path>
          </svg>
          <div langid="SMS_CONTACTS_5">Create Contact</div>
        </button>
        <button id="deleteSelected" class="jioIconButtonSet" disabled="disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-1800.824-1829.4a2.506,2.506,0,0,1-2.521-2.485v-11.521h-1.4a.647.647,0,0,1-.652-.643.647.647,0,0,1,.652-.643h3.426v-.223a.844.844,0,0,1,.009-.12,2.494,2.494,0,0,1,2.512-2.366h3.8a2.507,2.507,0,0,1,2.521,2.486v.223h3.426a.648.648,0,0,1,.652.643.648.648,0,0,1-.652.643h-1.4v11.521a.843.843,0,0,1-.009.119,2.5,2.5,0,0,1-2.512,2.366Zm-1.217-2.485a1.21,1.21,0,0,0,1.217,1.2h7.845a1.2,1.2,0,0,0,1.21-1.154c0-.027,0-.052.007-.077v-11.489h-10.28Zm2.029-13.075c0,.027,0,.053-.007.078v.191h6.235v-.223a1.209,1.209,0,0,0-1.217-1.2h-3.8A1.2,1.2,0,0,0-1800.012-1844.962Zm5.4,11.514v-6.93a.647.647,0,0,1,.652-.643.647.647,0,0,1,.652.643v6.93a.647.647,0,0,1-.652.643A.647.647,0,0,1-1794.616-1833.448Zm-2.937,0v-6.93a.648.648,0,0,1,.652-.643.648.648,0,0,1,.653.643v6.93a.648.648,0,0,1-.653.643A.648.648,0,0,1-1797.553-1833.448Zm-2.937,0v-6.93a.648.648,0,0,1,.653-.643.647.647,0,0,1,.652.643v6.93a.647.647,0,0,1-.652.643A.648.648,0,0,1-1800.49-1833.448Z" transform="translate(1808.901 1850.4)"></path>
          </svg>
          <div langid="SMS_CONTACTS_6">Delete Selected</div>
        </button>
        <button id="moveToGroup" class="jioIconButtonSet" disabled="disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-17889.285-4395.833a1.569,1.569,0,0,1-1.547-1.588,7.074,7.074,0,0,1,6.959-7.166,6.769,6.769,0,0,1,2.01.3h0a5.45,5.45,0,0,1,3.512-1.3,5.6,5.6,0,0,1,5.518,5.677,1.359,1.359,0,0,1-1.338,1.375h-2.82a7.4,7.4,0,0,1,.082,1.108,1.569,1.569,0,0,1-1.547,1.588Zm-.262-1.588a.27.27,0,0,0,.262.275h10.828a.27.27,0,0,0,.262-.275,5.774,5.774,0,0,0-5.678-5.852A5.773,5.773,0,0,0-17889.547-4397.422Zm15.375-2.421a.062.062,0,0,0,.051-.062,4.305,4.305,0,0,0-4.23-4.367,4.122,4.122,0,0,0-2.127.595,7.152,7.152,0,0,1,3.16,3.835Zm-13.369-9.217a3.728,3.728,0,0,1,3.668-3.774,3.667,3.667,0,0,1,3.332,2.2,2.825,2.825,0,0,1,2.3-1.2,2.892,2.892,0,0,1,2.85,2.93,2.9,2.9,0,0,1-2.85,2.934,2.832,2.832,0,0,1-2.385-1.33,3.658,3.658,0,0,1-3.248,2.021A3.729,3.729,0,0,1-17887.541-4409.06Zm1.287,0a2.428,2.428,0,0,0,2.381,2.463,2.424,2.424,0,0,0,2.381-2.463,2.421,2.421,0,0,0-2.381-2.46A2.425,2.425,0,0,0-17886.254-4409.06Zm6.449.151a1.593,1.593,0,0,0,1.564,1.62,1.6,1.6,0,0,0,1.568-1.62,1.6,1.6,0,0,0-1.568-1.621A1.593,1.593,0,0,0-17879.8-4408.908Z" transform="translate(17893.832 4416.333)"></path>
          </svg>
          <div langid="SMS_CONTACTS_7">Move to Group</div>
        </button>
        <div class="jioSMSlabel">
          <label><span class="startOfCurrentPage">0</span>—<span class="endOfCurrentPage">0</span> of <span class="totalNum">0</span></label>
        </div>
        <div class="jioIcon32" id="previousPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(-2388 -2856) rotate(180)"></path>
          </svg>
        </div>
        <div class="jioIcon32" id="nextPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(2420 2888)"></path>
          </svg>
        </div>
      </div>
`
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_groups: null,
	v_view1: null,
	ar_dataCurrentlyView: [],
	header_dataCurrentlyView: { 
		check: false 
	},
	maxInOnePage: 10,
	idxStartOfCurrentPage: 0,	
	model_listeningSync: null,
	islog: false,
	eventId: 0,
	applyAdd: {
		0: "name",
		1: "number",
		2: "group",
		3: "new_group"
	},
	setAdd: {
		arr: [{
				str: 'Name',
				lang: 'SMS_CONTACTS_1',
				input: true,
				data: ''

			},{
				str: 'Number',
				lang: 'SMS_CONTACTS_2',
				input: true,
				data: ''
			},{
				str: 'Select Group',
				lang: 'SMS_CONTACTS_9',
				dropdown: true,
				placeholder: 'SMS_CONTACTS_12',
				visible: false,
				options: [],
				data: ''
			},{
				str: 'New Group',
				lang: 'SMS_CONTACTS_10',
				input: true,
				disabled: false,
				data: ''
			}],
	},
	applyEdit: {
		0: "number",
		1: "name",
		2: "group",
		3: "new_group"
	},
	setEdit: {
		arr: [{
				str: 'Number',
				lang: 'SMS_CONTACTS_2',
				staticText: true,
				data: ''
			},{
				str: 'Name',
				lang: 'SMS_CONTACTS_1',
				input: true,
				data: ''
			},{
				str: 'Change Group',
				lang: 'SMS_CONTACTS_14',
				dropdown: true,
				placeholder: 'SMS_CONTACTS_12',
				visible: false,
				options: [],
				data: ''
			},{
				str: 'New Group',
				lang: 'SMS_CONTACTS_10',
				input: true,
				disabled: true,
				data: ''
			}],
	},
	applyMoveToGroup: {
		0: "names",
		1: "present_groups",
		2: "group"
	},
	setMoveToGroup: {
		arr: [{
				str: 'Number',
				lang: 'SMS_CONTACTS_2',
				staticText: true,
				data: ''
			},{
				str: 'Number',
				lang: 'SMS_CONTACTS_2',
				staticText: true,
				data: ''
			},{
				str: 'Change Group',
				lang: 'SMS_CONTACTS_14',
				dropdown: true,
				placeholder: 'SMS_CONTACTS_12',
				visible: false,
				options: [],
				data: ''

			}],
	},
	events: {
		'click #previousPage': 'onpreviousPage',
		'click #nextPage': 'onnextPage',
		
		'click #deleteSelected': 'ondeleteSelected',
		'click #moveToGroup': 'onmoveToGroup',
		'click #createNew': 'oncreateNew',
		'keyup #searchInput': 'onDisplaySearchItems'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SMS_CONTACTS();
		_this.collection_groups = new c_SMS_GROUPS();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.listenTo(_this.collection_groups, 'sync', _this.collectionGroupsSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		Backbone.$('#searchInput', _this.$el).attr('placeholder', getHTMLString('SMS_INBOX_16'));
		transHTMLString(_this.$el);
		
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.collection.fetch();
		_this.collection_groups.fetch();
	},
	collectionGroupsSync: function() {
		// console.log(this.name, 'collectionGroupsSync');
		var _this = this;
		var c_lists = _this.collection_groups.toJSON();	
		var ar_groups = [];
		  _.map(c_lists, function (val, key) {
				ar_groups.push(
					{
					str: val.name,
					lang: '',
					data: val.name
					}
				);
		  });
		  _this.setAdd.arr[2].options = ar_groups;				
		  _this.setEdit.arr[2].options = ar_groups;
		  _this.setMoveToGroup.arr[2].options = ar_groups;		  

	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync');
		var _this = this;
		_this.UpdateListViewWithCriteria('', _this.maxInOnePage);
		_this.$('#deleteSelected').attr('disabled', 'disabled');
		_this.$('#moveToGroup').attr('disabled', 'disabled');		

	},
	modelDeleteListeningSync: function() {
		//console.log(this.name, 'modelDeleteListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					var arIdx = _this.model_listeningSync.get('delete_sms').split(',').reverse();
					var arModels = [];
					arIdx.forEach(function(e){
						var model_collection = _this.collection.at(e);
						if(model_collection){
							model_collection.destroyPOST(false); // send to server
						}
						arModels.push(model_collection);
					});
					//_this.collection.remove(arModels); // not send to server
					_this.collection.trigger('sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	modelListeningSync: function() {
		//console.log(this.name, 'modelListeningSync');
		var _this = this;
		_this.modelListeningSyncFunction(false);

	},
	modelListeningSync_updateCollection: function() {
		//console.log(this.name, 'modelListeningSync_updateCollection');
		var _this = this;
		_this.modelListeningSyncFunction(true);
	},
	modelListeningSyncFunction: function(bUpdateCollection) {
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					if (bUpdateCollection){
						_this.collection.fetch();
						_this.collection_groups.fetch();
					}
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	UpdateListView: function(from_lists, header){
		//console.log(this.name, 'UpdateListView');
		var _this = this;
		
		var lists = [];
		var tr = [];
		var i;

		var head = [
		{
					checkbox: true,
					id: -1,
					str:  header.check ? '1' : '0'
		},{
			sort: true,
			lang: "SMS_CONTACTS_1",
			str: "Name"
		},{
			sort: true,
			lang: "SMS_CONTACTS_2",
			str: "Number"
		},{
			sort: true,
			lang: "SMS_CONTACTS_3",
			str: "Group"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		
		for (i = _this.idxStartOfCurrentPage; 
			 (i < _this.idxStartOfCurrentPage + _this.maxInOnePage) && (i < from_lists.length);
			 i++
			){
				
			var val = from_lists[i];
			var key = i;
			tr.push({
				id: key,
				ex_class: val.select ? "jioTableRowSelect"	: "",			
			});
			lists.push([
				{
					id: key,
					checkbox: true,
					stopPropagation: true,
					str: val.check ? '1' : '0'
				},{
					id: key,
					str: val.name,
					ex_class: "jioSMSnamecolomn"
				},{
					id: key,
					str: val.number
				},{
					id: key,
					str: val.group.length > 0 ? val.group : '---'
					
				},{
					id: key,
					btn: [{	type: 'edit', stopPropagation: true}, {type: 'message', stopPropagation: true}, {type: 'del', stopPropagation: true}]
					
				}
			]);			
		}

		_this.v_view1.model.set({ head: head, lists: lists, tr:tr });		

		_this.$('.totalNum').text(_this.ar_dataCurrentlyView.length);
		_this.$('.startOfCurrentPage').text(lists.length ? _this.idxStartOfCurrentPage + 1 : 0);
		_this.$('.endOfCurrentPage').text(_this.idxStartOfCurrentPage + lists.length);
		

	},
	_list_event: function(v) {
		//console.log(this.name, ' _list_event');
		var _this = this;
		//console.log(v);
		if(v.type === 'del'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);
			if(model_collection){
				_this.popupDeleteMsg([model_collection], 'delete');
			}

		}else if(v.type === 'message'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);
			app._popupViewing(POPUP_SMS_COMPOSE, { template_file: 'templates/jioPOPUP_SMS_CONTACT_COMPOSE.html'});
			app.popup_view.modelInput = new m_SMS_COMPOSE({
				"sms_to" : model_collection.get('name'),
				"sms_to_idx" : curd.id_collection
				});
			app.popup_view.model.set({
				id: 'message',
				"sms_to" : model_collection.get('name'),
				"sms_msg" : ''
			});

		}else if (v.type === 'checkbox'){			
			if (v.id == -1){			
				// header checkbox
				var header =  _this.header_dataCurrentlyView;
				header.check = header.check ? false : true;
				var i;
				for (i = 0; (i < _this.ar_dataCurrentlyView.length); i++){
					var cur = _this.ar_dataCurrentlyView[i];
					cur.check = header.check;
				}				
				_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);	
				if (header.check){
				  if (_this.ar_dataCurrentlyView.length > 0){
					_this.$('#deleteSelected').removeAttr('disabled');
					if (_this.collection_groups.length > 0){
						_this.$('#moveToGroup').removeAttr('disabled');
					}
				  }
				}else{
						_this.$('#deleteSelected').attr('disabled', 'disabled');
						_this.$('#moveToGroup').attr('disabled', 'disabled');
				}
			}else{
				var cur = _this.ar_dataCurrentlyView[v.id];
				cur.check = cur.check ? false : true;
				cur.select = cur.check;
				if (!cur.check){ _this.header_dataCurrentlyView.check = false; }				
				_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);	
				
				if (cur.check){
					_this.$('#deleteSelected').removeAttr('disabled');
					if (_this.collection_groups.length > 0){
						_this.$('#moveToGroup').removeAttr('disabled');
					}
				}else{
					
					if (_this.ar_dataCurrentlyView.find(function(o){ return o.check;}) == undefined){
						// not found 
						_this.$('#deleteSelected').attr('disabled', 'disabled');
						_this.$('#moveToGroup').attr('disabled', 'disabled');
					}else{
						_this.$('#deleteSelected').removeAttr('disabled');
						if (_this.collection_groups.length > 0){
							_this.$('#moveToGroup').removeAttr('disabled');
						}
					}
				}
			}
			
		}else if (v.type === 'edit'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_SMS_CONTACTS_EDIT( {idx: curd.id_collection});
			app.popup_view.model.set({
				id: 'edit',
				title: getHTMLString('SMS_CONTACTS_13'), //Edit Contact
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setEdit));
			app.popup_view.apply1 = _this.applyEdit;
			
			var attr = _.clone(model_collection.attributes);
			app.popup_view.modelInput.set(attr);			
			
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onEditPopupInputChanged);


		}else if (v.type === 'row'){
			/*
			_this.ar_dataCurrentlyView.forEach(function (item, index) {
				item.select = false;
			});
			var curd = _this.ar_dataCurrentlyView[v.id];			
			curd.select = true;
			_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);
			*/
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply', data.id);
		var _this = this;
		if(data.id === 'delete'){  // delete
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];

			_this.sendDeleteAndWaitForResponse([event_obj.id_collection]);
			return;

		}else if(data.id == 'message'){ //compose
			var eventModel = new m_SMS_COMPOSE();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
		}else if(data.id == 'add'){ //createNew

			var eventModel = new m_SMS_CONTACTS_EDIT();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput, _this.modelListeningSync_updateCollection);
			
			return;
		}else if(data.id == 'edit'){ //edit

					var modelSent = new m_SMS_CONTACTS_EDIT();
								
					var attrinput = _.clone(app.popup_view.modelInput.attributes);
					modelSent.set(attrinput);
						
					_this.model_listeningSync = modelSent;
					_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync_updateCollection);
			
					app._popupViewing(POPUP_LOADING);
					app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

					_this.model_listeningSync.savePOST(false);

		}else if(data.id === 'deleteSelected'){ //delete selected
		
			var arSelected = [];			
			_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					arSelected.push(val.id_collection);
				}
			});

			if(arSelected.length > 0){
			  _this.sendDeleteAndWaitForResponse(arSelected);
			}
			return;
		}else if(data.id === 'moveToGroup'){ //move To Group
		
					var modelSent = new m_SMS_CONTACTS_MOVETOGROUP();
								
					var attrinput = _.clone(app.popup_view.modelInput.attributes);
					attrinput = _.omit(attrinput, 'names');
					attrinput = _.omit(attrinput, 'present_groups');
					modelSent.set(attrinput);
						
					_this.model_listeningSync = modelSent;
					_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync_updateCollection);
			
					app._popupViewing(POPUP_LOADING);
					app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

					_this.model_listeningSync.savePOST(false);
					return;		
		}else{
			app._popupViewingClose();
		}
	},
	popupDeleteMsg: function(arDeleteModel, popupId){
		var arname = [];
		
		  _.map(arDeleteModel, function (val, key) {
			arname.push(val.get('name'));
		  });					
		  var strFormat = getHTMLString('SMS_CONTACTS_16');
		  var str = strFormat.replace("%ITEMS%", arname.toString());
		  
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: popupId,
						title: getHTMLString('SMS_CONTACTS_15'),
						info: str,
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	sendDeleteAndWaitForResponse: function(arIdxDel){
		//console.log(this.name, "sendDeleteAndWaitForResponse");
			var _this = this;		
			var working_model = new m_SMS_CONTACTS_DEL();
			var res = working_model.set({ delete_sms: arIdxDel.toString() });

			_this.model_listeningSync = working_model;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelDeleteListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	sendSMSAndWaitForResponse: function(modelSent, modelData, funcModelListeningSync ){
		var _this = this;			
			var attrinput = _.clone(modelData.attributes);
			var attr = _.omit(attrinput, 'id');
			var res = modelSent.set(attr);

			_this.model_listeningSync = modelSent;
			if (funcModelListeningSync){
				_this.listenTo(_this.model_listeningSync, 'sync', funcModelListeningSync);
			}else{
				_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
			}
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	oncreateNew: function(){
		//console.log(this.name, 'oncreateNew');
		var _this = this;

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_SMS_CONTACTS_EDIT();
			app.popup_view.model.set({
				id: 'add',
				title: getHTMLString('SMS_CONTACTS_11'), //Create New Contact
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setAdd));
			app.popup_view.apply1 = _this.applyAdd;
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAddPopupInputChanged);

	}, 
	onEditPopupInputChanged: function(o) {
		//console.log(this.name, 'onEditPopupInputChanged');
		//console.log(o);		

		var _this = this;		
		_this.popupDoChangeInputAttr(o, _this.applyEdit);
		
	},
	onAddPopupInputChanged: function(o) {
		//console.log(this.name, 'onAddPopupInputChanged');
		//console.log(o);		

		var _this = this;		
		_this.popupDoChangeInputAttr(o, _this.applyAdd);
		
	},
	popupDoChangeInputAttr: function(o, apply){

		var popupViewModel = o.viewModel;
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply1 = _.invert(apply);
		var changed = false;
		if(v_attr.arr[i_apply1.group].data === ''){
			var v = v_attr.arr[i_apply1.new_group];
			if (v.disabled){
				v_attr.arr[i_apply1.new_group].disabled = false;
				changed = true;
			}
		}else{
			var v = v_attr.arr[i_apply1.new_group];
			if (!v.disabled){
				v_attr.arr[i_apply1.new_group].disabled = true;
				changed = true;
			}
		}

		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	ondeleteSelected: function(){
		//console.log(this.name, 'ondeleteSelected');
		var _this = this;
			var arSelected = [];			
			_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					var model_collection = _this.collection.at(val.id_collection);

					arSelected.push(model_collection);
				}
			});
		
		_this.popupDeleteMsg(arSelected, 'deleteSelected');


	},
	onmoveToGroup: function(){
		//console.log(this.name, 'onmoveToGroup');
		var _this = this;
		var arSelected = [];
		var ar_id = [];
		var ar_idx = [];
		var ar_names = [];
		var ar_present_groups = [];
			
		_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					var model_collection = _this.collection.at(val.id_collection);
					
					ar_id.push(model_collection.get('id'));
					ar_idx.push(val.id_collection);
					ar_names.push(model_collection.get('name'));
					ar_present_groups.push(model_collection.get('group').length > 0 ? model_collection.get('group') : '---');
										
				}
			});
		
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SMS_CONTACTS_MOVETOGROUP_EDIT();
			app.popup_view.model.set({
				id: 'moveToGroup',
				title: getHTMLString('SMS_CONTACTS_17'), //Move to Group
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setMoveToGroup));
			app.popup_view.apply1 = _this.applyMoveToGroup;
			
			app.popup_view.modelInput.set({
				"contact_id": ar_id.toString(),
				"contact_idx": ar_idx.toString(),
				"names": ar_names.toString(),
				"present_groups": ar_present_groups.toString()
			});			

	},
	onpreviousPage: function(){
		var _this = this;
		_this.idxStartOfCurrentPage -= _this.maxInOnePage;
		if (_this.idxStartOfCurrentPage < 0) _this.idxStartOfCurrentPage = 0;
			
		_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);
		
	},
	onnextPage: function(){
		var _this = this;
		var nextStart = _this.idxStartOfCurrentPage + _this.maxInOnePage;
		if (nextStart >= _this.ar_dataCurrentlyView.length){
		}else{			
			_this.idxStartOfCurrentPage = nextStart;
			_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);	
		}
	},

	onDisplaySearchItems: function(e){
		//console.log(this.name, 'onDisplaySearchItems');
		var _this = this;
		var search = $('#searchInput').val();
		_this.UpdateListViewWithCriteria(search, _this.maxInOnePage);
	},
	UpdateListViewWithCriteria: function(search, numberInOnePage){
		var _this = this;
		_this.idxStartOfCurrentPage = 0;
		
		_this.ar_dataCurrentlyView = [];
		_this.header_dataCurrentlyView.check = false;
		
		var c_lists = _this.collection.toJSON();	
		
		if (search.length > 0){
		  _.map(c_lists, function (val, key) {
			if (val.name.search(search) >= 0){
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					name: val.name,
					number: val.number,
					group: val.group
					}
				);
			}
		  });
		
		}else{
		  _.map(c_lists, function (val, key) {
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					name: val.name,
					number: val.number,
					group: val.group
					}
				);
		  });
		}
		_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);

	},
	render: function() {
		//console.log('render');
	}
});


var POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION = Backbone.View.extend({
	name: "POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION",
	template: "",
	model: null,
	modelInput: null,
	v_view1: null,
	set1: null,
	apply1: null,
	events: {
		'click .jioClosePopup': 'btn_close',
		'click .JioButton input[type="button"]': 'btn_apply'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new (Backbone.Model.extend({
			defaults: {
				id: 0,
				title: "",
				btn: ''
			}
		}));
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		if(_this.template === ""){
			Backbone.$.get('templates/jioPopupInputTemplate.html?_='+new Date().getTime(), function (data) {
				_this.template = _.template(data);
				_this.listenTo(_this.model, 'change', _this.renderChange);
				_this.model.trigger('change');
			});
		}
	},
	renderChange: function() {
		//console.log(this.name, "renderChange");
		var _this = this;
		if(_this.template !== ""){
			_this.$el.html(_this.template(_this.model.attributes));
			transHTMLString(_this.$el);
			_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
			_this.listenTo(_this.v_view1.model, 'change', _this.v_viewModelChange);
			_this.listenTo(_this.modelInput, 'change', _this.modelInputChange);
			_this.modelInput.trigger('change');
		}
	},
	v_viewModelChange: function() {
		//console.log(this.name, 'v_viewModelChange');
		var _this = this;
		_this.trigger('popupInputChanged', { viewModel: _this.v_view1.model});

	},
	modelInputChange: function() {
		//console.log(this.name, 'modelInputChange');
		var _this = this;
		_this._sChangeViews(_this.modelInput, [_this.set1], [_this.v_view1], [_this.apply1]);
	},
	btn_apply: function() {
		//console.log("btn_apply");
		var _this = this;
		var res = _this._sChangeModel(_this.modelInput, [_this.v_view1], [_this.apply1]);
		if(res.length === 0){
			if(app.router_view._popup_apply){
				app.router_view._popup_apply({ name: _this.name, id: _this.model.get('id') });
			}
		}
	},
	btn_close: function() {
		//console.log("btn_close");
		app._popupViewingClose();
	},
	_JioInput_Edit: function(e, v) {
		//console.log(this.name, '_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log("render");
	}
});


var PAGE_SMS_GROUPS = Backbone.View.extend({
	name: "PAGE_SMS_GROUPS_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SMS_GROUPS_TITLE"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide mail_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();

	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view2 = new SMS_GROUPS_LIST({ el: Backbone.$('.mail_list', _this.$el) });
	}
});

var SMS_GROUPS_LIST = Backbone.View.extend({
	name: "SMS_GROUPS_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+
`
      <div class="jioTableHeaderButton2">
        <div class="jioH2"></div>
        <div class="jioTableSearchContainer">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <rect class="jioColorFillNone" width="24" height="24"></rect>
              <path class="jioColorFillPrimary" d="M-2713.8-1256.2a.674.674,0,0,1,0-.954l5.823-5.828a6.718,6.718,0,0,1-1.522-4.265,6.758,6.758,0,0,1,6.75-6.751,6.759,6.759,0,0,1,6.75,6.751,6.759,6.759,0,0,1-6.75,6.751,6.719,6.719,0,0,1-4.275-1.53l-5.823,5.829a.672.672,0,0,1-.476.2A.67.67,0,0,1-2713.8-1256.2Zm5.609-11.048a5.449,5.449,0,0,0,5.443,5.443,5.45,5.45,0,0,0,5.444-5.443,5.45,5.45,0,0,0-5.444-5.444A5.449,5.449,0,0,0-2708.193-1267.249Z" transform="translate(2717 1277)"></path>
            </svg>
          </div>
          <div>
            <input type="text" id="searchInput" class="jioTableSearchInput" placeholder="Search" autocomplete="off">
          </div>
        </div>
        <div></div>
        <div></div>
        <button id="createNew" class="jioIconButtonSet">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-2355.126,5587a1.876,1.876,0,0,1-1.874-1.875v-13.332a1.875,1.875,0,0,1,1.874-1.873h9.631a.642.642,0,0,1,.643.643.642.642,0,0,1-.643.643h-9.631a.588.588,0,0,0-.588.587v13.332a.589.589,0,0,0,.588.588h13.337a.59.59,0,0,0,.589-.588V5575.5a.643.643,0,0,1,.643-.643.644.644,0,0,1,.643.643v9.627a1.877,1.877,0,0,1-1.875,1.875Zm5.3-7.72a26.533,26.533,0,0,1,1.119-2.589.318.318,0,0,1,.28-.179.246.246,0,0,1,.176.071l1.671,1.671a.292.292,0,0,1-.107.456,26.656,26.656,0,0,1-2.59,1.12.829.829,0,0,1-.291.06C-2349.854,5579.888-2349.969,5579.656-2349.827,5579.278Zm4.122-1.821-1.75-1.751a.208.208,0,0,1,0-.294l6.229-6.229a.623.623,0,0,1,.442-.183.624.624,0,0,1,.441.182l1.162,1.164a.623.623,0,0,1,0,.882l-6.229,6.229a.211.211,0,0,1-.147.061A.209.209,0,0,1-2345.706,5577.457Z" transform="translate(2359.999 -5566)"></path>
          </svg>
          <div langid="SMS_GROUPS_1">Create Group</div>
        </button>
        <button id="deleteSelected" class="jioIconButtonSet" disabled="disabled">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect class="jioColorFillNone" width="24" height="24"></rect>
            <path class="jioColorFillWhite" d="M-1800.824-1829.4a2.506,2.506,0,0,1-2.521-2.485v-11.521h-1.4a.647.647,0,0,1-.652-.643.647.647,0,0,1,.652-.643h3.426v-.223a.844.844,0,0,1,.009-.12,2.494,2.494,0,0,1,2.512-2.366h3.8a2.507,2.507,0,0,1,2.521,2.486v.223h3.426a.648.648,0,0,1,.652.643.648.648,0,0,1-.652.643h-1.4v11.521a.843.843,0,0,1-.009.119,2.5,2.5,0,0,1-2.512,2.366Zm-1.217-2.485a1.21,1.21,0,0,0,1.217,1.2h7.845a1.2,1.2,0,0,0,1.21-1.154c0-.027,0-.052.007-.077v-11.489h-10.28Zm2.029-13.075c0,.027,0,.053-.007.078v.191h6.235v-.223a1.209,1.209,0,0,0-1.217-1.2h-3.8A1.2,1.2,0,0,0-1800.012-1844.962Zm5.4,11.514v-6.93a.647.647,0,0,1,.652-.643.647.647,0,0,1,.652.643v6.93a.647.647,0,0,1-.652.643A.647.647,0,0,1-1794.616-1833.448Zm-2.937,0v-6.93a.648.648,0,0,1,.652-.643.648.648,0,0,1,.653.643v6.93a.648.648,0,0,1-.653.643A.648.648,0,0,1-1797.553-1833.448Zm-2.937,0v-6.93a.648.648,0,0,1,.653-.643.647.647,0,0,1,.652.643v6.93a.647.647,0,0,1-.652.643A.648.648,0,0,1-1800.49-1833.448Z" transform="translate(1808.901 1850.4)"></path>
          </svg>
          <div langid="SMS_CONTACTS_6">Delete Selected</div>
        </button>
        <div class="jioSMSlabel">
          <label><span class="startOfCurrentPage">0</span>—<span class="endOfCurrentPage">0</span> of <span class="totalNum">0</span></label>
        </div>
        <div class="jioIcon32" id="previousPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(-2388 -2856) rotate(180)"></path>
          </svg>
        </div>
        <div class="jioIcon32" id="nextPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(2420 2888)"></path>
          </svg>
        </div>
      </div>
`
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	v_view1: null,
	ar_dataCurrentlyView: [],
	header_dataCurrentlyView: { 
		check: false 
	},
	maxInOnePage: 10,
	idxStartOfCurrentPage: 0,	
	model_listeningSync: null,
	islog: false,
	eventId: 0,
	applyAdd: {
		0: "name",
		1: "description"
	},
	setAdd: {
		arr: [{
				str: 'Group Name',
				lang: 'SMS_GROUPS_2',
				input: true,
				data: ''

			},{
				str: 'Description',
				lang: 'SMS_GROUPS_3',
				input: true,
				data: ''

			}],
	},
	events: {
		'click #previousPage': 'onpreviousPage',
		'click #nextPage': 'onnextPage',
		
		'click #deleteSelected': 'ondeleteSelected',
		'click #createNew': 'oncreateNew',
		'keyup #searchInput': 'onDisplaySearchItems'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SMS_GROUPS();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		Backbone.$('#searchInput', _this.$el).attr('placeholder', getHTMLString('SMS_INBOX_16'));
		transHTMLString(_this.$el);
		
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.collection.fetch();
	},

	collectionSync: function() {
		//console.log(this.name, 'collectionSync');
		var _this = this;
		_this.UpdateListViewWithCriteria('', _this.maxInOnePage);
		_this.$('#deleteSelected').attr('disabled', 'disabled');


	},
	modelDeleteListeningSync: function() {
		//console.log(this.name, 'modelDeleteListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					var arIdx = _this.model_listeningSync.get('delete_sms').split(',').reverse();
					var arModels = [];
					arIdx.forEach(function(e){
						var model_collection = _this.collection.at(e);
						if(model_collection){
							model_collection.destroyPOST(false); // send to server
						}
						arModels.push(model_collection);
					});
					//_this.collection.remove(arModels); // not send to server
					_this.collection.trigger('sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	modelListeningSync: function() {
		//console.log(this.name, 'modelListeningSync');
		var _this = this;
		_this.modelListeningSyncFunction(false);

	},
	modelListeningSync_updateCollection: function() {
		//console.log(this.name, 'modelListeningSync_updateCollection');
		var _this = this;
		_this.modelListeningSyncFunction(true);
	},
	modelListeningSyncFunction: function(bUpdateCollection) {
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					if (bUpdateCollection){
						_this.collection.fetch();
					}
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	UpdateListView: function(from_lists, header){
		//console.log(this.name, 'UpdateListView');
		var _this = this;
		
		var lists = [];
		var tr = [];
		var i;

		var head = [
		{
					checkbox: true,
					id: -1,
					str:  header.check ? '1' : '0'
		},{
			sort: true,
			lang: "SMS_GROUPS_2",
			str: "Group Name"
		},{
			sort: true,
			lang: "SMS_GROUPS_3",
			str: "Description"
		},{
			sort: true,
			lang: "SMS_GROUPS_4",
			str: "Total Contacts"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		
		for (i = _this.idxStartOfCurrentPage; 
			 (i < _this.idxStartOfCurrentPage + _this.maxInOnePage) && (i < from_lists.length);
			 i++
			){
				
			var val = from_lists[i];
			var key = i;
			tr.push({
				id: key,
				ex_class: val.select ? "jioTableRowSelect"	: "",			
			});
			lists.push([
				{
					id: key,
					checkbox: true,
					stopPropagation: true,
					str: val.check ? '1' : '0'
				},{
					id: key,
					str: val.name,
					ex_class: "jioSMSnamecolomn"
				},{
					id: key,
					str: val.description.length > 0 ? val.description : '---'
				},{
					id: key,
					str: val.total_contacts
					
				},{
					id: key,
					btn: [{	type: 'edit', stopPropagation: true}, {type: 'groupmsg', stopPropagation: true}, {type: 'del', stopPropagation: true}]
					
				}
			]);			
		}

		_this.v_view1.model.set({ head: head, lists: lists, tr:tr });		

		_this.$('.totalNum').text(_this.ar_dataCurrentlyView.length);
		_this.$('.startOfCurrentPage').text(lists.length ? _this.idxStartOfCurrentPage + 1 : 0);
		_this.$('.endOfCurrentPage').text(_this.idxStartOfCurrentPage + lists.length);
		

	},
	_list_event: function(v) {
		//console.log(this.name, ' _list_event');
		var _this = this;
		//console.log(v);
		if(v.type === 'del'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);
			if(model_collection){
				_this.popupDeleteMsg([model_collection], 'delete');
			}

		}else if(v.type === 'groupmsg'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);
			app._popupViewing(POPUP_SMS_GROUP_SEND, { template_file: 'templates/jioPOPUP_SMS_GROUP_SEND.html'});
			app.popup_view.modelInput = new m_SMS_GROUP_SEND({
					"sms_to" : model_collection.get('name'), 
					"sms_group_idx" : curd.id_collection
				});
			app.popup_view.model.set({
				id: 'groupmsg',
				"sms_to" : model_collection.get('name'),
				"sms_msg" : ''
			});

		}else if (v.type === 'checkbox'){			
			if (v.id == -1){			
				// header checkbox
				var header =  _this.header_dataCurrentlyView;
				header.check = header.check ? false : true;
				var i;
				for (i = 0; (i < _this.ar_dataCurrentlyView.length); i++){
					var cur = _this.ar_dataCurrentlyView[i];
					cur.check = header.check;
				}				
				_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);	
				if (header.check){
				  if (_this.ar_dataCurrentlyView.length > 0){
					_this.$('#deleteSelected').removeAttr('disabled');

				  }
				}else{
						_this.$('#deleteSelected').attr('disabled', 'disabled');

				}
			}else{
				var cur = _this.ar_dataCurrentlyView[v.id];
				cur.check = cur.check ? false : true;
				cur.select = cur.check;
				if (!cur.check){ _this.header_dataCurrentlyView.check = false; }				
				_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);	
				
				if (cur.check){
					_this.$('#deleteSelected').removeAttr('disabled');

				}else{
					
					if (_this.ar_dataCurrentlyView.find(function(o){ return o.check;}) == undefined){
						// not found 
						_this.$('#deleteSelected').attr('disabled', 'disabled');

					}else{
						_this.$('#deleteSelected').removeAttr('disabled');

					}
				}
			}
			
		}else if (v.type === 'edit'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);

			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SMS_GROUPS_EDIT( {idx: curd.id_collection});
			app.popup_view.model.set({
				id: 'edit',
				title: getHTMLString('SMS_GROUPS_6'), //Edit Group
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setAdd));
			app.popup_view.apply1 = _this.applyAdd;
			
			var attr = _.clone(model_collection.attributes);
			app.popup_view.modelInput.set(attr);			


		}else if (v.type === 'row'){
			/*
			_this.ar_dataCurrentlyView.forEach(function (item, index) {
				item.select = false;
			});
			var curd = _this.ar_dataCurrentlyView[v.id];			
			curd.select = true;
			_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);
			*/
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply', data.id);
		var _this = this;
		if(data.id === 'delete'){  // delete
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];

			_this.sendDeleteAndWaitForResponse([event_obj.id_collection]);
			return;

		}else if(data.id == 'groupmsg'){ //group send
			var eventModel = new m_SMS_GROUP_SEND();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
		}else if(data.id == 'add'){ //createNew

			var eventModel = new m_SMS_GROUPS_EDIT();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput, _this.modelListeningSync_updateCollection);
			
			return;
		}else if(data.id == 'edit'){ //edit

					var modelSent = new m_SMS_GROUPS_EDIT();
								
					var attrinput = _.clone(app.popup_view.modelInput.attributes);
					var attr = _.omit(attrinput, 'total_contacts');
					modelSent.set(attr);
						
					_this.model_listeningSync = modelSent;
					_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync_updateCollection);
			
					app._popupViewing(POPUP_LOADING);
					app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

					_this.model_listeningSync.savePOST(false);

		}else if(data.id === 'deleteSelected'){ //delete selected
		
			var arSelected = [];			
			_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					arSelected.push(val.id_collection);
				}
			});

			if(arSelected.length > 0){
			  _this.sendDeleteAndWaitForResponse(arSelected);
			}
			return;

		}else{
			app._popupViewingClose();
		}
	},
	popupDeleteMsg: function(arDeleteModel, popupId){
		var arname = [];
		
		  _.map(arDeleteModel, function (val, key) {
			arname.push(val.get('name'));
		  });					
		  var strFormat = getHTMLString('SMS_GROUPS_8');
		  var str = strFormat.replace("%ITEMS%", arname.toString());
		  
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: popupId,
						title: getHTMLString('SMS_GROUPS_7'),
						info: str,
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	sendDeleteAndWaitForResponse: function(arIdxDel){
		//console.log(this.name, "sendDeleteAndWaitForResponse");
			var _this = this;		
			var working_model = new m_SMS_GROUPS_DEL();
			var res = working_model.set({ delete_sms: arIdxDel.toString() });

			_this.model_listeningSync = working_model;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelDeleteListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	sendSMSAndWaitForResponse: function(modelSent, modelData, funcModelListeningSync ){
		var _this = this;			
			var attrinput = _.clone(modelData.attributes);
			var attr = _.omit(attrinput, 'id');
			var res = modelSent.set(attr);

			_this.model_listeningSync = modelSent;
			if (funcModelListeningSync){
				_this.listenTo(_this.model_listeningSync, 'sync', funcModelListeningSync);
			}else{
				_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
			}
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	oncreateNew: function(){
		//console.log(this.name, 'oncreateNew');
		var _this = this;

			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_SMS_GROUPS_EDIT();
			app.popup_view.model.set({
				id: 'add',
				title: getHTMLString('SMS_GROUPS_5'), //Create New Group
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = JSON.parse(JSON.stringify(_this.setAdd));
			app.popup_view.apply1 = _this.applyAdd;

	}, 
	onEditPopupInputChanged: function(o) {
		//console.log(this.name, 'onEditPopupInputChanged');
		//console.log(o);		

		var _this = this;		
		_this.popupDoChangeInputAttr(o, _this.applyEdit);
		
	},

	popupDoChangeInputAttr: function(o, apply){

		var popupViewModel = o.viewModel;
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply1 = _.invert(apply);
		var changed = false;
		if(v_attr.arr[i_apply1.group].data === ''){
			var v = v_attr.arr[i_apply1.new_group];
			if (v.disabled){
				v_attr.arr[i_apply1.new_group].disabled = false;
				changed = true;
			}
		}else{
			var v = v_attr.arr[i_apply1.new_group];
			if (!v.disabled){
				v_attr.arr[i_apply1.new_group].disabled = true;
				changed = true;
			}
		}

		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	ondeleteSelected: function(){
		//console.log(this.name, 'ondeleteSelected');
		var _this = this;
			var arSelected = [];			
			_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					var model_collection = _this.collection.at(val.id_collection);

					arSelected.push(model_collection);
				}
			});
		
		_this.popupDeleteMsg(arSelected, 'deleteSelected');


	},
	onpreviousPage: function(){
		var _this = this;
		_this.idxStartOfCurrentPage -= _this.maxInOnePage;
		if (_this.idxStartOfCurrentPage < 0) _this.idxStartOfCurrentPage = 0;
			
		_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);
		
	},
	onnextPage: function(){
		var _this = this;
		var nextStart = _this.idxStartOfCurrentPage + _this.maxInOnePage;
		if (nextStart >= _this.ar_dataCurrentlyView.length){
		}else{			
			_this.idxStartOfCurrentPage = nextStart;
			_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);	
		}
	},

	onDisplaySearchItems: function(e){
		//console.log(this.name, 'onDisplaySearchItems');
		var _this = this;
		var search = $('#searchInput').val();
		_this.UpdateListViewWithCriteria(search, _this.maxInOnePage);
	},
	UpdateListViewWithCriteria: function(search, numberInOnePage){
		var _this = this;
		_this.idxStartOfCurrentPage = 0;
		
		_this.ar_dataCurrentlyView = [];
		_this.header_dataCurrentlyView.check = false;
		
		var c_lists = _this.collection.toJSON();	
		
		if (search.length > 0){
		  _.map(c_lists, function (val, key) {
			if (val.name.search(search) >= 0){
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					name: val.name,
					total_contacts: val.total_contacts,
					description: val.description
					}
				);
			}
		  });
		
		}else{
		  _.map(c_lists, function (val, key) {
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					name: val.name,
					total_contacts: val.total_contacts,
					description: val.description
					}
				);
		  });
		}
		_this.UpdateListView(_this.ar_dataCurrentlyView, _this.header_dataCurrentlyView);

	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_SMS_SETTINGS = Backbone.View.extend({
	name: "PAGE_SMS_SETTINGS_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SMS_SETTINGS_TITLE">SMS Settings</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide sms_settings">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;

	},
	v_viewModelChange: function(v) {		// 10/29 '21 add this block
		var _this = this;
		//console.log('v_viewModelChange in main view');
		//console.log(_this.eventId);
		//console.log(v);


	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;

	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new SMS_SETTINGS_SESSION({ el: Backbone.$('.sms_settings', _this.$el) });	
	}
});

var SMS_SETTINGS_SESSION = Backbone.View.extend({
	name: "PAGE_SMS_SETTINGS_TITLE",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SMS_SETTINGS_TITLE">SMS Settings</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	v_view3: null,
	apply1: {
		0: 'sms_report'
	},
	apply2: {
		0: 'sms_centre_number'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_SMS_SETTINGS();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);	// 10/29 '21
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'SMS Report',
				lang: 'SMS_SETTINGS_3',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'SMS Centre Number',
				lang: 'SMS_SETTINGS_2',
				input: true,
				data: ''

			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {	// 10/29 '21
		//console.log('v_viewModelChange');
		var _this = this;

	},
	_JioInput_Modify: function(e, v) {
		// console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){

				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
				model_change_status = 1;
			}
		}

	},
	_popup_apply: function(data){
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_SMS_SENT = Backbone.View.extend({
	name: "PAGE_SMS_SENT_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SMS_SENT_TITLE">Sent Messages</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide mail_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();

	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view2 = new SMS_SENT_LIST({ el: Backbone.$('.mail_list', _this.$el) });
	}
});

var SMS_SENT_LIST = Backbone.View.extend({
	name: "SMS_SENT_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+
`
<div class="jioTableHeaderButton0">
        <div class="jioH2"></div>
        <div class="jioTableSearchContainer">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <rect class="jioColorFillNone" width="24" height="24"></rect>
              <path class="jioColorFillPrimary" d="M-2713.8-1256.2a.674.674,0,0,1,0-.954l5.823-5.828a6.718,6.718,0,0,1-1.522-4.265,6.758,6.758,0,0,1,6.75-6.751,6.759,6.759,0,0,1,6.75,6.751,6.759,6.759,0,0,1-6.75,6.751,6.719,6.719,0,0,1-4.275-1.53l-5.823,5.829a.672.672,0,0,1-.476.2A.67.67,0,0,1-2713.8-1256.2Zm5.609-11.048a5.449,5.449,0,0,0,5.443,5.443,5.45,5.45,0,0,0,5.444-5.443,5.45,5.45,0,0,0-5.444-5.444A5.449,5.449,0,0,0-2708.193-1267.249Z" transform="translate(2717 1277)"></path>
            </svg>
          </div>
          <div>
            <input type="text" id="searchInput" class="jioTableSearchInput" placeholder="Search" autocomplete="off">
          </div>
        </div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div class="jioSMSlabel">
          <label><span class="startOfCurrentPage">0</span>—<span class="endOfCurrentPage">0</span> of <span class="totalNum">0</span></label>
        </div>
        <div class="jioIcon32" id="previousPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(-2388 -2856) rotate(180)"></path>
          </svg>
        </div>
        <div class="jioIcon32" id="nextPage">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect class="jioColorFillNone" width="32" height="32"></rect>
            <path class="jioDisabledText" d="M-2407.7-2865.28a.951.951,0,0,1,0-1.35l5.386-5.362-5.4-5.379a.951.951,0,0,1,0-1.349.963.963,0,0,1,1.357,0l6.081,6.053a.95.95,0,0,1,.281.676.949.949,0,0,1-.281.675l-6.065,6.037a.96.96,0,0,1-.678.28A.959.959,0,0,1-2407.7-2865.28Z" transform="translate(2420 2888)"></path>
          </svg>
        </div>
      </div>
`
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	v_view1: null,
	ar_dataCurrentlyView: [],
	maxInOnePage: 10,
	idxStartOfCurrentPage: 0,	
	model_listeningSync: null,
	islog: false,
	eventId: 0,
	events: {
		'click #previousPage': 'onpreviousPage',
		'click #nextPage': 'onnextPage',		
		'click #deleteSMS': 'onDeleteSMS',
		'keyup #searchInput': 'onDisplaySearchItems'
	},
	preinitialize: function () {
		var _this = this;
		_this.collection = new c_SMS_SENT();
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		Backbone.$('#searchInput', _this.$el).attr('placeholder', getHTMLString('SMS_INBOX_16'));
		transHTMLString(_this.$el);
		
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.collection.fetch();
	},
	collectionSync: function() {
		// console.log(this.name, 'collectionSync');
		var _this = this;
		_this.UpdateListViewWithCriteria('', _this.maxInOnePage);
		_this.$('#deleteSMS').attr('disabled', 'disabled');		

	},
	modelDeleteListeningSync: function() {
		//console.log(this.name, 'modelDeleteListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					var arIdx = _this.model_listeningSync.get('delete_sms').split(',').reverse();
					var arModels = [];
					arIdx.forEach(function(e){
						var model_collection = _this.collection.at(e);
						if(model_collection){
							model_collection.destroyPOST(false); // send to server
						}
						arModels.push(model_collection);
					});
					//_this.collection.remove(arModels); // not send to server
					_this.collection.trigger('sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	modelResendListeningSync: function() {
		//console.log(this.name, 'modelResendListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					
					var model_collection = _this.collection.at(_this.model_listeningSync.get('sms_resend'));
					if(model_collection){
						model_collection.set({"not_sent": "0"});
					}
					_this.collection.trigger('sync');
				}else if(_response == 0){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1002,
							title: getHTMLString(''),
							info: getHTMLString('SMS_SENT_1'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	modelListeningSync: function() {
		//console.log(this.name, 'modelListeningSync');
		var _this = this;
		var _response = _this.model_listeningSync._response || null;
		var value;
		//var status;
		var attempt;
		if(_response){
				if(_response == 1){
					app._popupViewingClose();
					_this.stopListening(_this.model_listeningSync, 'sync');
					
				}else{
					if(_response == 'del error'){
						app._popupViewingClose();
						_this.stopListening(_this.model_listeningSync, 'sync');
						
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 1001,
							title: getHTMLString(''),
							info: getHTMLString('INVALID_SETTINGS'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}

		}
	},
	UpdateListView: function(from_lists){
		//console.log(this.name, 'UpdateListView');
		var _this = this;
		
		var lists = [];
		var tr = [];
		var i;
		
		for (i = _this.idxStartOfCurrentPage; 
			 (i < _this.idxStartOfCurrentPage + _this.maxInOnePage) && (i < from_lists.length);
			 i++
			){
				
			var val = from_lists[i];
			var key = i;
			var tr_exclass = [];
			if (val.select) tr_exclass.push("jioTableRowSelect");
			if (val.not_sent) tr_exclass.push("jioTableRowWarning");	
			var exclass = tr_exclass.toString().replace(',', ' ').trim();
			
			tr.push({
				id: key,
				ex_class: exclass,
				require_row_event: true
			});
			lists.push([
				{
					id: key,
					checkbox: true,
					stopPropagation: true,
					str: val.check ? '1' : '0'
				},{
					id: key,
					str: val.name,
					ex_class: "jioSMSnamecolomn"
				},{
					id: key,
					str: val.message,
					ex_class: "jioTableSMSContent"
				},{
					str: val.select ? val.date	: val.date_short,
					ex_class: "jioSMSdatecolomn"
					
				},{
					id: key,
					btn: (val.select ? 
							 ( val.not_sent ? 
								  [{	type: 'resend', stopPropagation: true}, {type: 'forward', stopPropagation: true}, {type: 'del', stopPropagation: true}]	
								: [{	type: 'reply', stopPropagation: true}, {type: 'forward', stopPropagation: true}, {type: 'del', stopPropagation: true}]	
							 )
							: [{	type: 'dummy'}, {type: 'dummy'}, {type: 'del', stopPropagation: true}]),
					
				}
			]);			
		}

		_this.v_view1.model.set({ /*head: head,*/ lists: lists, tr:tr });		

		_this.$('.totalNum').text(_this.ar_dataCurrentlyView.length);
		_this.$('.startOfCurrentPage').text(lists.length ? _this.idxStartOfCurrentPage + 1 : 0);
		_this.$('.endOfCurrentPage').text(_this.idxStartOfCurrentPage + lists.length);
		

	},
	_list_event: function(v) {
		//console.log(this.name, ' _list_event');
		var _this = this;
		//console.log(v);
		if(v.type === 'del'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			var model_collection = _this.collection.at(curd.id_collection);
			if(model_collection){
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 'del',
						title: getHTMLString('SMS_INBOX_1'),
						info: getHTMLString('SMS_INBOX_2'),
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});
			}
		}else if(v.type === 'forward'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			app._popupViewing(POPUP_COMMON_INPUT_WITH_TEMPLATE_FILE, { template_file: 'templates/jioPOPUP_SMS_FORWARD.html'});
			app.popup_view.modelInput = new m_SMS_SENT_FORWARD();
			app.popup_view.modelInput.set({
				"sms_msg" : curd.message,
				"sms_forward_original_from" : curd.name,
				"sms_forward_idx" : curd.id_collection
			});			
			app.popup_view.model.set({
				id: 'forward',
				"sms_msg" : curd.message,
				"sms_forward_original_from" : curd.name,
				"sms_forward_idx" : curd.id_collection

			});
			
		}else if(v.type === 'reply'){
			_this.eventId = v.id;
			var curd = _this.ar_dataCurrentlyView[v.id];	
			app._popupViewing(POPUP_SMS_REPLY, { template_file: 'templates/jioPOPUP_SMS_REPLY.html'});
			app.popup_view.modelInput = new m_SMS_SENT_REPLY();
			app.popup_view.modelInput.set({
				"sms_to" : curd.name,
				"sms_reply_idx" : curd.id_collection
			});			
			app.popup_view.model.set({
				id: 'reply',
				"sms_to" : curd.name,
				"sms_reply_idx" : curd.id_collection

			});
		}else if(v.type === 'resend'){
			_this.eventId = v.id;

			var event_obj = _this.ar_dataCurrentlyView[_this.eventId];

			_this.sendResendAndWaitForResponse(event_obj.id_collection);
			return;

		}else if (v.type === 'checkbox'){
			var cur = _this.ar_dataCurrentlyView[v.id];
			cur.check = cur.check ? false : true;
			_this.UpdateListView(_this.ar_dataCurrentlyView);	
			if (cur.check){
				_this.$('#deleteSMS').removeAttr('disabled');
			}else{
				if (_this.ar_dataCurrentlyView.find(function(o){ return o.check;}) == undefined){
					// not found 
					_this.$('#deleteSMS').attr('disabled', 'disabled');
				}else{
					_this.$('#deleteSMS').removeAttr('disabled');
				}
			}
			
		}else if (v.type === 'row'){
			_this.ar_dataCurrentlyView.forEach(function (item, index) {
				item.select = false;
			});
			var curd = _this.ar_dataCurrentlyView[v.id];			
			curd.select = true;
			_this.UpdateListView(_this.ar_dataCurrentlyView);
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		var _this = this;
		if(data.id === 'del'){  // delete
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];

			_this.sendDeleteAndWaitForResponse([event_obj.id_collection]);
			return;

		}else if(data.id === 'forward'){ //forward
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];
		  var eventModel = new m_SMS_SENT_FORWARD();
			
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
			

		}else if(data.id === 'reply'){ //reply
		  var event_obj = _this.ar_dataCurrentlyView[_this.eventId];
		  var eventModel = new m_SMS_SENT_REPLY();
			_this.sendSMSAndWaitForResponse(eventModel, app.popup_view.modelInput);
			return;
		}else if(data.id === 6000){ //delete selected
		
			var arSelected = [];			
			_.map(_this.ar_dataCurrentlyView, function (val, key) {
				if (val.check){
					arSelected.push(val.id_collection);
				}
			});

			if(arSelected.length > 0){
			  _this.sendDeleteAndWaitForResponse(arSelected);
			}
			return;
		}else{
			app._popupViewingClose();
		}
	},
	sendDeleteAndWaitForResponse: function(arIdxDel){
		//console.log(this.name, "sendDeleteAndWaitForResponse");
			var _this = this;		
			var working_model = new m_SMS_SENT_DEL();
			var res = working_model.set({ delete_sms: arIdxDel.toString() });

			_this.model_listeningSync = working_model;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelDeleteListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	sendResendAndWaitForResponse: function(IdxResend){
		//console.log(this.name, "sendResendAndWaitForResponse");
			var _this = this;		
			var working_model = new m_SMS_SENT_RESEND();
			var res = working_model.set({ sms_resend: IdxResend.toString() });

			_this.model_listeningSync = working_model;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelResendListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	sendSMSAndWaitForResponse: function(modelSent, modelData){
		var _this = this;			
			var attrinput = _.clone(modelData.attributes);
			var attr = _.omit(attrinput, 'id');
			var res = modelSent.set(attr);

			_this.model_listeningSync = modelSent;
			_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			_this.model_listeningSync.savePOST(false);
		
	},
	onDeleteSMS: function(){
		//console.log(this.name, 'onDeleteSMS');
		var _this = this;
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 6000,
						title: getHTMLString('SMS_INBOX_1'),
						info: getHTMLString('SMS_INBOX_2'),
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	onpreviousPage: function(){
		var _this = this;
		_this.idxStartOfCurrentPage -= _this.maxInOnePage;
		if (_this.idxStartOfCurrentPage < 0) _this.idxStartOfCurrentPage = 0;
			
		_this.UpdateListView(_this.ar_dataCurrentlyView);
		
	},
	onnextPage: function(){
		var _this = this;
		var nextStart = _this.idxStartOfCurrentPage + _this.maxInOnePage;
		if (nextStart >= _this.ar_dataCurrentlyView.length){
		}else{			
			_this.idxStartOfCurrentPage = nextStart;
			_this.UpdateListView(_this.ar_dataCurrentlyView);	
		}
	},

	onDisplaySearchItems: function(e){
		//console.log(this.name, 'onDisplaySearchItems');
		var _this = this;
		var search = $('#searchInput').val();
		_this.UpdateListViewWithCriteria(search, _this.maxInOnePage);
	},
	UpdateListViewWithCriteria: function(search, numberInOnePage){
		var _this = this;
		_this.idxStartOfCurrentPage = 0;
		_this.ar_dataCurrentlyView = [];	
		var c_lists = _this.collection.toJSON();	
		
		if (search.length > 0){
		  _.map(c_lists, function (val, key) {
			if (val.name.search(search) >= 0){
				var date_short = val.date.split('-')[0].trim();
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					not_sent: val.not_sent == '1' ? true : false,
					name: val.name,
					date_short: date_short,
					date: val.date,
					message: val.message
					}
				);
			}
		  });
		
		}else{
		  _.map(c_lists, function (val, key) {
				var date_short = val.date.split('-')[0].trim();
				_this.ar_dataCurrentlyView.push(
					{
					id_collection: key,
					check: false,
					select: false,
					not_sent: val.not_sent == '1' ? true : false,
					name: val.name,
					date_short: date_short,
					date: val.date,
					message: val.message
					}
				);
		  });
		}
		_this.UpdateListView(_this.ar_dataCurrentlyView);


	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_ADMIN_URL_FILTER = Backbone.View.extend({
	name: "PAGE_ADMIN_URL_FILTER",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="URL_FILTER_FILTERING"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide view_1">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen" id="urlfilter_list_title">'
	+'<span class="jiotext" langid="URL_FILTER_LIST"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide view_2" id="urlfilter_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhideView'){
				if(d.data === '1'){
					//$(_this.v_view2.el).show();	
					document.getElementById('urlfilter_list_title').style.display='';					
					document.getElementById('urlfilter_list').style.display='';
				}else {
					//$(_this.v_view2.el).hide();	
					document.getElementById('urlfilter_list_title').style.display='none';
					document.getElementById('urlfilter_list').style.display='none';
				}				
			}else if (d.want == 'get_list_view_name'){
				return _this.v_view2.name;
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new URL_FILTER_SETTINGS({ el: Backbone.$('.view_1', _this.$el), owner_name: _this.name });	
		_this.v_view2 = new URL_FILTER_LIST({ el: Backbone.$('.view_2', _this.$el), owner_name: _this.name });
		$(_this.v_view2.el).hide();
	}
});

var URL_FILTER_LIST = Backbone.View.extend({
	name: "URL_FILTER_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="URL_FILTER_LIST"></div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	owner_name: null,
	apply1: {
		0: 'url'
	},
	events: {
		'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_URL_FILTERS();
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		var head = [{
			sort: true,
			lang: "URL_FILTER_1",
			str: "SI #"
		},{
			sort: true,
			lang: "URL_FILTER_2",
			str: "URL"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);

			lists.push([
				{
					str: key+1
				},{
					str: val.url
				},{
					id: key,
					btn: [{
						type: 'del'
					}]
				}
			]);
		});
		_this.collection_len = c_lists.length;
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	btnAdd: function() {
		//console.log(this.name, 'btnAdd');
		
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_RULES'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_URL_FILTER();
			app.popup_view.model.set({
				id: _this.name+'add',
				title: getHTMLString('URL_FILTER_3'), //Add New
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'URL',
					lang: 'URL_FILTER_2',
					input: true,
					data: ''
				}]
			};
			app.popup_view.apply1 = _this.apply1;
		}
	},
	_list_event: function(v) {
		 //console.log(this.name, '_list_event');
		var _this = this;
		_this.eventId = v.id;
		// console.log(v.id);

		var model = _this.collection.at(v.id);
		if(v.type === 'del'){

			_this.eventId = v.id;
	
			var model_collection = _this.collection.at(v.id);
			if(model_collection){
				var strItems = _sysFunc.remove_num_comma_in_value(model_collection.get('url'));
				_this.popupDeleteMsg(strItems, _this.name+'delete');
			}

		}
	},
	popupDeleteMsg: function(strItems, popupId){

		  var strFormat = getHTMLString('URL_FILTER_5');
		  var str = strFormat.replace("%ITEMS%", strItems);
		  
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: popupId,
						title: getHTMLString('URL_FILTER_4'),
						info: str,
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		var _this = this;
		if(data.id === 1000 || data.id === 3000){
			app._popupViewingClose();
		}else if(data.id === 4000){ //para_chk error
			app._popupViewingClose();
		}else if(data.id === _this.name+'delete'){ //delete
			var collection_model = _this.collection.at(_this.eventId);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			_this.model = new m_URL_F_DEL();
			var res = _this.model.set({ delete_rule: _this.eventId });
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(collection_model){
						collection_model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}else{
					if(res._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_ALL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 5000);
		
		
		}else if(data.id === _this.name+'add'){ //add
			//console.log(_this.name, "add");
			var model = new m_URL_FILTER();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');
			obj_add_num_comma_in_attr_values(attr, (_this.collection_len+1));
			
			var res = model.set(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			model.savePOST(false);
			_this.interval = setInterval(function(){
				 //console.log(res._response);
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else if(res._response == 'para_chk error'){
					// _this.collection.createPOST(false, model);
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_MACFILTER_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}else{
				}
			}, 5000);
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
});

var URL_FILTER_SETTINGS = Backbone.View.extend({
	name: "URL_FILTER_FILTERING",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="URL_FILTER_FILTERING"></div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	v_view3: null,
	owner_name: null,
	apply1: {
		0: 'filtering_status'
	},
	apply2: {
		0: 'filtering_mode'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_URL_FILTERING();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);	
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Filtering Status',
				lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Filtering Mode',
				lang: 'PAGE_MACADDR_FILTERING_MODE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Allow',
					lang: '',
					data: 'Allow'
				},{
					str: 'Deny',
					lang: '',
					data: 'Deny'
				}],
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {	
		//console.log('v_viewModelChange');
		var _this = this;
		var v_onOffButtonLocated = _this.v_view2;
		var v_effectLocated = _this.v_view3;
				
		var v_attr1 = _.clone(v_onOffButtonLocated.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		var v_attr2 = _.clone(v_effectLocated.model.attributes);
		var i_apply2 = _.invert(_this.apply2);
		
		if (v_attr2.arr.length > 0){
		
		  var changed = false;
		  if(v_attr1.arr[i_apply1.filtering_status].data === '0'){
				_.map(v_attr2.arr, function(v, k){
					if(!v.disabled){
						v.disabled = true;
						changed = true;
					}
				});
		  }else{
				_.map(v_attr2.arr, function(v, k){
					if(v.disabled){
						v.disabled = false;
						changed = true;
					}
				});
		  }
		  if(changed){
			v_effectLocated.model.set(v_attr2);
			v_effectLocated.model.trigger('change');
		  }
		}
		
		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhideView', data: v_attr1.arr[0].data});
		}

	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		var list_name = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'get_list_view_name'}) : '');
		var collection_len = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: list_name, from: _this.name, want: 'get_list_length'}) : 0);
		if(_this.model.attributes.filtering_mode == _this.v_view3.model.attributes.arr[0].data &&
		   _this.model.attributes.filtering_status == _this.v_view2.model.attributes.arr[0].data){

		}else if( _this.v_view2.model.attributes.arr[0].data=="1" &&
				 collection_len==0){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('POPUP_ADD_RULE'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			var res = _this._sSaveModel(false, _this.model, [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_popup_apply: function(data){
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_LAN_IPV6 = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_IPV6", // must have string, for page title
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_LAN_IPV6_TITLE">LAN IPv6</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide view_1">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen" id="lease_list">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_LAN_IPV6_LEASE_LIST"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide view_2"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'get_list_view_name'){
				return _this.v_view2.name;
			}else if (d.want == 'showhide_list'){
				if (d.data){
					$(_this.v_view2.el).show();
					document.getElementById('lease_list').style.display='';
				}else{
					$(_this.v_view2.el).hide();
					document.getElementById('lease_list').style.display='none';
				}
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PAGE_SETTINGS_LAN_IPV6_SETTINGS({ el: Backbone.$('.view_1', _this.$el), owner_name: _this.name });	
		_this.v_view2 = new PAGE_SETTINGS_LAN_IPV6_LEASE_LIST({ el: Backbone.$('.view_2', _this.$el), owner_name: _this.name });
	}
});

var PAGE_SETTINGS_LAN_IPV6_LEASE_LIST = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_IPV6_LEASE_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<% if(hasMaxLimit){ %>'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<% } else { %>'
	+'<div class="jioTableHeading">'
	+'<% } %>'
	+'<div class="jioH2" langid="PAGE_SETTINGS_LAN_IPV6_LEASE_LIST"></div>'
	+'<% if(hasMaxLimit){ %>'
	+'<div class="v_MaxLimit"></div>'
	+'<% } %>'
	//+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	//+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1"></table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	randerParam: {
		hasMaxLimit: false
	},
	islog: false,
	eventId: 0,
	owner_name: null,
	events: {
		//'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_LanIPV6_LEASE_RESERVATION_LIST();
		if (_this.randerParam.hasMaxLimit){
				_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
			}
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template(_this.randerParam));
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		if (_this.randerParam.hasMaxLimit){
		  _this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		  });
		}
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		var head = [{
			sort: true,
			lang: "LAN_IPV6_1",
			str: "Client Host Name"
		},{
			sort: true,
			lang: "LAN_IPV6_2",
			str: "IPv6 Address"
		},{
			sort: true,
			lang: "LAN_IPV6_3",
			str: "MAC Address"
		},{
			sort: true,
			lang: "LAN_IPV6_4",
			str: "Status"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);

			lists.push([
				{
					str: val.client_host_name
				},{
					str: val.ipv6_address
				},{
					str: val.mac_address
				},{
					str: val.status == 1 ? getHTMLString('LAN_IPV6_5') : getHTMLString('LAN_IPV6_6')
				},{
					id: key,
					btn: [{
						type: 'more'
					}, {
						type: 'del'
					}]
				}
			]);
		});
		_this.collection_len = c_lists.length;
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if (_this.randerParam.hasMaxLimit){
		  if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		  }else{
			_this.modelMaxLimit.setError(false);
		  }
		}
	},
	/*btnAdd: function() {
		//console.log(this.name, 'btnAdd');
		
		var _this = this;
		if(_this.randerParam.hasMaxLimit && _this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_RULES'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {

		}
	},*/
	_list_event: function(v) {
		 //console.log(this.name, '_list_event');
		var _this = this;
		_this.eventId = v.id;
		// console.log(v.id);

		var model = _this.collection.at(v.id);
		if(v.type === 'del'){

			_this.eventId = v.id;
	
			var model_collection = _this.collection.at(v.id);
			if(model_collection){
				var strItems = _sysFunc.remove_num_comma_in_value(model_collection.get('client_host_name'));
				_this.popupDeleteMsg(strItems, _this.name+'delete');
			}

		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_LanIPV6_LEASE_RESERVATION();
			app.popup_view.model.set({
				id: this.name+'more',
				title: getHTMLString('LAN_IPV6_7') 
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Client Host Name',
					lang: 'LAN_IPV6_1',
					text: ''
				},{
					str: 'IPv6 Address',
					lang: 'LAN_IPV6_2',
					text: ''
				},{
					str: 'MAC Address',
					lang: 'LAN_IPV6_3',
					text: ''
				},{
					str: 'Status',
					lang: 'LAN_IPV6_4',
					text: ''
				}]
			};

			app.popup_view.apply1 = {
				0: 'client_host_name',
				1: 'ipv6_address',
				2: 'mac_address',
				3: 'status'
			};
			var attr = _.clone(model.attributes);
			obj_remove_num_comma_in_attr_values(attr);
			attr.status = attr.status == 1 ? getHTMLString('LAN_IPV6_5') : getHTMLString('LAN_IPV6_6')
			app.popup_view.modelInput.set(attr);
		}
	},
	popupDeleteMsg: function(strItems, popupId){

		  var strFormat = getHTMLString('LAN_IPV6_9');
		  var str = strFormat.replace("%ITEMS%", strItems);
		  
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: popupId,
						title: getHTMLString('URL_FILTER_4'),
						info: str,
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		var _this = this;
		if(data.id === 1000){
			app._popupViewingClose();
		}else if (data.id === 3000){//'del error'
			app._popupViewingClose();
		}else if(data.id === this.name+'more'){ //more
			app._popupViewingClose();
		}else if(data.id === _this.name+'delete'){ //delete
			var collection_model = _this.collection.at(_this.eventId);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			_this.model = new m_BASE_LIST_DEL(null, {url: '/data/lanipv6_lease_reservation_del.json'});
			var res = _this.model.set({ delete_rule: _this.eventId });
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(collection_model){
						collection_model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}else{
					if(res._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_ALL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 5000);
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_SETTINGS_LAN_IPV6_SETTINGS = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_IPV6_SETTINGS", // no need to have string
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_LAN_IPV6_TITLE">LAN IPv6</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	owner_name: null,
	apply1: {
		0: 'ipv6_address',
		1: 'ipv6_prefix_length',
		2: 'dhcpv6_server',
		3: 'lease_time'
	},
	apply2: {
		0: 'primary_dns',
		1: 'secondary_dns',
		2: 'server_preference',
		3: 'prefix_delegation'
	},
	apply3: {
		0: 'ipv6_address',
		1: 'ipv6_prefix_length',
		2: 'dhcpv6_server'
	},
	apply4: {
		0: 'primary_dns',
		1: 'secondary_dns'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_LanIPV6_Settings();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_viewModelChange);	
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'IPv6 Address',
				lang: 'LAN_IPV6_10',
				text: _this.model.get('ipv6_address'),
				data: ''
			},{
				str: 'IPv6 Prefix Length',
				lang: 'LAN_IPV6_11',
				text: _this.model.get('ipv6_prefix_length'),
				data: ''
			},{
				str: 'DHCPV6 Server',
				lang: 'LAN_IPV6_13',
				dropdown: true,
				visible: false,
				options: [/*{
					str: 'Stateful',
					lang: '',
					data: 'Stateful'
				},*/{
					str: 'Stateless',
					lang: '',
					data: 'Stateless'
				}],
				data: ''
			},{
				str: 'Lease Time',
				lang: 'LAN_IPV6_15',
				input: true,
				inputstr: getHTMLString('LAN_IPV6_16'),
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Primary DNS',
				lang: 'LAN_IPV6_18',
				text: _this.model.get('primary_dns'),
				data: ''
			},{
				str: 'Secondary DNS',
				lang: 'LAN_IPV6_19',
				text: _this.model.get('secondary_dns'),
				data: ''
			},{
				str: 'Server Preference',
				lang: 'LAN_IPV6_17',
				input: true,
				inputstr: '(1-255)',
				data: ''
			},{
				str: 'Prefix Delegation',
				lang: 'LAN_IPV6_20',
				checked: true,
				data: ''

			}]
		};
		var set3 = {
			arr: [{
				str: 'IPv6 Address',
				lang: 'LAN_IPV6_10',
				text: _this.model.get('ipv6_address'),
				data: ''
			},{
				str: 'IPv6 Prefix Length',
				lang: 'LAN_IPV6_11',
				text: _this.model.get('ipv6_prefix_length'),
				data: ''
			},{
				str: 'DHCPV6 Server',
				lang: 'LAN_IPV6_13',
				dropdown: true,
				visible: false,
				options: [/*{
					str: 'Stateful',
					lang: '',
					data: 'Stateful'
				},*/{
					str: 'Stateless',
					lang: '',
					data: 'Stateless'
				}],
				data: ''
			}]
		};
		var set4 = {
			arr: [{
				str: 'Primary DNS',
				lang: 'LAN_IPV6_18',
				text: _this.model.get('primary_dns'),
				data: ''
			},{
				str: 'Secondary DNS',
				lang: 'LAN_IPV6_19',
				text: _this.model.get('secondary_dns'),
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {	
		//console.log('v_viewModelChange');
		var _this = this;

		var v_attr_onOffButtonLocated1 = _.clone(_this.v_view1.model.attributes);
		var v_attr_onOffButtonLocated2 = _.clone(_this.v_view2.model.attributes);
		var dhcpv6_server = v_attr_onOffButtonLocated1.arr[2].data;
		var b_showList = true;
		var changed = false;

		if(dhcpv6_server === 'Stateless'){
			b_showList = false;
			_.map(v_attr_onOffButtonLocated1.arr, function(v, k){
				if(Number(k) === 3 && !v.disabled){
					v.disabled = true;
					v.hidden = true;
					changed = true;
				}
			});
			_.map(v_attr_onOffButtonLocated2.arr, function(v, k){
				if((Number(k) === 2 || Number(k) === 3) && !v.disabled){
					v.disabled = true;
					v.hidden = true;
					changed = true;
				}
			});
		}else{
			b_showList = true;
			_.map(v_attr_onOffButtonLocated1.arr, function(v, k){
				if(Number(k) === 3 && v.disabled){
					v.disabled = false;
					v.hidden = false;
					changed = true;
				}
			});
			_.map(v_attr_onOffButtonLocated2.arr, function(v, k){
				if((Number(k) === 2 || Number(k) === 3) && v.disabled){
					v.disabled = false;
					v.hidden = false;
					changed = true;
				}
			});
		}
		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhide_list', data: b_showList});
		}
		if(changed){
			_this.v_view1.model.set(v_attr_onOffButtonLocated1);
			_this.v_view1.model.trigger('change');
			_this.v_view2.model.set(v_attr_onOffButtonLocated2);
			_this.v_view2.model.trigger('change');
		}

	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		//var list_name = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'get_list_view_name'}) : '');
		//var collection_len = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: list_name, from: _this.name, want: 'get_list_length'}) : 0);
		var v_attr_onOffButtonLocated = _.clone(_this.v_view1.model.attributes);
		var dhcpv6_server = v_attr_onOffButtonLocated.arr[2].data;

		if(dhcpv6_server === 'Stateless'){
			var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply3, _this.apply4]);
		}else{
			var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		}
		if(!_.isEmpty(_this.model.changed)){
		  if(_this.model.attributes !== _this.model._previousAttributes){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		  }
		}

	},
	_popup_apply: function(data){
		if(data.id === 5000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_RADVD = Backbone.View.extend({
	name: "PAGE_SETTINGS_RADVD_SETTINGS",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_RADVD_SETTINGS"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide view_1">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new RADVD_BLOCK({ el: Backbone.$('.view_1', _this.$el), owner_name: _this.name });	
	}
});

var RADVD_BLOCK = Backbone.View.extend({
	name: "RADVD_BLOCK",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PAGE_SETTINGS_RADVD"></div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	owner_name: null,
	apply1: {
		0: 'status',
		1: 'advertise_mode',
		2: 'advertise_interval',
		3: 'ra_flag_managed'
	},
	apply2: {
		0: 'ra_flag_other',
		1: 'router_preference',
		//2: 'mtu',
		2: 'router_lifetime'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_RADVD_Settings();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_viewModelChange);	
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Status',
				lang: 'RADVD_1',
				checked: true,
				data: ''
			},{
				str: 'Advertise Mode',
				lang: 'RADVD_2',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Unsolicited Multicast',
					lang: 'RADVD_3',
					data: '0'
				},{
					str: 'Unicast Only',
					lang: 'RADVD_14',
					data: '1'
				}],
				data: ''
			},{
				str: 'Advertise Interval',
				lang: 'RADVD_4',
				input: true,
				inputstr: getHTMLString('RADVD_5'),
				data: ''
			},{
				str: 'RA Flag Managed',
				lang: 'RADVD_6',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'RA Flag Other',
				lang: 'RADVD_7',
				checked: true,
				data: ''
			},{
				str: 'Router Preference',
				lang: 'RADVD_8',
				dropdown: true,
				visible: false,
				options: [{
					str: 'High',
					lang: 'RADVD_9',
					data: 'High'
				},{
					str: 'Medium',
					lang: 'RADVD_15',
					data: 'Medium'
				},{
					str: 'Low',
					lang: 'RADVD_16',
					data: 'Low'
				}],
				data: ''
			},/*{
				str: 'MTU',
				lang: 'RADVD_10',
				text: _this.model.get('mtu'),
				data: ''
			},*/{
				str: 'Router Lifetime',
				lang: 'RADVD_12',
				input: true,
				inputstr: getHTMLString('RADVD_13'),
				data: ''

			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {	
		//console.log('v_viewModelChange');
		var _this = this;


	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		if(!_.isEmpty(_this.model.changed)){
		  if(_this.model.attributes !== _this.model._previousAttributes){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		  }
		}

	},
	_popup_apply: function(data){
		if(data.id === 5000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_PMIPV6 = Backbone.View.extend({
	name: "PAGE_SETTINGS_PMIPV6_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid=""></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide view_1">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new PMIPv6_BLOCK({ el: Backbone.$('.view_1', _this.$el), owner_name: _this.name });	
	}
});

var PMIPv6_BLOCK = Backbone.View.extend({
	name: "PMIPv6_BLOCK",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PMIPV6_1"></div>' // PMIP Status
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view1_2">'
	+'</div>'
	+'</div>'
	
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PMIPV6_2"></div>'  //DHCP Server
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2_2">'
	+'</div>'
	+'</div>'

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PMIPV6_3"></div>'  // PMIPv4
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view3_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3_2">'
	+'</div>'
	+'</div>'

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PMIPV6_4"></div>'  // PMIPv6
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view4_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view4_2">'
	+'</div>'
	+'</div>'

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="PMIPV6_5"></div>'  // GRE Key
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view5_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view5_2">'
	+'</div>'
	+'</div>'
	
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1_1: null,
	v_view1_2: null,
	v_view2_1: null,
	v_view2_2: null,
	v_view3_1: null,
	v_view3_2: null,
	v_view4_1: null,
	v_view4_2: null,
	v_view5_1: null,
	v_view5_2: null,
	owner_name: null,
	// PMIP Status
	set1_1:{
			arr: [
				{ str: 'PMIP', lang: 'PMIPV6_6', checked: true,	data: ''}
			]
	},
	apply1_1: {
		0: 'pmipstatus_pmip'
	},
	set1_2: {
			arr: []
	},
	apply1_2: {
	},
	// DHCP Server
	set2_1:{
	  arr: [
		{ str: 'Server', lang: 'PMIPV6_7', checked: true,	 data: ''},
		{ str: 'Starting IP Address', lang: 'PMIPV6_8', input: true, data: ''},
		{ str: 'Ending IP Address', lang: 'PMIPV6_9', input: true,  data: ''}
	  ]
	},
	apply2_1: {
		0: 'dhcpserver_server',
		1: 'dhcpserver_starting_ip_address',
		2: 'dhcpserver_ending_ip_address'
	},
	set2_2:{
	  arr: [
		{ str: 'Subnet Mask', lang: 'PMIPV6_10', input: true,  data: ''},
		{ str: 'Primary DNS', lang: 'PMIPV6_11', input: true,  data: ''},
		{ str: '', lang: '', data: ''}
		
	  ]
	},
	apply2_2: {
		0: 'dhcpserver_subnet_mask',
		1: 'dhcpserver_primary_dns',
		2: ''
	},
	// PMIPv4
	set3_1:{
	  arr: [
		{ str: 'Tunnel End Point IPv4 Address', lang: 'PMIPV6_12', input: true,  data: ''}
	  ]
	},
	apply3_1: {
		0: 'pmipv4_tunnel_end_point_ipv4_address'
	},
	set3_2:{
	  arr: [
		{ str: 'Tunnel End Point Port', lang: 'PMIPV6_13', input: true,  data: ''}
	  ]
	},
	apply3_2: {
		0: 'pmipv4_tunnel_end_point_port'
	},
	// PMIPv6
	set4_1:{
	  arr: [
		{ str: 'Tunnel End Point IPv6 Address', lang: 'PMIPV6_14', input: true,  data: ''},
		{ str: 'Tunnel End Point Port', lang: 'PMIPV6_15', input: true,  data: ''},
		{ str: 'Mobile Node ID (IMSI)', lang: 'PMIPV6_16', input: true,  data: ''}
	  ]
	},
	apply4_1: {
		0: 'pmipv6_tunnel_end_point_ipv6_address',
		1: 'pmipv6_tunnel_end_point_port',
		2: 'pmipv6_mobile_node_id_imsi'
	},
	set4_2:{
	  arr: [
		{ str: 'APN Configured', lang: 'PMIPV6_17', input: true,  data: ''},
		{ str: 'DMNP Prefix', lang: 'PMIPV6_18', input: true,  data: ''},
		{ str: 'DMNP Prefix Length', lang: 'PMIPV6_19', input: true,  data: ''}
	  ]
	},
	apply4_2: {
		0: 'pmipv6_apn_configured',
		1: 'pmipv6_dmnp_prefix',
		2: 'pmipv6_dmnp_prefix_length'
	},
	// GRE Key
	set5_1:{
	  arr: [
		{ str: 'Status', lang: 'PMIPV6_20', checked: true,	data: ''}
	  ]
	},
	apply5_1: {
		0: 'grekey_status'
	},
	set5_2:{
	  arr: [
		{ str: 'GRE Key', lang: 'PMIPV6_21', input: true,  data: ''}
	  ]
	},
	apply5_2: {
		0: 'grekey_gre_key'
	},
	
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_PMIPv6_Settings();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view1_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1_1', _this.$el) });
		_this.v_view1_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1_2', _this.$el) });
		_this.v_view2_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2_1', _this.$el) });
		_this.v_view2_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2_2', _this.$el) });
		_this.v_view3_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3_1', _this.$el) });
		_this.v_view3_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3_2', _this.$el) });
		_this.v_view4_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view4_1', _this.$el) });
		_this.v_view4_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view4_2', _this.$el) });
		_this.v_view5_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view5_1', _this.$el) });
		_this.v_view5_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view5_2', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;


		var res = _this._sChangeViews(_this.model, 
			[
				_this.set1_1, _this.set1_2,
				_this.set2_1, _this.set2_2,
				_this.set3_1, _this.set3_2,
				_this.set4_1, _this.set4_2,
				_this.set5_1, _this.set5_2
			], [	
					_this.v_view1_1, _this.v_view1_2,
					_this.v_view2_1, _this.v_view2_2,
					_this.v_view3_1, _this.v_view3_2,
					_this.v_view4_1, _this.v_view4_2,
					_this.v_view5_1, _this.v_view5_2
			], [
					_this.apply1_1, _this.apply1_2,
					_this.apply2_1, _this.apply2_2,
					_this.apply3_1, _this.apply3_2,
					_this.apply4_1, _this.apply4_2,
					_this.apply5_1, _this.apply5_2
			]);
	},
	v_viewModelChange: function() {	
		//console.log('v_viewModelChange');
		var _this = this;


	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, 
				[
					_this.v_view1_1, _this.v_view1_2, 
					_this.v_view2_1, _this.v_view2_2,
					_this.v_view3_1, _this.v_view3_2,
					_this.v_view4_1, _this.v_view4_2,
					_this.v_view5_1, _this.v_view5_2
				], 
				[
					_this.apply1_1, _this.apply1_2,
					_this.apply2_1, _this.apply2_2,
					_this.apply3_1, _this.apply3_2,
					_this.apply4_1, _this.apply4_2,
					_this.apply5_1, _this.apply5_2
				]);
		if(!_.isEmpty(_this.model.changed)){
		  if(_this.model.attributes !== _this.model._previousAttributes){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		  }
		}

	},
	_popup_apply: function(data){
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});



var FIREWALL_FIREWALL = Backbone.View.extend({
	name: "FIREWALL_FIREWALL",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="FIREWALL_1"></div>' // Firewall
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view1_2">'
	+'</div>'
	+'</div>'
	
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="FIREWALL_2"></div>'  //DMZ
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2_1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2_2">'
	+'</div>'
	+'</div>'
	
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1_1: null,
	v_view1_2: null,
	v_view2_1: null,
	v_view2_2: null,
	owner_name: null,
	bCheckingFirewallOff: false,
	// Firewall
	set1_1:{
			arr: [
				{ str: 'Status', lang: 'FIREWALL_3', checked: true,	data: ''}
			]
	},
	apply1_1: {
		0: 'firewall_status'
	},
	set1_2: {
			arr: []
	},
	apply1_2: {
	},
	// DMZ
	set2_1:{
	  arr: [
		{ str: 'Status', lang: 'FIREWALL_3', checked: true,	 data: ''},
		{ str: 'IP Address Type', lang: 'FIREWALL_4', dropdown: true,
				visible: false,
				options: [{
					str: 'IPv4',
					lang: 'FIREWALL_6',
					data: 'IPv4'
				}],
				data: ''}
	  ]
	},
	apply2_1: {
		0: 'dmz_status',
		1: 'dmz_ipaddr_type'
	},
	set2_2:{
	  arr: [
		{ str: '', lang: '', data: ''},
		{ str: 'DMZ IP Address', lang: 'FIREWALL_5', input: true,  data: ''}		
	  ]
	},
	apply2_2: {
		0: '',
		1: 'dmz_dmz_ipaddr'
	},

	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_Firewall_Settings();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view1_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1_1', _this.$el) });
		_this.listenTo(_this.v_view1_1.model, 'change', _this.v_view1_1_ModelChange);
		//_this.v_view1_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1_2', _this.$el) });
		_this.v_view2_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2_1', _this.$el) });
		_this.listenTo(_this.v_view2_1.model, 'change', _this.v_view2_1_ModelChange);
		_this.v_view2_2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2_2', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function(model, resp, options) {
		 //console.log('modelSync');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
        _this.v_view2_1_ModelChange();
		// becase fetchOLDJSON() to read json and changes model value, it invokes modelChange() and view model change.
		// the firewall msg is invoked if it is off, due to view model change.
		// we turn off the firewall msg checking initially.
		// after all are ready, model invokes sync.  we then turn on the firewall msg checking here.
		_this.bCheckingFirewallOff = true;
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;

		var res = _this._sChangeViews(_this.model, 
			[
				_this.set1_1, //_this.set1_2,
				_this.set2_1, _this.set2_2
			], [	
					_this.v_view1_1, //_this.v_view1_2,
					_this.v_view2_1, _this.v_view2_2
			], [
					_this.apply1_1, //_this.apply1_2,
					_this.apply2_1, _this.apply2_2
			]);

		//console.log('modelChange - e');
	},


	v_view1_1_ModelChange: function() {	
		//console.log('v_view1_1_ModelChange');
		var _this = this;
		if (!_this.bCheckingFirewallOff) return;
		
		var v_1_1 = _this.v_view1_1;
		var v_attr1_1 = _.clone(v_1_1.model.attributes);
		var i_apply1_1 = _.invert(_this.apply1_1);
		
		if (v_attr1_1.arr.length > 0){
		  if(v_attr1_1.arr[i_apply1_1.firewall_status].data === '0'){
			  //console.log("popup alert msg");
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 1000,
						warn_title: getHTMLString('FIREWALL_9'),
						info: getHTMLString('FIREWALL_8'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
		  }else{

		  }
		}

	},
	v_view2_1_ModelChange: function() {	
		//console.log('v_view2_1_ModelChange');
		var _this = this;
		
		var v_2_1 = _this.v_view2_1;
		var v_2_2 = _this.v_view2_2;
				

		var v_attr2_1 = _.clone(v_2_1.model.attributes);
		var i_apply2_1 = _.invert(_this.apply2_1);
		
		var v_attr2_2 = _.clone(v_2_2.model.attributes);
		
		if (v_attr2_2.arr.length > 0){
		
		  var changed2_2 = false;
		  var changed2_1 = false;
		  if(v_attr2_1.arr[i_apply2_1.dmz_status].data === '0'){
			  
			  if (!v_attr2_1.arr[i_apply2_1.dmz_ipaddr_type].disabled){
				  v_attr2_1.arr[i_apply2_1.dmz_ipaddr_type].disabled = true;
				  changed2_1 = true;				  
			  }
			  
				_.map(v_attr2_2.arr, function(v, k){
					if(!v.disabled){
						v.disabled = true;
						changed2_2 = true;
					}
				});
		  }else{
			  if (v_attr2_1.arr[i_apply2_1.dmz_ipaddr_type].disabled){
				  v_attr2_1.arr[i_apply2_1.dmz_ipaddr_type].disabled = false;
				  changed2_1 = true;				  
			  }
				_.map(v_attr2_2.arr, function(v, k){
					if(v.disabled){
						v.disabled = false;
						changed2_2 = true;
					}
				});
		  }
		  if(changed2_2){
			v_2_2.model.set(v_attr2_2);
			v_2_2.model.trigger('change');
		  }
		  if(changed2_1){
			v_2_1.model.set(v_attr2_1);
			v_2_1.model.trigger('change');
		  }
	  }
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		
		// _sSaveModel() will trigger view.model::change.  
		// And in this page, v_view1_1_ModelChange popup a msg. This causes problem.
		// Therefore, we set a flag bCheckingFirewallOff to able to see if the view.model::change is invoked by _sSaveModel().
		_this.bCheckingFirewallOff = false;  
	
		var res = _this._sSaveModel(false, _this.model, 
				[
					_this.v_view1_1, //_this.v_view1_2, 
					_this.v_view2_1, _this.v_view2_2
				], 
				[
					_this.apply1_1, //_this.apply1_2,
					_this.apply2_1, _this.apply2_2
				]);

		// _sSaveModel() sends POST and invokes sync.  
		// However, When receiving data from post, it does not change view data and then no firewall msg is invoked. 
		// So, it is safe to turn on the flag here.
		_this.bCheckingFirewallOff = true;  
		
		if(!_.isEmpty(_this.model.changed)){
		  if(_this.model.attributes !== _this.model._previousAttributes){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		  }
		}

	},
	_popup_apply: function(data){
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	_popup_close: function(data){
	  if(data.id === 1000){
			// set firewall status to '1'
		var _this = this;
		
		var v_1_1 = _this.v_view1_1;
		var v_attr1_1 = _.clone(v_1_1.model.attributes);
		var i_apply1_1 = _.invert(_this.apply1_1);
		
		if (v_attr1_1.arr.length > 0){
			var changed = false;
		  if(v_attr1_1.arr[i_apply1_1.firewall_status].data === '0'){
			v_attr1_1.arr[i_apply1_1.firewall_status].data = '1';
			changed = true;
		  }else{

		  }
		  if(changed){
			v_1_1.model.set(v_attr1_1);
			v_1_1.model.trigger('change');
		  }
		}			
			
	  }
	  app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS = Backbone.View.extend({
	name: "PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS",
	template: ''
	+'<div class="jioH2" langid="PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS">Auto Reboot Settings</div>'
	+'<div class="v_view1"></div>'
	+'<div class="v_view2_monthly"></div>'
	+'<div class="v_view2_weekly"></div>'
	+'<div class="v_view3"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2_monthly: null,
	v_view2_weekly: null,
	v_view3: null,
	set1: { arr: [
			{ 
				str: 'Reboot Schedule', lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_1', 
				dropdown: true,
				visible: false,
				options: [{
					str: 'Never',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_2',
					data: 'Never'
				},{
					str: 'Daily',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_3',
					data: 'Daily'
				},{
					str: 'Weekly',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_4',
					data: 'Weekly'
				},{
					str: 'Monthly',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_5',
					data: 'Monthly'
				}],
				data: ''
			}]
	},
	apply1: {
		0: 'auto_reboot_schedule'
	},
	set2_monthly: { arr: [
			{ 
				str: 'Select Reboot Day', lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_6', 
				dropdown: true,
				dropdown_monthlydaypicker: true,
				visible: false,
				data: ''
			}]
	},
	apply2_monthly: {
		0: 'auto_reboot_monthly_day'
	},
	set2_weekly: { arr: [
			{ 
				str: 'Select Reboot Day', lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_6', 
				dropdown: true,
				visible: false,
				options: [{
					str: 'Monday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_7',
					data: 'Monday'
				},{
					str: 'Tuesday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_8',
					data: 'Tuesday'
				},{
					str: 'Wednesday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_9',
					data: 'Wednesday'
				},{
					str: 'Thursday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_10',
					data: 'Thursday'
				},{
					str: 'Friday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_11',
					data: 'Friday'
				},{
					str: 'Saturday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_12',
					data: 'Saturday'
				},{
					str: 'Sunday',
					lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_13',
					data: 'Sunday'
				}],
				data: ''
			}]
	},
	apply2_weekly: {
		0: 'auto_reboot_weekly_day'
	},
	set3: { arr: [{ 
				str: 'Select Reboot Time', lang: 'PAGE_ADMIN_USER_MANAGEMENT_AUTO_REBOOT_SETTINGS_14', input: true, input_time: true, data: ''
			}]
	},
	apply3: {
		0: 'auto_reboot_time'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_ADMIN_AUTO_REBOOT_SETTINGS();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_view1_ModelChange);
		_this.v_view2_monthly = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2_monthly', _this.$el) });
		_this.v_view2_weekly = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2_weekly', _this.$el) });
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
		// 	//console.log(_response);
		// }
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					if(_response == '1'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						model_change_status = 0;
					}
				}
			}, 5000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;

		var res = _this._sChangeViews(_this.model, 
						[_this.set2_weekly, _this.set2_monthly, _this.set3, _this.set1], 
						[_this.v_view2_weekly, _this.v_view2_monthly, _this.v_view3, _this.v_view1], 
						[_this.apply2_weekly, _this.apply2_monthly, _this.apply3, _this.apply1]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	v_view1_ModelChange: function() {	
		//console.log('v_view1_ModelChange');

		var _this = this;
		
		var v_1 = _this.v_view1;
		var v_attr1 = _.clone(v_1.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		
		[
		 { view: _this.v_view3, disabled: (v_attr1.arr[i_apply1.auto_reboot_schedule].data === 'Never') }, 
		 { view: _this.v_view2_weekly, disabled: (v_attr1.arr[i_apply1.auto_reboot_schedule].data !== 'Weekly') },
		 { view: _this.v_view2_monthly, disabled: (v_attr1.arr[i_apply1.auto_reboot_schedule].data !== 'Monthly') }
		].forEach(function myFunction(value, index, array) {
		 
		 var v_3 = value.view;
		 var v_attr3 = _.clone(v_3.model.attributes);

		 if (v_attr3.arr.length > 0){
		
		  var changed3 = false;

		  if(value.disabled){
			  
				_.map(v_attr3.arr, function(v, k){
					if(!v.disabled){
						v.disabled = true;
						changed3 = true;
					}
				});
		  }else{

				_.map(v_attr3.arr, function(v, k){
					if(v.disabled){
						v.disabled = false;
						changed3 = true;
					}
				});
		  }
		  if(changed3){
			v_3.model.set(v_attr3);
			v_3.model.trigger('change');
		  }

		 }
		});

		switch(v_attr1.arr[i_apply1.auto_reboot_schedule].data){
			case 'Never':
			case 'Daily':
			case 'Weekly':
				$(_this.v_view2_monthly.el).hide();
				$(_this.v_view2_weekly.el).show();
				break;
			case 'Monthly':
				$(_this.v_view2_weekly.el).hide();
				$(_this.v_view2_monthly.el).show();
				break;
			default:		
		}	

	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;

		var res = _this._sSaveModel(false, _this.model, 
						[_this.v_view1, _this.v_view2_weekly, _this.v_view2_monthly, _this.v_view3], 
						[_this.apply1, _this.apply2_weekly, _this.apply2_monthly, _this.apply3]);

		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			}
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});



var PAGE_HELP_LOGS_V1DOT6 = Backbone.View.extend({
	name: "PAGE_HELP_LOGS_TITLE",
	template: ""
	+'<div class="jio2SectionGrid">'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_HELP_LOGS_PERFORM_DNS_LOOKUP">Perform a DNS Lookup</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio2SectionWithInput jioH2MobileShowHide v_topleft"></div>'
	+'</div>'
	+'<div></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_HELP_LOGS_DISPLAY_ROUTING_TABLE">Display Routing Table</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio2SectionWithInput jioH2MobileShowHide v_topright"></div>'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="LOGS_LOGS">Logs</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide v1"></div>'
	+'</div>'
	+'<div class="jioContentRowsGap v2_showArea"></div>'
	+'<div class="jioMobileSection v2_showArea">'
	+'</div>'
	+'</div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="LOGS_LOG_ACTIONS">Logs Actions</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide v2">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="LOGS_1">Capture Packets</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide v3">'
	+'</div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
    ,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	v_view5: null,
	events: {
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);

		_this.render();
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view3._popup_apply){
			_this.v_view3._popup_apply(data);
		}
	},
	_popup_close: function(data){
		//console.log('_popup_close');
		//console.log(data);
		var _this = this;
		if(_this.v_view3._popup_close){
			_this.v_view3._popup_close(data);
		}else{
			app._popupViewingClose();
		}
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhide_LogActions'){
				$('.v2_showArea', _this.$el).show();
			}
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new LOGS_LOGS({ el: Backbone.$('.v1', _this.$el), owner_name: _this.name  });
		_this.v_view2 = new LOGS_LOG_ACTIONS({ el: Backbone.$('.v2', _this.$el), owner_name: _this.name  });	
		_this.v_view3 = new LOGS_CAPTURE_PACKETS({ el: Backbone.$('.v3', _this.$el), owner_name: _this.name  });	
		_this.v_view4 = new LOGS_DNS({ el: Backbone.$('.v_topleft', _this.$el), owner_name: _this.name  });
		_this.v_view5 = new LOGS_ROUTETABLE({ el: Backbone.$('.v_topright', _this.$el), owner_name: _this.name  });
	}
});

var LOGS_DNS = Backbone.View.extend({
	name: "LOGS_DNS",
	template: ''
	+'<div class="jioH2" langid="LOGS_DNS">Perform a DNS Lookup</div>'
	+'<div class="v_view4_1"></div>'	
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="LOGS_DNS_LOOKUP_BUTTON" value="Look up">'
	+'</div>'
	+'</div>',
	model: null,
	v_view4_1: null,
	set1:{
		arr: [{
			str: 'dns_name',
			lang: 'LOGS_DNS_INTERNET_NAME',
			input: true,
			data: ''
		}]
	},
	apply1: {
		0: 'dns_name'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function () {
		var _this = this;
		_this.model = new m_LOGS_DNS();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view4_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view4_1', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		if( _response && _response != '\n' && _response !='1' ){
			//console.log(_response);
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 'result',
				title: getHTMLString('LOGS_RESULT'),
				info: '<p style="white-space: pre;text-align: left;">'+_response+'</p>', 
				warn: ''
			});
			Backbone.$('.jiomodalBoxContainer', app.$el).attr('style', 'z-index: 5;');
		}
		else if(_response =='1' || _response == '\n')
		{
			app._popupViewingClose();
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var value;
		var set1 = {
			arr: [{
				str: 'dns_name',
				lang: 'LOGS_DNS_INTERNET_NAME',
				input: true,
				data: ''
			}]
		};

		//for view
		//if(_this.v_view4_1.model.attributes.arr[0]!=undefined){
			//value = _this.v_view4_1.model.attributes.arr[0].data.split(",");

			//_this.v_view4_1.model.attributes.arr[0].data = value[1];
		//}
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view4_1], [_this.apply1]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		var _this = this;
		if(_this.v_view4_1.model.attributes.arr[0]!=undefined){
			var res = _this._sSaveModel(false, _this.model, [_this.v_view4_1], [_this.apply1]);
			var value = _this.v_view4_1.model.attributes.arr[0].data;
			if( value!=' ' && value!='')
			{
				if( !_.isEmpty(_this.model.changed)){
					if(_this.model.attributes.dns_name !== '')
					{
						app._popupViewing(POPUP_LOADING);
						app.popup_view.model.set({ str: getHTMLString('LOGS_SAVING_PROCESSING') }); // Please wait...
						model_change_status = 1;
					}
				}
			}
		}
	},
	_popup_close: function(data){
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var LOGS_ROUTETABLE = Backbone.View.extend({
	name: "LOGS_ROUTETABLE",
	template: ''
	+'<div class="jioH2" langid="LOGS_ROUTETABLE">Display Routing Table</div>'  //Routing Table
	+'<div class="v_view5_1"></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="LOGS_ROUTETABLE_BUTTON" value="Display">'
	+'</div>'
	+'</div>',
	model: null,
	v_view5_1: null,
	set2:{
		arr: [
		{ str: 'IP Type', lang: 'LOGS_ROUTETABLE_IP_TYPE', dropdown: true,
			visible: false,
			options: [{
				str: 'ipv4',
				lang: 'LOGS_30',
				data: 'ipv4'
			},{
				str: 'ipv6',
				lang: 'LOGS_31',
				data: 'ipv6',
			}],
			data: ''}
		]
	},
	apply2: {
		0: 'ip_type'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_LOGS_ROUTE();
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view5_1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view5_1', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;
	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		if(_response){
			var routeTable=this.routeTableList(_response);
			app._popupViewing(POPUP_LOGS_ROUTE_TABLE);
			app.popup_view.model.set({
				id: 'result2',
				title: getHTMLString('LOGS_RESULT'),
				info: routeTable,
				warn: ''
			});
			Backbone.$('.jiomodalBoxContainer', app.$el).attr('style', 'z-index: 5;');
		}
	},
	routeTableList: function(_response){

		var LineNumber = _response.split("\n").filter(item=>item!="").length;
		if( LineNumber > 2 )//exist route table info 
		{
			var ColumnNumber = _response.split("\n")[2].split(" ").filter(item=>item!="").length;
			var tableStrings = "<table style='border-collapse:collapse;text-align:left'>"
			//title
			tableStrings += '<tr>'
			tableStrings += '<td colspan="'+ColumnNumber+'" style="width:50px;height:20px;text-align:left">'+_response.split("\n")[0]+'</td>'
			tableStrings += '</tr>'
			//classification
			if(_response.indexOf("Kernel IPv6 routing table")!=-1)
			{
				//ipv6
				tableStrings += '<tr>'
				tableStrings += '<td style="width:50px;height:20px">Destination</td>'
				tableStrings += '<td style="width:50px;height:20px">Next Hop</td>'
				tableStrings += '<td style="width:50px;height:20px">Flags</td>'
				tableStrings += '<td style="width:50px;height:20px">Metric</td>'
				tableStrings += '<td style="width:50px;height:20px">Ref</td>'
				tableStrings += '<td style="width:50px;height:20px">Use</td>'
				tableStrings += '<td style="width:50px;height:20px">Iface</td>'
				tableStrings += '</tr>'
			}
			else{
				//ipv4
				tableStrings += '<tr>'
				tableStrings += '<td style="width:50px;height:20px">Destination</td>'
				tableStrings += '<td style="width:50px;height:20px">Gateway</td>'
				tableStrings += '<td style="width:50px;height:20px">Genmask</td>'
				tableStrings += '<td style="width:50px;height:20px">Flags</td>'
				tableStrings += '<td style="width:50px;height:20px">Metric</td>'
				tableStrings += '<td style="width:50px;height:20px">Ref</td>'
				tableStrings += '<td style="width:50px;height:20px">Use</td>'
				tableStrings += '<td style="width:50px;height:20px">Iface</td>'
				tableStrings += '</tr>'
			}
			//content
			for(var i=2;i<LineNumber;i++){
				tableStrings += '<tr>'
				for(var j = 0; j < ColumnNumber; j++){
					var td_value = _response.split("\n")[i].split(" ").filter(item=>item!="")[j] == undefined ?"" : _response.split("\n")[i].split(" ").filter(item=>item != "")[j];
					//Cells
					tableStrings += '<td style="width:50px;height:20px">'+td_value+'</td>'
				}
				tableStrings += '</tr>'
			}
			tableStrings += '</table>'
		}
		else
		{	
			//Show when empty
			tableStrings += '<p style="white-space: pre;text-align: left;"></p>'
		}
		return tableStrings;
	},

	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var res = _this._sChangeViews(_this.model, [_this.set2], [_this.v_view5_1], [_this.apply2]);
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view5_1], [_this.apply2]);
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('LOGS_SAVING_PROCESSING') }); // Please wait...
		model_change_status = 1;
	},
	_popup_close: function(data){
	  app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var LOGS_LOGS = Backbone.View.extend({
	name: "LOGS_LOGS",
	template: ''

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="LOGS_LOGS"></div>'  //Logs
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	owner_name: null,
	set1:{
	  arr: [
		{ str: 'Log Status', lang: 'LOGS_16', checked: true,	 data: ''}
	  ]
	},
	apply1: {
		0: 'log_status'
	},
	set2:{
	  arr: [
		{ str: 'Log Level', lang: 'LOGS_17', dropdown: true,
				visible: false,
				options: [{
					str: 'Error',
					lang: 'LOGS_18',
					data: 'Error'
				},{
					str: 'Warning',
					lang: 'LOGS_19',
					data: 'Warning',
				},{
					str: 'Information',
					lang: 'LOGS_20',
					data: 'Information',
				},{
					str: 'Debug',
					lang: 'LOGS_21',
					data: 'Debug',
				},{
					str: 'Verbose (All)',
					lang: 'LOGS_22',
					data: 'All',
				}],
				data: ''}
	  ]
	},
	apply2: {
		0: 'log_level'
	},

	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_Logs_Logs();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_view_ModelChange);
		_this.listenTo(_this.v_view2.model, 'change', _this.v_view_ModelChange);
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function(model, resp, options) {
		 //console.log('modelSync');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;

		var res = _this._sChangeViews(_this.model, 
			[
				_this.set1, _this.set2
			], [	
					_this.v_view1, _this.v_view2
			], [
					_this.apply1, _this.apply2
			]);

		//console.log('modelChange - e');
	},


	v_view_ModelChange: function() {	
		//console.log('v_view1_ModelChange');
		var _this = this;
		
		var v_1 = _this.v_view1;
		var v_2 = _this.v_view2;
				

		var v_attr1 = _.clone(v_1.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		var v_attr2 = _.clone(v_2.model.attributes);
		
		if (v_attr2.arr.length > 0){
		
		  var changed2 = false;
		  var changed1 = false;
		  if(v_attr1.arr[i_apply1.log_status].data === '0'){
			  
				_.map(v_attr2.arr, function(v, k){
					if(!v.disabled){
						v.disabled = true;
						changed2 = true;
					}
				});
		  }else{
			if(_this.model.attributes.log_status == '0'){
				_.map(v_attr2.arr, function(v, k){
					if(!v.disabled){
						v.disabled = true;
						changed2 = true;
					}
				});
			}
			else
			{
				_.map(v_attr2.arr, function(v, k){
					if(v.disabled){
						v.disabled = false;
						changed2 = true;
					}
				});
			}
		}
		  if(changed2){
			v_2.model.set(v_attr2);
			v_2.model.trigger('change');
		  }
		  if(changed1){
			v_1.model.set(v_attr1);
			v_1.model.trigger('change');
		  }
	  }
		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhide_LogActions', data: v_attr1.arr[i_apply1.log_status].data});
		}
	  
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
			
		var res = _this._sSaveModel(false, _this.model, 
				[
					_this.v_view1, _this.v_view2
				], 
				[
					_this.apply1, _this.apply2
				]);

		
		if(!_.isEmpty(_this.model.changed)){
		  if(_this.model.attributes !== _this.model._previousAttributes){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		  }
		}

	},
	_popup_apply: function(data){
		if(data.id === 1000){
			app._popupViewingClose();
		}
	},
	_popup_close: function(data){
	  app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var LOGS_LOG_ACTIONS = Backbone.View.extend({
	name: "LOGS_LOG_ACTIONS",
	template: ''

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="LOGS_LOG_ACTIONS"></div>'  
	+'</div>'
	+'<div class="jio1SectionWithInput">'
	+' <div class="jioInputButton">'
	+'  <div class="jioLabelErrorContainer">'
	+'    <label class="jioLabel" langid="LOGS_12">To Clear All Existing Logs</label>'
	+'    <label class="JioErrorLabel" langid=""></label>'
	+'  </div>'
	+'  <div>'
	+'    <input type="button" class="btn_clear_logs" langid="LOGS_13" value="CLEAR LOGS">'
	+'  </div>'
	+' </div>'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput">'
	+' <div class="jioInputButton">'
	+'  <div class="jioLabelErrorContainer">'
	+'    <label class="jioLabel" langid="LOGS_14">To Download Logs</label>'
	+'    <label class="JioErrorLabel" langid=""></label>'
	+'  </div>'
	+'  <div>'
	+'    <input type="button" class="btn_download_logs" langid="LOGS_15" value="DOWNLOAD LOGS">'
	+'  </div>'
	+' </div>'
	+'</div>'
	,
	model: null,
	owner_name: null,
	events: {
		'click .btn_download_logs': 'btn_download_logs',
		'click .btn_clear_logs': 'btn_clear_logs'
		
	},
	preinitialize: function (o) {
		var _this = this;		
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;

		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		model_change_status = 0;

	},
	modelSync_download_logs: function(model, resp, options) {
		 //console.log('modelSync_download_logs');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
					
					window.parent.location = 'system_logs.tgz';				
					
				}
			}, 3000);
		}
	},
	modelSync_clear_logs: function(model, resp, options) {
		 //console.log('modelSync_clear_logs');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
					
				}
			}, 3000);
		}
	},
	btn_download_logs: function() {
		//console.log('btn_download_logs');
		var _this = this;
		
		_this.stopListening(_this.model, 'sync');
		
		_this.model = new m_Log_Actions();
		_this.listenTo(_this.model, 'sync', _this.modelSync_download_logs);
		_this.model.set({
			"log_actions_command": "download_logs"
		});
		
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('LOGS_25') }); // Please wait...
		model_change_status = 1;

		_this.model.savePOST(false);
	},
	btn_clear_logs: function() {
		//console.log('btn_clear_logs');
		var _this = this;
		
		_this.stopListening(_this.model, 'sync');
		
		_this.model = new m_Log_Actions();
		_this.listenTo(_this.model, 'sync', _this.modelSync_clear_logs);
		_this.model.set({
			"log_actions_command": "clear_logs"
		});
		
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
		model_change_status = 1;

		_this.model.savePOST(false);

	},

	_close: function() {
		//console.log("_close");
		var _this = this;
	},
	render: function() {
		//console.log('render');
	}
});



var LOGS_CAPTURE_PACKETS = Backbone.View.extend({
	name: "LOGS_CAPTURE_PACKETS",
	template: ''

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="LOGS_1"></div>'  //Capture Packets
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="LOGS_6" value="START PACKET TRACING">'
	+'</div>'
	+'</div>',
	model: null,
	model_listeningSync: null,
	v_view1: null,
	v_view2: null,
	owner_name: null,
	interval_timelyQueryCapturingResult: null,
	modelCapturingResult: null,
	set1:{
	  arr: [
		{ str: 'Select Interface', lang: 'LOGS_2', dropdown: true,
				visible: false,
				options: [{
					str: 'LAN',
					lang: 'LOGS_3',
					data: 'eth0'
				},{
					str: 'WAN',
					lang: 'LOGS_23',
					data: 'wan'
				},{
					str: 'ANY',
					lang: 'LOGS_24',
					data: 'any'
				}
	  			],
				data: ''
		}
	  ]
	},
	apply1: {
		0: 'capture_packets_interface'
	},
	set2:{
	  arr: [
			{ str: 'Captured File Size', lang: 'LOGS_4', dropdown: true,
				visible: false,
				options: [{
					str: '1 MB',
					lang: 'LOGS_26',
					data: '1'
				},{
					str: '2 MB',
					lang: 'LOGS_5',
					data: '2'
				},{
					str: '5 MB',
					lang: 'LOGS_27',
					data: '5'
				},{
					str: '10 MB',
					lang: 'LOGS_28',
					data: '10'
				},{
					str: '20 MB',
					lang: 'LOGS_29',
					data: '20'
				}
				],
				data: ''
			},{
				str: 'capture_packets_start_tracking',
				lang: '',
				input: true,
				hidden: true,
				data: ''
			}
	  ]
	},
	apply2: {
		0: 'capture_packets_filesize',
		1: 'capture_packets_tracking_command'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_Logs_Capture_Packets();
		_this.modelCapturingResult = new m_Logs_Capture_Result();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.modelCapturingResult, 'change', _this.modelCapturingResultChange);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function(model, resp, options) {
		 //console.log('modelSync');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelListeningSync: function(model, resp, options) {
		var _this = this;
		 //console.log('modelListeningSync, command: ['+_this.model_listeningSync.get('capture_packets_tracking_command')+'], response: ['+_this.model_listeningSync._response+']');
		 
		var _response = _this.model_listeningSync._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
				  if(_response == '1' && model_change_status == "1" ){
					  
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
					switch(_this.model_listeningSync.get('capture_packets_tracking_command')){
					  case "START": 
						// show stop btn
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 'stop',
							title: getHTMLString('LOGS_1'),
							info: getHTMLString('LOGS_7'),
							warn: '',
							btn: getHTMLString('LOGS_8') ///Stop
						});		
						_this.set_timelyQueryCapturingResult(true);
						break;
						
					  case "DOWNLOAD":
					  case "DOWNLOAD_SO_FAR":
						window.parent.location = 'pcap_log.tgz';
						break;

					  case "STOP": 
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 'download_so_far',
							title: getHTMLString('LOGS_1'),
							info: getHTMLString('LOGS_11'), // download so far
							warn: '',
							btn: getHTMLString('LOGS_10') ///DOWNLOAD 
						});		
						break;
						
					  default:
					}
				  }
				}
			}, 3000);
		}
	},
	modelCapturingResultChange: function() {
		//console.log('modelCapturingResultChange');		 
		var _this = this;
		if (_this.modelCapturingResult.get('capture_result') == 'DONE'){
			_this.set_timelyQueryCapturingResult(false);
			_this.showPopup_download();
		}else{
		}

	},
	set_timelyQueryCapturingResult: function(bInvoke){
		var _this = this;
		if (bInvoke){
			if (_this.interval_timelyQueryCapturingResult) clearInterval(_this.interval_timelyQueryCapturingResult);
			_this.interval_timelyQueryCapturingResult = setInterval(function(){
				_this.modelCapturingResult.fetchOLDJSON();
			}, 1000);
		}else{
			if (_this.interval_timelyQueryCapturingResult){
				clearInterval(_this.interval_timelyQueryCapturingResult);
				_this.interval_timelyQueryCapturingResult = null;
			}
		}
	},
	showPopup_download: function(){
		app._popupViewing(POPUP_CONFIRM_TEMPLATE);
		app.popup_view.model.set({
			id: 'download',
			title: getHTMLString('LOGS_1'),
			info: getHTMLString('LOGS_9'), // download
			warn: '',
			btn: getHTMLString('LOGS_10') ///DOWNLOAD
		});
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;

		var res = _this._sChangeViews(_this.model, 
			[
				_this.set1, _this.set2
			], [	
					_this.v_view1, _this.v_view2
			], [
					_this.apply1, _this.apply2
			]);

		//console.log('modelChange - e');
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	sendViewDataThruEventListeningModel: function(command){
		var _this = this;	

		_this.v_view2.model.attributes.arr[1].data = command;
		
		var res = _this._sSaveModel(false, _this.model_listeningSync, 
				[_this.v_view1, _this.v_view2], 
				[_this.apply1, _this.apply2]);		
		
	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;		

		_this.stopListening(_this.model_listeningSync, 'sync');
		
		var modelSent = new m_Logs_Capture_Packets();
		_this.model_listeningSync = modelSent;
		_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);

		_this.sendViewDataThruEventListeningModel('START');

		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

		model_change_status = 1;

	},
	_popup_apply: function(data){
		//console.log('_popup_apply: '+data.id);
		var _this = this;
		if(data.id === 1000){
			app._popupViewingClose();
			
		}else if(data.id === 'stop'){
				
			_this.set_timelyQueryCapturingResult(false);
			_this.sendViewDataThruEventListeningModel('STOP');
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
			
		}else if(data.id === 'download'){
			
			_this.sendViewDataThruEventListeningModel('DOWNLOAD');
			
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;

		}else if(data.id === 'download_so_far'){
			
			_this.sendViewDataThruEventListeningModel('DOWNLOAD_SO_FAR');
				
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		} 
	},
	_popup_close: function(data){
		//console.log('_popup_close: '+data.id);
		app._popupViewingClose();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var PAGE_HELP_LOGS_V2DOT6 = Backbone.View.extend({
	name: "PAGE_HELP_LOGS_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="SOC_LOGS">SOC Logs</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide v1"></div>'
	+'</div>'
	
	+'<div class="jioMobileSection" id="dev_soc_log">'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="SOC_DEVICE_LOGS">Device Logs</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide v2"></div>'
	+'</div>'

	+'<div class="jioMobileSection" id="hwa_soc_log">'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="SOC_HW_ACCELERATOR_LOGS">Hardware Accelerator Logs</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide v3"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	events: {
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);

		_this.socLogStatus = null;
		_this.socLogType = null;				 
		_this.render();
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view3._popup_apply){
			_this.v_view3._popup_apply(data);
		}
	},
	_popup_close: function(data){
		//console.log('_popup_close');
		//console.log(data);
		var _this = this;
		if(_this.v_view3._popup_close){
			_this.v_view3._popup_close(data);
		}else{
			app._popupViewingClose();
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhide_LogActions'){
				$('.v2_showArea', _this.$el).show();
			}
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new SOC_LOGS({ el: Backbone.$('.v1', _this.$el), owner_name: _this.name  });
		_this.v_view2 = new SOC_DEVICE_LOGS({ el: Backbone.$('.v2', _this.$el), owner_name: _this.name  });	
		_this.v_view3 = new SOC_HW_ACCELERATOR_LOGS({ el: Backbone.$('.v3', _this.$el), owner_name: _this.name  });	
		// listen to view1 value update, then update the values to view3
		_this.listenTo(_this.v_view1, 'updateValues', _this.handleToView3ValueUpdate);		
	},
	handleToView3ValueUpdate: function(values) {
		var _this = this;
		_this.socLogStatus = values.socLogStatus;
		_this.socLogType = values.socLogType;
		if (_this.v_view3) {
			_this.v_view3.updateView3Values(values);
		}
	}
});

var SOC_LOGS = Backbone.View.extend({name: "SOC_LOGS",
	name: "SOC_LOGS",
	template: ""
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="SOC_LOGS"></div>'  //Logs
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	owner_name: null,
	model_change_status: 0,
	curr_log_status: null,
	curr_log_type: null,
	set1:{
	  arr: [
		{ str: 'Log Status', lang: 'SOC_LOGS_STATUS', checked: true,	 data: ''}
	  ]
	},
	apply1: {
		0: 'soc_log_status'
	},
	set2:{
	  arr: [
		{ str: 'Log Type', lang: 'SOC_LOGS_TYPE', dropdown: true,
				visible: false,
				options: [{
					str: 'Device Logs',
					lang: 'SOC_DEVICE_LOGS',
					data: 'Device Logs',
				},{
					str: 'Hardware Accelerator Logs',
					lang: 'SOC_HW_ACCELERATOR_LOGS',
					data: 'Hardware Accelerator Logs',
				}],
				data: ''}
	  ]
	},
	apply2: {
		0: 'soc_log_type'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	set3:{
	  arr: [
		{ str: 'Log Setting', lang: '', checked: true,	 data: ''}
	  ]
	},
	apply3: {
		0: 'soc_log_setting'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_SOC_Logs();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_view_ModelChange);
		_this.listenTo(_this.v_view2.model, 'change', _this.v_view_ModelChange);
		_this.listenTo(_this.v_view3.model, 'change', _this.v_view_ModelChange);
		_this.model.fetchOLDJSON();
		_this.model_change_status = 0;
		_this.curr_log_status = null;
		_this.curr_log_type = null;

	},
	modelSync: function(model, resp, options) {
		//console.log('modelSync');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }

		var v_1 = _this.v_view1;
		var v_2 = _this.v_view2;
				
		var v_attr1 = _.clone(v_1.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		var v_attr2 = _.clone(v_2.model.attributes);
		var i_apply2 = _.invert(_this.apply2);		

		if (v_attr1.arr.length > 0){
			_this.curr_log_status = v_attr1.arr[i_apply1.soc_log_status].data
		}
		if (v_attr2.arr.length > 0){
			_this.curr_log_type = v_attr2.arr[i_apply2.soc_log_type].data
		}
		_this.updateValues({
			socLogStatus: _this.curr_log_status,
			socLogType: _this.curr_log_type 
		});
		// console.log("model_change_status:"+model_change_status);
		if(_this.model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;

		var res = _this._sChangeViews(_this.model, 
			[
				_this.set1, _this.set2, _this.set3
			], [	
					_this.v_view1, _this.v_view2, _this.v_view3
			], [
					_this.apply1, _this.apply2, _this.apply3
			]);

		//console.log('modelChange - e');
	},


	v_view_ModelChange: function() {	
		//console.log('v_view1_ModelChange');
		var _this = this;
		
		var v_1 = _this.v_view1;
		var v_2 = _this.v_view2;
				
		var v_attr1 = _.clone(v_1.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		var v_attr2 = _.clone(v_2.model.attributes);
		var i_apply2 = _.invert(_this.apply2);		
		if (v_attr1.arr.length > 0){
		
		  var changed = false;
		  if(v_attr1.arr[i_apply1.soc_log_status].data === '0'){
  
			document.getElementById('dev_soc_log').style.display = 'none';
			document.getElementById('hwa_soc_log').style.display = 'none';
			_.map(v_attr2.arr, function(v, k){
				if(!v.disabled){
					v.disabled = true;
					changed = true;
				}
			});
		  }else{
			_.map(v_attr2.arr, function(v, k){
				if(v.disabled){
					v.disabled = false;
					changed = true;
				}
				document.getElementById('dev_soc_log').style.display = 'block';
				if (v.data != 'Hardware Accelerator Logs'){
					document.getElementById('hwa_soc_log').style.display = 'none';
				}
				else{
					document.getElementById('hwa_soc_log').style.display = 'block';
				}
			});
		}
		if(changed){
			v_2.model.set(v_attr2);
			v_2.model.trigger('change');
			//_this.model_change_status = 1;
		}
	}
	if (app.router_view.crossViewFn){
		app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhide_LogActions', data: v_attr1.arr[i_apply1.soc_log_status].data});
	}
		
	  
	},
	updateValues: function(values) {
		var _this = this;
		_this.trigger('updateValues', values);
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		//  status=1+type=0 -> noReboot=1, reboot=0  -> 10b=2
		//  status=1+type=1 -> noReboot=0, reboot=1  -> 01b=1
		//  status=0 -> reboot=0, noReboot=0  -> 00b=0
		//  if reboot enabled, set noreboot to 0 or 1 is no difference, = 2
		var soc_status = _this.v_view1.model.attributes.arr[_.invert(_this.apply1).soc_log_status].data;
		var soc_type = _this.v_view2.model.attributes.arr[_.invert(_this.apply2).soc_log_type].data;
		if((soc_status == '1') && (soc_type == 'Hardware Accelerator Logs')){
			_this.v_view3.model.attributes.arr[_.invert(_this.apply3).soc_log_setting].data = '1';
		}
		else if((soc_status == '1') && (soc_type != 'Hardware Accelerator Logs')){
			_this.v_view3.model.attributes.arr[_.invert(_this.apply3).soc_log_setting].data = '2';
		}
		else{
			_this.v_view3.model.attributes.arr[_.invert(_this.apply3).soc_log_setting].data = '0';
		}

		if((_this.curr_log_status!==soc_status ||
			(_this.curr_log_type!==soc_type && _this.curr_log_status!== '0')) &&
			_this.model.attributes !== _this.model._previousAttributes){
			if((soc_type === 'Hardware Accelerator Logs' && soc_status!== '0') || 
				_this.curr_log_type === 'Hardware Accelerator Logs'){
				var hal_str = 'PAGE_SOC_LOGS_DROP_2'
				if(_this.curr_log_type === 'Hardware Accelerator Logs'){
					hal_str = 'PAGE_SOC_LOGS_DROP_4'
				}
				app.router_view = _this;
				app._popupViewing(POPUP_CONFIRM_TEMPLATE);
				app.popup_view.model.set({
					id: 1000,
					warn_title: getHTMLString('PAGE_SOC_LOGS_DROP_1'),
					info: getHTMLString(hal_str) + '<br/>' + getHTMLString('PAGE_SOC_LOGS_DROP_3'),
					warn: getHTMLString('POPUP_REBOOT_CONFIRMATION_WARN'),
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});//yoda_shen modify condition: soc_type == 'Hardware Accelerator Logs' (POPUP)
			}else {
				_this._sSaveModel(false, _this.model, 
					[_this.v_view1, _this.v_view2, _this.v_view3], 
					[_this.apply1, _this.apply2, _this.apply3]);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
				_this.model_change_status = 1;
				// _this.model.fetchOLDJSON();
			}//yoda_shen add saving settings when soc_type == 'Device Logs' (no POPUP)
		}
	},
	_popup_apply: function(data){
		var _this = this;
		
		if (data.id === 1000) {
			app._popupViewingClose();
			var res = _this._sSaveModel(false, _this.model, 
			[_this.v_view1, _this.v_view2, _this.v_view3], 
			[_this.apply1, _this.apply2, _this.apply3]);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_REBOOTING') });
			setTimeout(() => {
				app._sysLogout()
			}, 80000);
		}
	},
	_popup_close: function(data){
		var _this = this;
	    app._popupViewingClose();
	    //_this.model.fetchOLDJSON();
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});

var SOC_DEVICE_LOGS = Backbone.View.extend({
	name: "SOC_DEVICE_LOGS",
	template: ''

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="SOC_DEVICE_LOGS"></div>'  
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1"></div>'
	+'</div>'
	+'<div class="jio1SectionWithInput" style="display: none;">'
	+' <div class="jioInputButton">'
	+'  <div class="jioLabelErrorContainer">'
	+'    <label class="jioLabel" langid="LOGS_12">To Clear All Existing Logs</label>'
	+'    <label class="JioErrorLabel" langid=""></label>'
	+'  </div>'
	+'  <div>'
	+'    <input type="button" class="btn_clear_logs" langid="LOGS_13" value="CLEAR LOGS">'
	+'  </div>'
	+' </div>'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput">'
	+' <div class="jioInputButton">'
	+'  <div class="jioLabelErrorContainer">'
	+'    <label class="jioLabel" langid="LOGS_14">To Download Logs</label>'
	+'    <label class="JioErrorLabel" langid=""></label>'
	+'  </div>'
	+'  <div>'
	+'    <input type="button" class="btn_download_logs" langid="LOGS_15" value="DOWNLOAD LOGS">'
	+'  </div>'
	+' </div>'
	+'</div>'
	+'</div>'
	+'<div class="jio1SectionWithInput">'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>'
	+'</div>',

	model: null,
	model1: null,
	model_change_status: 0,
	model1_change_status: 0,
	v_view1: null,
	apply1: {
                0: 'soc_device_logs_size',
                1: 'soc_device_logs_interface',
		2: 'soc_device_logs_periodic_status',
                3: 'soc_device_logs_periodic',
                4: 'soc_device_logs_repeat_interval',
                5: 'soc_device_logs_repeat_count'
        },
	owner_name: null,
	events: {
		'click .btn_download_logs': 'btn_download_logs',
		'click .btn_clear_logs': 'btn_clear_logs',
		'click .btn_save': 'btn_save'
		
	},
	preinitialize: function (o) {
		var _this = this;		
		_this.owner_name = o.owner_name;
		_this.model = new m_SOC_Device_Logs();
	},
	initialize: function () {
		var _this = this;

		_this.$el.on('_jioOnOffLabel', _this._JioInput_Edit);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Edit);
		_this.$el.on('_dropdownlia', _this._JioInput_Edit);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
                _this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });                                
                _this.listenTo(_this.v_view1.model, 'change', _this.v_view_ModelChange);
                _this.model.fetchOLDJSON();
		_this.model_change_status = 0;
		_this.model1_change_status = 0;

	},
	modelSync_download_logs: function(model1, resp, options) {
		 //console.log('modelSync_download_logs');
		 
		var _this = this;
		var _response = _this.model1._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(_this.model1_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.model1_change_status = 0;
					
					window.parent.location = 'qca_log.zip';				
					
				}
			}, 3000);
		}
	},
	modelSync_clear_logs: function(model1, resp, options) {
		 //console.log('modelSync_clear_logs');
		 
		var _this = this;
		var _response = _this.model1._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(_this.model1_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.model1_change_status = 0;
					
				}
			}, 3000);
		}
	},
	btn_download_logs: function() {
		//console.log('btn_download_logs');
		var _this = this;
		
		_this.stopListening(_this.model1, 'sync');
		
		_this.model1 = new m_SOC_Device_Actions();
		_this.listenTo(_this.model1, 'sync', _this.modelSync_download_logs);
		_this.model1.set({
			"soc_device_log_actions": "download_logs"
		});
		
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('LOGS_25') }); // Please wait...
		_this.model1_change_status = 1;

		_this.model1.savePOST(false);
	},
	btn_clear_logs: function() {
		//console.log('btn_clear_logs');
		var _this = this;
		
		_this.stopListening(_this.model1, 'sync');
		
		_this.model1 = new m_SOC_Device_Actions();
		_this.listenTo(_this.model1, 'sync', _this.modelSync_clear_logs);
		_this.model1.set({
			"soc_device_log_actions": "clear_logs"
		});
		
		app._popupViewing(POPUP_LOADING);
		app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
		_this.model1_change_status = 1;

		_this.model1.savePOST(false);

	},
	modelSync: function() {
		//console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;

		if(_this.model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
						app._popupViewingClose();
						clearInterval(_this.interval);
						clearInterval(timeout_id);
						// _this.model.fetchOLDJSON();
						_this.model_change_status = 0;
					
				}
			}, 2000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'soc_device_logs_size',
				lang: 'SOC_DEVICE_LOGS_SIZE',
				input: true,
				inputstr: '(2 - 50)',
				data: ''
			},{
				str: 'soc_device_logs_interface',
				lang: 'SOC_DEVICE_LOGS_INTERFACE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'All',
					lang: '',
					data: 'All'
				},{
					str: 'eth0',
					lang: '',
					data: 'eth0'
				},{
					str: 'bridge0',
					lang: '',
					data: 'bridge0'
				},{
					str: 'rmnet_data0',
					lang: '',
					data: 'rmnet_data0'
				},{
					str: 'gretap2',
					lang: '',
					data: 'gretap2'
				}],
				data: ''
			},{
				str: 'soc_device_logs_periodic_status',
				lang: 'SOC_DEVICE_LOGS_PERIODIC_STATUS',
				checked: true,
				data: ''
			},{
				str: 'soc_device_logs_periodic',
				lang: 'SOC_DEVICE_LOGS_PERIODIC_INTERVAL',
				input: true,
				inputstr: '(30 - 86400)',
				data: ''
			},{
				str: 'soc_device_logs_repeat_interval',
				lang: 'SOC_DEVICE_LOGS_REPEAT_INTERVAL',
				input: true,
				inputstr: '(0 - 86400)',
				data: ''
			},{
				str: 'soc_device_logs_repeat_count',
				lang: 'SOC_DEVICE_LOGS_REPEAT_COUNT',
				input: true,
				inputstr: '(1 - 10)',
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view1], [_this.apply1]);
	},
	_JioInput_Edit: function(e, v) {
		//console.log('_JioInput_Edit');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},

	v_view_ModelChange: function() {	
		//console.log('v_view1_ModelChange');
		var _this = this;	
		var v_1 = _this.v_view1;
				
		var v_attr1 = _.clone(v_1.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		if (v_attr1.arr.length > 0){
		
		  var changed = false;
		  if(v_attr1.arr[i_apply1.soc_device_logs_periodic_status].data === '0'){
			_.map(v_attr1.arr, function(v, k){
				if(Number(i_apply1.soc_device_logs_periodic) === Number(k) && !v.disabled){
					v.disabled = true;
					changed = true;
				}
			});
		  }else{
			_.map(v_attr1.arr, function(v, k){
				if(Number(i_apply1.soc_device_logs_periodic) === Number(k) && v.disabled){
					v.disabled = false;
					changed = true;
				}
			});
		}
		if(changed){
			v_1.model.set(v_attr1);
			v_1.model.trigger('change');
			//_this.model_change_status = 1;
		}
	}	  
	},

	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
		var res = _this._sSaveModel(false, _this.model, [_this.v_view1], [_this.apply1]);
		if(!_.isEmpty(_this.model.changed)){
			if(_this.model.attributes !== _this.model._previousAttributes){
				// console.log('OK');
				_this.model_change_status = 1;
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') });
			}
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(data.id === 1000){
			app._popupViewingClose();
			// _this.model.fetchOLDJSON();
			_this.model.trigger('change');
		}
	},

	_close: function() {
		//console.log("_close");
		var _this = this;
	},
	render: function() {
		//console.log('render');
	}
});



var SOC_HW_ACCELERATOR_LOGS = Backbone.View.extend({
	name: "SOC_HW_ACCELERATOR_LOGS",
	template: ''

	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="SOC_HW_ACCELERATOR_LOGS"></div>'  
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1"></div>'
	+'</div>'
	+'<div class="jio1SectionWithInput">'
	+' <div class="jioInputButton">'
	+'  <div class="jioLabelErrorContainer">'
	+'    <label class="jioLabel" langid="LOGS_14">To Download Logs</label>'
	+'    <label class="JioErrorLabel" langid=""></label>'
	+'  </div>'
	+'  <div>'
	+'    <input type="button" class="btn_download_logs" langid="LOGS_15" value="DOWNLOAD LOGS">'
	+'  </div>'
	+' </div>'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput">'
	+' <div class="jioInputButton">'
	+'  <div class="jioLabelErrorContainer">'
	+'    <label class="jioLabel" langid="LOGS_12">To Clear All Existing Logs</label>'
	+'    <label class="JioErrorLabel" langid=""></label>'
	+'  </div>'
	+'  <div>'
	+'    <input type="button" class="btn_clear_logs" langid="LOGS_13" value="CLEAR LOGS">'
	+'  </div>'
	+' </div>'
	+'</div>'
	+'</div>'
	+'<div class="jio1SectionWithInput">'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',

	model: null,
	model1: null,
	model_listeningSync: null,
	v_view1: null,
	owner_name: null,
	interval_timelyQueryCapturingResult: null,
	model_change_status: 0,
	model1_change_status: 0,
	set1:{
	  arr: [
                {
				str: 'soc_hw_accelerator_logs_size',
				lang: 'SOC_HW_ACCELERATOR_LOGS_SIZE',
				input: true,
				inputstr: '(2 - 50)',
				data: ''
		}
	  ]
	},
	apply1: {
		0: 'soc_hw_accelerator_logs_size'
	},
	events: {
		'click .btn_download_logs': 'btn_download_logs',
		'click .btn_clear_logs': 'btn_clear_logs',
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_SOC_HWA_Logs();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.model.fetchOLDJSON();
		_this.model_change_status = 0;
		_this.model1_change_status = 0;
		_this.curr_logsize = null;

	},
	handleParentUpdateValues: function(values) {
		var _this = this;
		_this.socLogStatus = values.socLogStatus;
		_this.socLogType = values.socLogType;
	},
	updateView3Values: function(values) {
		var _this = this;
		_this.handleParentUpdateValues(values);
	},
	modelSync_download_logs: function(model1, resp, options) {
		//console.log('modelSync_download_logs');
		
	   var _this = this;
	   var _response = _this.model1._response || null;
	   // if(_response){
		   // console.log(_response);
	   // }
	   // console.log("model_change_status:"+model_change_status);
	   if(_this.model1_change_status == 1){
		   _this.interval = setInterval(function(){
			   if(_response){
				   app._popupViewingClose();
				   clearInterval(_this.interval);
				   _this.model1_change_status = 0;
				   
				   window.parent.location = 'ipacm_log.tar.bz2';				
				   
			   }
		   }, 3000);
	   }
   },
   modelSync_clear_logs: function(model1, resp, options) {
		//console.log('modelSync_clear_logs');
		
	   var _this = this;
	   var _response = _this.model1._response || null;
	   // if(_response){
		   // console.log(_response);
	   // }
	   // console.log("model_change_status:"+model_change_status);
	   if(_this.model1_change_status == 1){
		   _this.interval = setInterval(function(){
			   if(_response){
				   app._popupViewingClose();
				   clearInterval(_this.interval);
				   _this.model.fetchOLDJSON();
				   _this.model1_change_status = 0;
				   
			   }
		   }, 3000);
	   }
   },
   btn_download_logs: function() {
	   //console.log('btn_download_logs');
	   var _this = this;
	   
	   _this.stopListening(_this.model1, 'sync');
	   
	   _this.model1 = new m_SOC_HWA_Actions();
	   _this.listenTo(_this.model1, 'sync', _this.modelSync_download_logs);
	   _this.model1.set({
		   "soc_hwa_log_actions": "download_logs"
	   });
	   
	   app._popupViewing(POPUP_LOADING);
	   app.popup_view.model.set({ str: getHTMLString('LOGS_25') }); // Please wait...
	   _this.model1_change_status = 1;

	   _this.model1.savePOST(false);
   },
   btn_clear_logs: function() {
	   //console.log('btn_clear_logs');
	   var _this = this;
	   
	   _this.stopListening(_this.model1, 'sync');
	   
	   _this.model1 = new m_SOC_HWA_Actions();
	   _this.listenTo(_this.model1, 'sync', _this.modelSync_clear_logs);
	   _this.model1.set({
		   "soc_hwa_log_actions": "clear_logs"
	   });
	   
	   app._popupViewing(POPUP_LOADING);
	   app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
	   _this.model1_change_status = 1;

	   _this.model1.savePOST(false);

   },
	modelSync: function(model, resp, options) {
		 //console.log('modelSync');
		 
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);

		var v_1 = _this.v_view1;
		var i_apply1 = _.invert(_this.apply1);
		var v_attr1 = _.clone(v_1.model.attributes);
		if (v_attr1.arr.length > 0){
			_this.curr_logsize = v_attr1.arr[i_apply1.soc_hw_accelerator_logs_size].data
		}

		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;

		var res = _this._sChangeViews(_this.model, [_this.set1], [_this.v_view1], [_this.apply1]);

		//console.log('modelChange - e');
	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		//console.log('btn_save');
		var _this = this;
                var v_1 = _this.v_view1;
                var i_apply1 = _.invert(_this.apply1);
                var v_attr1 = _.clone(v_1.model.attributes);

		if(_this.curr_logsize !== v_attr1.arr[i_apply1.soc_hw_accelerator_logs_size].data){
			if(_this.socLogStatus == '1' && _this.socLogType  == 'Hardware Accelerator Logs'){
				var hal_str = 'PAGE_SOC_LOGS_DROP_5'
				if(_this.curr_log_type === 'Hardware Accelerator Logs'){
					hal_str = 'PAGE_SOC_LOGS_DROP_5'
				}
				app.router_view = _this;
				app._popupViewing(POPUP_CONFIRM_TEMPLATE);
				app.popup_view.model.set({
					id: 1000,
					warn_title: getHTMLString('PAGE_SOC_LOGS_DROP_1'),
					info: getHTMLString(hal_str) + '<br/>' + getHTMLString('PAGE_SOC_LOGS_DROP_3'),
					warn: getHTMLString('POPUP_REBOOT_CONFIRMATION_WARN'),
					btn: getHTMLString('MAIN_BTN_OK') //OK
				});
			}else {
				var res = _this._sSaveModel(false, _this.model, [_this.v_view1], [_this.apply1]);
				// console.log('OK');
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS_MANAIP') });
				model_change_status = 1;
			}
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		/*if(data.id === 1000){
			app._popupViewingClose();
			_this.model.fetchOLDJSON();
			_this.model.trigger('change');
		}*/
                if (data.id === 1000) {
                        app._popupViewingClose();
			var res = _this._sSaveModel(false, _this.model, [_this.v_view1], [_this.apply1]);
                        app._popupViewing(POPUP_LOADING);
                        app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_REBOOTING') });
                        setTimeout(() => {
                                app._sysLogout()
                        }, 80000);
                }
	},

	_close: function() {
		//console.log("_close");
		var _this = this;
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_EOGRE_V2 = Backbone.View.extend({
	name: "PAGE_SETTINGS_EOGRE_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="EOGRE_RULES_LIST">EoGRE Rules List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide list1"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log(this.name, '_list_event', data);
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		//console.log(data);
		var _this = this;
		
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhide_lists'){
				if(d.data === '1')
				{
					$(_this.v_view2.el).show();	 
				}else {
					$(_this.v_view2.el).hide(); 
				}
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view2 = new EOGRE_RULES_LIST_V2({ el: Backbone.$('.list1', _this.$el) , owner_name: _this.name});
	}
});


var PAGE_SETTINGS_EOGRE = Backbone.View.extend({
	name: "PAGE_SETTINGS_EOGRE_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_EOGRE_TITLE">EoGRE Settings</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide settings1">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="EOGRE_RULES_LIST">EoGRE Rules List</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide list1"></div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext"><span langid="EOGRE_IPSEC_RULES_LIST">IPSec Rules List</span> <span class="jioH2_sub" langid="EOGRE_18"></span></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide list2"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	v_view3: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log(this.name, '_list_event', data);
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
		if(_this.v_view3._list_event){
			_this.v_view3._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		//console.log(data);
		var _this = this;
		
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhide_lists'){
				if(d.data === '1')
				{
					$(_this.v_view2.el).show();	 
					$(_this.v_view3.el).show();	
				}else {
					$(_this.v_view2.el).hide(); 
					$(_this.v_view3.el).hide(); 
				}
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new EOGRE_STATUS({ el: Backbone.$('.settings1', _this.$el), owner_name: _this.name });	
		_this.v_view2 = new EOGRE_RULES_LIST({ el: Backbone.$('.list1', _this.$el) , owner_name: _this.name});
		_this.v_view3 = new EOGRE_IPSEC_RULES_LIST({ el: Backbone.$('.list2', _this.$el), owner_name: _this.name });
	}
});


var EOGRE_IPSEC_RULES_LIST = Backbone.View.extend({
	name: "EOGRE_IPSEC_RULES_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<% if(hasMaxLimit){ %>'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<% } else { %>'
	+'<div class="jioTableHeading">'
	+'<% } %>'
	+'<div class="jioH2"><span><span langid="EOGRE_IPSEC_RULES_LIST"></span> <span class="jioH2_sub" langid="EOGRE_18"></span></span></div>'
	+'<% if(hasMaxLimit){ %>'
	+'<div class="v_MaxLimit"></div>'
	+'<% } %>'
	//+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	//+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1"></table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	randerParam: {
		hasMaxLimit: false
	},
	islog: false,
	eventId: 0,
	owner_name: null,
	events: {
		//'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_EOGRE_IPSEC_RULES_LIST();
		if (_this.randerParam.hasMaxLimit){
				_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
			}
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template(_this.randerParam));
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		if (_this.randerParam.hasMaxLimit){
		  _this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		  });
		}
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		var head = [{
			sort: true,
			lang: "EOGRE_13",
			str: "Connection Name"
		},{
			sort: true,
			lang: "EOGRE_14",
			str: "Encapsulation Mode"
		},{
			sort: true,
			lang: "EOGRE_15",
			str: "Local Endpoint IP"
		},{
			sort: true,
			lang: "EOGRE_16",
			str: "Remote Endpoint IP"
		},{
			sort: true,
			lang: "EOGRE_17",
			str: "Encryption Algorithm"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];

		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);

			lists.push([
				{
					str: val.connection_name
				},{
					str: val.encapsulation_mode
				},{
					str: val.local_endpoint_ip
				},{
					str: val.remote_endpoint_ip
				},{
					enable: true,
					str: val.encryption_algorithm
				},{
					id: key,
					ex_data: _this.name,
					btn: [{
						type: 'more'
					}]
				}
			]);
		});
		_this.collection_len = c_lists.length;
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if (_this.randerParam.hasMaxLimit){
		  if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		  }else{
			_this.modelMaxLimit.setError(false);
		  }
		}
	},
	_list_event: function(v) {
		var _this = this;
		if(v.ex_data != _this.name) return;
		//console.log(this.name, '_list_event');

		_this.eventId = v.id;
		// console.log(v.id);

		var model = _this.collection.at(v.id);
		if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_IPSEC_RULE();
			app.popup_view.model.set({
				id: this.name+'more',
				title: getHTMLString('EOGRE_IPSEC_RULES_LIST') 
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Connection Name',
					lang: 'EOGRE_13',
					text: ''
				},{
					str: 'Encapsulation Mode',
					lang: 'EOGRE_14',
					text: ''
				},{
					str: 'Local Endpoint IP',
					lang: 'EOGRE_15',
					text: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_16',
					text: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'EOGRE_17',
					iconStatus: true,
					data: ''
				}]
			};

			app.popup_view.apply1 = {
				0: 'connection_name',
				1: 'encapsulation_mode',
				2: 'local_endpoint_ip',
				3: 'remote_endpoint_ip',
				4: 'encryption_algorithm'
			};
			var attr = _.clone(model.attributes);
			obj_remove_num_comma_in_attr_values(attr);
			attr.status = attr.status == 1 ? getHTMLString('LAN_IPV6_5') : getHTMLString('LAN_IPV6_6')
			app.popup_view.modelInput.set(attr);
		}
	},

	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		var _this = this;
		if(data.id === 1000){
			app._popupViewingClose();
		}else if(data.id === this.name+'more'){ //more
			app._popupViewingClose();

		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
});


var EOGRE_RULES_LIST = Backbone.View.extend({
	name: "EOGRE_RULES_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimitAndButtonLong1">'
	+'<div class="jioH2" langid="EOGRE_RULES_LIST">EoGRE Rules List</div>'
	+'<button id="createOverIPSec" class="jioIconButtonSet" disabled="disabled">'
	+'      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'
	+'        <rect class="jioColorFillNone" width="24" height="24"></rect>'
	+'        <path class="jioColorFillWhite" d="M6.984,19.594,2.591,15.375A8.364,8.364,0,0,1,0,9.34V3.717A3.764,3.764,0,0,0,3.81,0h8.381A3.764,3.764,0,0,0,16,3.717V9.34a8.364,8.364,0,0,1-2.591,6.035L9.015,19.594a1.474,1.474,0,0,1-2.031,0ZM1.462,4.942v4.4a7,7,0,0,0,2.155,5.018L8,18.569l4.384-4.21A7,7,0,0,0,14.539,9.34v-4.4a5.231,5.231,0,0,1-3.6-3.516H5.065A5.231,5.231,0,0,1,1.462,4.942Zm5.861,9.88L5.229,12.864a.6.6,0,0,1-.226-.4.586.586,0,0,1,.187-.492L7.322,9.974a.681.681,0,0,1,.917,0,.581.581,0,0,1,0,.859l-1.029.962h3.14a.608.608,0,1,1,0,1.213H7.218l1.021.956a.579.579,0,0,1,0,.859.679.679,0,0,1-.917,0Zm.437-6.8a.58.58,0,0,1,0-.858l1.03-.962H5.648a.608.608,0,1,1,0-1.214H8.781L7.76,4.036a.58.58,0,0,1,0-.858.682.682,0,0,1,.918,0l2.088,1.954a.6.6,0,0,1,.227.38s0,.006,0,.009a.586.586,0,0,1-.184.51L8.678,8.025a.68.68,0,0,1-.918,0Z" transform="translate(4 2)"></path>'
	+'      </svg>'
	+'      <div langid="EOGRE_10">Create EoGRE over IPSec</div>'
	+'</button>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	ar_working: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	model_listeningSync: null,
	listenSyncParam: null,
	owner_name: null,
	set_addedit: {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					input: true,
					data: ''
				},{
					str: 'IP Address Type',
					lang: 'EOGRE_2',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					},{
						str: 'IPv6',
						lang: '',
						data: 'IPv6'
					},{
						str: 'IPv4 & IPv6',
						lang: '',
						data: 'IPv4v6'
					}],
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					input: true,
					data: ''
				},{
					str: 'EoGRE over IPSec',
					lang: 'EOGRE_5',
					checked: true,
					data: ''
				}]
	},
	apply_addedit: {
		0: 'tunnel_name',
		1: 'ip_address_type',
		2: 'remote_endpoint_ip',
		3: 'eogre_over_ipsec'
	},
	set_adv: {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					input: true,
					data: ''
				},{
					str: 'IP Address Type',
					lang: 'EOGRE_2',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					},{
						str: 'IPv6',
						lang: '',
						data: 'IPv6'
					},{
						str: 'IPv4 & IPv6',
						lang: '',
						data: 'IPv4v6'
					}],
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					input: true,
					data: ''
				},{
					str: 'GRE Tunnel Key (Optional)',
					lang: 'EOGRE_21',
					disabled: true,
					input: true,
					inputstr: '(0 - 9999999999)',
					data: ''
				},{
					str: 'TTL (Optional)',
					lang: 'EOGRE_22',
					input: true,
					inputstr: '(1 - 255)',
					data: ''
				},{
					str: 'Maximum Ethernet MTU (Optional)',
					lang: 'EOGRE_23',
					input: true,
					inputstr: '(1 - 1500)',
					data: ''
				},{
					str: 'VLAN (Optional)',
					lang: 'EOGRE_24',
					disabled: true,
					input: true,
					inputstr: '(0 - 4093)',
					data: ''
				},{
					str: 'EoGRE over IPSec',
					lang: 'EOGRE_5',
					checked: true,
					data: ''
				}]
	},
	apply_adv: {
		0: 'tunnel_name',
		1: 'ip_address_type',
		2: 'remote_endpoint_ip',
		3: 'gre_tunnel_key',
		4: 'ttl',
		5: 'maximum_ethernet_mtu',
		6: 'vlan',
		7: 'eogre_over_ipsec'
	},	
	set_createOverIPSec: {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					text: ''
				},{
					str: 'IPSec Connection Name',
					lang: 'EOGRE_26',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					},{
						str: 'IPv6',
						lang: '',
						data: 'IPv6'
					},{
						str: 'IPv4 & IPv6',
						lang: '',
						data: 'IPv4v6'
					}],
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					text: ''

				}]
	},
	apply_createOverIPSec: {
		0: 'tunnel_name',
		1: 'ipsec_connection_name',
		2: 'remote_endpoint_ip',

	},
	events: {
		'click .btnAdd': 'btnAdd',
		'click #createOverIPSec': 'oncreateOverIPSec'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_EOGRE_RULE_LIST;
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
		_this.page_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		
		var c_lists = _this.collection.toJSON();
		//console.log(c_lists);
		var value;
		_this.ar_working = [];
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);
			val['check'] = false;
			_this.ar_working.push(val); 
		});

		_this.UpdateListView(_this.ar_working);
		
		_this.collection_len = c_lists.length;
		_this.UpdateMaxLimit();
		
	}, 
	UpdateListView: function(from_lists){

		var _this = this;
		var head = [{
			lang: "",
			str: ""
		},{
			sort: true,
			lang: "EOGRE_1",
			str: "Tunnel Name"
		},{
			sort: true,
			lang: "EOGRE_3",
			str: "Local Endpoint IP"
		},{
			sort: true,
			lang: "EOGRE_4",
			str: "Remote Endpoint IP"
		},{
			sort: true,
			lang: "EOGRE_5",
			str: "EoGRE over IPSec"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		
		var lists = [];
		//console.log(from_lists);
		_.map(from_lists, function (val, key) {

			lists.push([
				{
					id: key,
					ex_data: _this.name,
					checkbox: true,
					stopPropagation: true,
					str: val.check ? '1' : '0'
				},{
					str: val.tunnel_name
				},{
					str: val.local_endpoint_ip
				},{
					str: val.remote_endpoint_ip
				},{
					enable: true,
					str: val.eogre_over_ipsec
				},{
					id: key,
					ex_data: _this.name,
					btn: [{
						type: 'more'
					}, {
						type: val.enable_button == '1' ? 'enable' : 'disable'
					}, {
						type: 'edit'
					}, {
						type: 'settings'
					}, {
						type: 'del'
					}]
				}
			]);
		});

		_this.v_view1.model.set({ head: head, lists: lists });

	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	modelListeningSync: function(model, resp, options) {
		var _this = this;
		 //console.log('modelListeningSync, response: ['+_this.model_listeningSync._response+']');
		 
		var _response = _this.model_listeningSync._response || null;
		// console.log("model_change_status:"+model_change_status);

		  _this.interval = setInterval(function(){
			if(!_response) return;
			
			if(_response == 1){
				if (_this.listenSyncParam.cb_OnSuccess){
				  _this.listenSyncParam.cb_OnSuccess({ _response: _response});
				}else{					  
					app._popupViewingClose();
					clearInterval(_this.interval);
				}
				
			}else{
				  // fail
				if (_this.listenSyncParam.cb_OnFail){
				  _this.listenSyncParam.cb_OnFail({ _response: _response});
				}else{					  
				  if(_response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 3000,
						title: getHTMLString(''),
						info: getHTMLString('INVALID_SETTINGS'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				  }
				}

			}
		  }, (_this.listenSyncParam.intervalWait ? _this.listenSyncParam.intervalWait : 2000));

	},
	setListenSyncModel: function(p){		
		var _this = this;
		
		_this.listenSyncParam = p;
		
		if (_this.model_listeningSync) _this.stopListening(_this.model_listeningSync, 'sync');  // must check model_listeningSync is available, else, it will remove one existing sync link.  in this case, collection sync.
		_this.model_listeningSync = p.model;
		_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
	},
	btnAdd: function() {
		// console.log(_this.name, 'btnAdd');
		
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_RULES'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE();
			app.popup_view.model.set({
				id: 'add',
				title: getHTMLString('EOGRE_12'), //Add New
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_addedit;
			app.popup_view.apply1 = _this.apply_addedit;
		}
	},
	oncreateOverIPSec: function(){
		//console.log(this.name, 'oncreateOverIPSec');
		var _this = this;
			var arSelected = [];			
			_.map(_this.ar_working, function (val, key) {
				if (val.check){
					arSelected.push(val);
				}
			});
			if (arSelected.length != 1) return;
		
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE_CreateOverIPSec();
			app.popup_view.model.set({
				id: 'createOverIPSec',
				title: getHTMLString('EOGRE_25'), //edit
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_createOverIPSec;
			app.popup_view.apply1 = _this.apply_createOverIPSec;
			
			var working = arSelected[0];
			app.popup_view.modelInput.set({	tunnel_name: working.tunnel_name,
											ipsec_connection_name: working.ip_address_type,
											remote_endpoint_ip: working.remote_endpoint_ip});

	},
	_list_event: function(v) {
		var _this = this;
		if(v.ex_data != _this.name) return;
		//console.log(this.name, '_list_event', v.type);

		// console.log(v.id);
		var model_working = _this.collection.at(v.id);
		if (!model_working) return;
		var model_attrs = _.clone(model_working.attributes);
		obj_remove_num_comma_in_attr_values(model_attrs);
		
		_this.eventId = v.id;
		var working = _this.ar_working[v.id];
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			var m_del = new m_EOGRE_RULE_DEL();
			var res = m_del.set({ delete_rule: v.id });
			_this.setListenSyncModel({ 
				model: m_del, 
				cb_OnSuccess: function(p){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model_working){
						model_working.destroyPOST(false);
						_this.collection.trigger('sync');  						
					}
				},
				cb_OnFail: function(p){
					if(p._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				},
				intervalWait: 5000			  
			}); 
			
			m_del.savePOST(false);


		}else if(v.type === 'enable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_EOGRE_RULE_DO();
			var res = _this.model.set({ enable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '0'};
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	

		}else if(v.type === 'disable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_EOGRE_RULE_DO();
			var res = _this.model.set({ disable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '1'};
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	


		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE();
			app.popup_view.model.set({
				id: 'more',
				title: getHTMLString('EOGRE_11') 
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					text: ''
				},{
					str: 'IP Address Type',
					lang: 'EOGRE_2',
					text: ''
				},{
					str: 'Local Endpoint IP',
					lang: 'EOGRE_3',
					text: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					text: ''
				},{
					str: 'GRE Tunnel Key',
					lang: 'EOGRE_6',
					text: ''
				},{
					str: 'TTL',
					lang: 'EOGRE_7',
					text: ''
				},{
					str: 'Maximum Ethernet MTU',
					lang: 'EOGRE_8',
					text: ''
				},{
					str: 'VLAN',
					lang: 'EOGRE_9',
					text: ''
				},{
					str: 'EoGRE over IPSec',
					lang: 'EOGRE_5',
					iconStatus: true,
					data: ''
				}]
			};
			app.popup_view.apply1 = {
				0: 'tunnel_name',
				1: 'ip_address_type',
				2: 'local_endpoint_ip',
				3: 'remote_endpoint_ip',
				4: 'gre_tunnel_key',
				5: 'ttl',
				6: 'maximum_ethernet_mtu',
				7: 'vlan',
				8: 'eogre_over_ipsec'	
			};
			var attr = model_attrs;
			attr.gre_tunnel_key = display_change_empty_string_to_strikethrough(attr.gre_tunnel_key);
			attr.vlan = display_change_empty_string_to_strikethrough(attr.vlan);
			app.popup_view.modelInput.set(attr);

		}else if(v.type === 'edit'){

			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE();
			app.popup_view.model.set({
				id: 'edit',
				title: getHTMLString('EOGRE_19'), //edit
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_addedit;
			app.popup_view.apply1 = _this.apply_addedit;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
			
		}else if(v.type === 'settings'){

			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE();
			app.popup_view.model.set({
				id: 'settings',
				title: getHTMLString('EOGRE_20'), //Advanced Settings
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_adv;
			app.popup_view.apply1 = _this.apply_adv;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
				
		}else if(v.type === 'checkbox'){
			//console.log('checkbox');
				var cur = working;
				cur.check = cur.check ? false : true;
				//cur.select = cur.check;
						
				if (cur.check){					
					_.map(_this.ar_working, function (val, key) {
						if (key == v.id){
						}else{
							val.check = false;
						}
					});
					_this.$('#createOverIPSec').removeAttr('disabled');

				}else{
					
					if (_this.ar_working.find(function(o){ return o.check;}) == undefined){
						// not found 
						_this.$('#createOverIPSec').attr('disabled', 'disabled');

					}else{
						_this.$('#createOverIPSec').removeAttr('disabled');

					}
				}
				_this.UpdateListView(_this.ar_working);	

				
		}
	},
	_popup_apply: function(data){
		//console.log(this.name,  '_popup_apply');
		var _this = this;
		if(data.id === 'add'){ //add
			//console.log(_this.name, "add");
			var model = new m_EOGRE_RULE();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');;
			
			/*
			attr.tunnel_name = (_this.collection_len+1)+','+attr.tunnel_name;
			attr.ip_address_type = (_this.collection_len+1)+','+attr.ip_address_type;
			attr.remote_endpoint_ip = (_this.collection_len+1)+','+attr.remote_endpoint_ip;
			attr.eogre_over_ipsec = (_this.collection_len+1)+','+attr.eogre_over_ipsec;
			attr.gre_tunnel_key = (_this.collection_len+1)+','+attr.gre_tunnel_key;
			attr.ttl = (_this.collection_len+1)+','+attr.ttl;
			attr.maximum_ethernet_mtu = (_this.collection_len+1)+','+attr.maximum_ethernet_mtu;
			attr.vlan = (_this.collection_len+1)+','+attr.vlan;
			*/
			obj_add_num_comma_in_attr_values(attr, (_this.collection_len+1));
			
			var res = model.set(attr);
			// console.log(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			model.savePOST(false);
			_this.interval = setInterval(function(){
				// console.log(res._response);
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else if(res._response == 'para_chk error'){
					// _this.collection.createPOST(false, model);
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_MACFILTER_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);

		}else if((data.id === 'edit') || (data.id === 'settings')){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				var attr = _.omit(popup_attr, 'id');
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				model.savePOST(false);
			}
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);

				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 5000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);
		}else if(data.id === 'createOverIPSec'){ //createOverIPSec
		
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			_this.model = new m_EOGRE_RULE_CreateOverIPSec();
			_this.model.set(popup_attr);			

			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...

			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);
				_this.collection.fetch();
			},
			intervalWait: 5000 });			

			_this.model.savePOST(false);

		}else{
			app._popupViewingClose();
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
});

var EOGRE_STATUS = Backbone.View.extend({
	name: "EOGRE_STATUS",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="EOGRE_STATUS">EoGRE Status</div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>'
	+'</div>'
	,
	model: null,
	v_view2: null,
	owner_name: null,
	apply1: {
		0: 'eogre'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_EOGRE_STATUS();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);	// 10/29 '21
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		 console.log(this.name, 'modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log(this.name, 'modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'EoGRE',
				lang: 'EOGRE_EOGRE',
				checked: true,
				data: ''
			}]
		};

		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view2], [_this.apply1]);
	},
	v_viewModelChange: function() { 
		//console.log(this.name, 'v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view2.model.attributes);

		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhide_lists', data: v_attr.arr[0].data});
		}
	},
	_JioInput_Modify: function(e, v) {
		//console.log('EOGRE_STATUS _JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log(this.name, 'btn_save');
		var _this = this;
		var collection_len = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: "EOGRE_RULES_LIST", from: _this.name, want: 'get_list_length'}) : 0);

		var res = _this._sSaveModel(false, _this.model, [_this.v_view2], [_this.apply1]);
		if(_this.model.attributes.eogre == _this.model._previousAttributes.eogre){

		}else if(_this.model.attributes.eogre=="1" &&
				 collection_len==0){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('POPUP_ADD_RULE'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, "_popup_apply");
		if(data.id === 1000 || data.id === 2000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log(this.name, "_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_ADMIN_IPADDR_FILTER = Backbone.View.extend({
	name: "PAGE_ADMIN_IPADDR_FILTER_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="IPADDR_FILTER_FILTERING"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide view_1">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen" id="ipfilter_list_title">'
	+'<span class="jiotext" langid="IPADDR_FILTER_LIST"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide view_2" id="ipfilter_list"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		//console.log(data);
		var _this = this;
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhideView'){
				if(d.data === '1'){
					//$(_this.v_view2.el).show();	
					document.getElementById('ipfilter_list_title').style.display='';
					document.getElementById('ipfilter_list').style.display='';
				}else {
					//$(_this.v_view2.el).hide();	
					document.getElementById('ipfilter_list_title').style.display='none';
					document.getElementById('ipfilter_list').style.display='none';
				}				
			}else if (d.want == 'get_list_view_name'){
				return _this.v_view2.name;
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new IPADDR_FILTER_SETTINGS({ el: Backbone.$('.view_1', _this.$el), owner_name: _this.name });	
		_this.v_view2 = new IPADDR_FILTER_LIST({ el: Backbone.$('.view_2', _this.$el), owner_name: _this.name });
		$(_this.v_view2.el).hide();
	}
});

var IPADDR_FILTER_LIST = Backbone.View.extend({
	name: "IPADDR_FILTER_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="IPADDR_FILTER_LIST"></div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	owner_name: null,
	apply1: {
		0: 'ipaddress_type',
		1: 'ipaddress'
	},
	events: {
		'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_IPADDR_FILTERS();
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	ipaddress_type_to_LangID: function(ipaddress_type){
		switch(ipaddress_type){
			case "IPv4":
				return "IPADDRESS_TYPE_V4";
			case "IPv6":
				return "IPADDRESS_TYPE_V6";
			default:
				return '';
			
		}
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		var head = [{
			sort: true,
			lang: "IPADDR_FILTER_1",
			str: "SI #"
		},{
			sort: true,
			lang: "IPADDR_FILTER_6",
			str: "IP Address Type"
		},{
			sort: true,
			lang: "IPADDR_FILTER_2",
			str: "IP Address"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		var c_lists = _this.collection.toJSON();
		var value;
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);

			lists.push([
				{
					str: key+1
				},{
					str: getHTMLString(_this.ipaddress_type_to_LangID(val.ipaddress_type))
				},{
					str: val.ipaddress
				},{
					id: key,
					btn: [{
						type: 'del'
					}]
				}
			]);
		});
		_this.collection_len = c_lists.length;
		_this.v_view1.model.set({ head: head, lists: lists });
		_this.UpdateMaxLimit();
	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	btnAdd: function() {
		//console.log(this.name, 'btnAdd');
		
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_RULES'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_IPADDR_FILTER();
			app.popup_view.model.set({
				id: _this.name+'add',
				title: getHTMLString('IPADDR_FILTER_3'), //Add New
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			});
			app.popup_view.set1 = {
				arr: [{
				str: 'IP Address Type',
				lang: 'IPADDR_FILTER_6',
				dropdown: true,
				visible: false,
				options: [{
					str: 'IPv4',
					lang: _this.ipaddress_type_to_LangID('IPv4'),
					data: 'IPv4'
				},{
					str: 'IPv6',
					lang: _this.ipaddress_type_to_LangID('IPv6'),
					data: 'IPv6'
				}],
				data: ''
			},{
					str: 'IP Address',
					lang: 'IPADDR_FILTER_2',
					input: true,
					data: ''
				}]
			};
			app.popup_view.apply1 = _this.apply1;
		}
	},
	_list_event: function(v) {
		 //console.log(this.name, '_list_event');
		var _this = this;
		_this.eventId = v.id;
		// console.log(v.id);

		var model = _this.collection.at(v.id);
		if(v.type === 'del'){

			_this.eventId = v.id;
	
			var model_collection = _this.collection.at(v.id);
			if(model_collection){
				var strItems = _sysFunc.remove_num_comma_in_value(model_collection.get('ipaddress'));
				_this.popupDeleteMsg(strItems, _this.name+'delete');
			}

		}
	},
	popupDeleteMsg: function(strItems, popupId){

		  var strFormat = getHTMLString('IPADDR_FILTER_5');
		  var str = strFormat.replace("%ITEMS%", strItems);
		  
					//app._popupViewingClose();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: popupId,
						title: getHTMLString('IPADDR_FILTER_4'),
						info: str,
						warn: '',
						btn: getHTMLString('SMS_INBOX_3') //DELETE
					});

	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		var _this = this;
		if(data.id === 1000 || data.id === 3000){
			app._popupViewingClose();
		}else if(data.id === 4000){ //para_chk error
			app._popupViewingClose();
		}else if(data.id === _this.name+'delete'){ //delete
			var collection_model = _this.collection.at(_this.eventId);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			_this.model = new m_IPADDR_F_DEL();
			var res = _this.model.set({ delete_rule: _this.eventId });
			_this.model.savePOST(false);
			_this.interval = setInterval(function(){
				if(res._response == 1){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(collection_model){
						collection_model.destroyPOST(false);
						_this.collection.trigger('sync');
					}
				}else{
					if(res._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_ALL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				}
			}, 5000);
		
		
		}else if(data.id === _this.name+'add'){ //add
			//console.log(_this.name, "add");
			var model = new m_IPADDR_FILTER();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');
			obj_add_num_comma_in_attr_values(attr, (_this.collection_len+1));

			var res = model.set(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			model.savePOST(false);
			_this.interval = setInterval(function(){
				 //console.log(res._response);
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else if(res._response == 'para_chk error'){
					// _this.collection.createPOST(false, model);
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_MACFILTER_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}else{
				}
			}, 5000);
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
});

var IPADDR_FILTER_SETTINGS = Backbone.View.extend({
	name: "IPADDR_FILTER_FILTERING",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="IPADDR_FILTER_FILTERING"></div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view3">'
	+'</div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>',
	model: null,
	v_view2: null,
	v_view3: null,
	owner_name: null,
	apply1: {
		0: 'filtering_status'
	},
	apply2: {
		0: 'filtering_mode'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_IPADDR_FILTERING();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);	
		_this.v_view3 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view3', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0;

	},
	modelSync: function() {
		// console.log('modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log('modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'Filtering Status',
				lang: 'PAGE_MACADDR_FILTERING_STATUS',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
				str: 'Filtering Mode',
				lang: 'PAGE_MACADDR_FILTERING_MODE',
				dropdown: true,
				visible: false,
				options: [{
					str: 'Allow',
					lang: '',
					data: 'Allow'
				},{
					str: 'Deny',
					lang: '',
					data: 'Deny'
				}],
				data: ''
			}]
		};
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() {	
		//console.log('v_viewModelChange');
		var _this = this;
		var v_onOffButtonLocated = _this.v_view2;
		var v_effectLocated = _this.v_view3;
				
		var v_attr1 = _.clone(v_onOffButtonLocated.model.attributes);
		var i_apply1 = _.invert(_this.apply1);
		
		var v_attr2 = _.clone(v_effectLocated.model.attributes);
		var i_apply2 = _.invert(_this.apply2);
		
		if (v_attr2.arr.length > 0){
		
		  var changed = false;
		  if(v_attr1.arr[i_apply1.filtering_status].data === '0'){
				_.map(v_attr2.arr, function(v, k){
					if(!v.disabled){
						v.disabled = true;
						changed = true;
					}
				});
		  }else{
				_.map(v_attr2.arr, function(v, k){
					if(v.disabled){
						v.disabled = false;
						changed = true;
					}
				});
		  }
		  if(changed){
			v_effectLocated.model.set(v_attr2);
			v_effectLocated.model.trigger('change');
		  }
		}
		
		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhideView', data: v_attr1.arr[0].data});
		}

	},
	_JioInput_Modify: function(e, v) {
		//console.log('_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);

	},
	btn_save: function() {
		// console.log('btn_save');
		var _this = this;
		var list_name = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'get_list_view_name'}) : '');
		var collection_len = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: list_name, from: _this.name, want: 'get_list_length'}) : 0);
		if(_this.model.attributes.filtering_mode == _this.v_view3.model.attributes.arr[0].data &&
		   _this.model.attributes.filtering_status == _this.v_view2.model.attributes.arr[0].data){

		}else if( _this.v_view2.model.attributes.arr[0].data=="1" &&
			collection_len==0){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('POPUP_ADD_RULE'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			var res = _this._sSaveModel(false, _this.model, [_this.v_view2, _this.v_view3], [_this.apply1, _this.apply2]);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}

	},
	_popup_apply: function(data){
		if(data.id === 5000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log("_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var EOGRE_RULES_LIST_V2 = Backbone.View.extend({
	name: "EOGRE_RULES_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="EOGRE_RULES_LIST">EoGRE Rules List</div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	ar_working: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	model_listeningSync: null,
	listenSyncParam: null,
	owner_name: null,
	set_add: {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					input: true,
					data: ''
				},{
					str: 'IP Address Type',
					lang: 'EOGRE_2',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					},{
						str: 'IPv6',
						lang: '',
						data: 'IPv6'
					/*},{
						str: 'IPv4 & IPv6',
						lang: '',
						data: 'IPv4v6'*/
					}],
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					input: true,
					data: ''
				},{
					str: 'Max ETH MTU Size',
					lang: 'EOGRE_27',
					disabled: true,
					input: true,
					data: ''
				},{
					str: 'VLAN IDs',
					lang: 'EOGRE_28',
					//disabled: true,
					input: true,
					inputstr: '(0 - 4093)',
					data: ''

				}]
	},
	apply_add: {
		0: 'tunnel_name',
		1: 'ip_address_type',
		2: 'remote_endpoint_ip',
		3: 'maximum_ethernet_mtu',
		4: 'vlan'
	},
	set_edit: {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					disabled: false,
					input: true,
					data: ''
				},{
					str: 'IP Address Type',
					lang: 'EOGRE_2',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					},{
						str: 'IPv6',
						lang: '',
						data: 'IPv6'
					/*},{
						str: 'IPv4 & IPv6',
						lang: '',
						data: 'IPv4v6'*/
					}],
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					input: true,
					data: ''
				},{
					str: 'Max ETH MTU Size',
					lang: 'EOGRE_27',
					disabled: true,
					input: true,
					data: ''
				},{
					str: 'VLAN IDs',
					lang: 'EOGRE_28',					
					input: true,
					inputstr: '(0 - 4093)',
					data: ''

				}]
	},
	apply_edit: {
		0: 'tunnel_name',
		1: 'ip_address_type',
		2: 'remote_endpoint_ip',
		3: 'maximum_ethernet_mtu',
		4: 'vlan'
	},
	events: {
		'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_EOGRE_RULE_LIST2;
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
		_this.page_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		
		var c_lists = _this.collection.toJSON();
		//console.log(c_lists);
		var value;
		_this.ar_working = [];
		_.map(c_lists, function (val, key) {
			//obj_remove_num_comma_in_attr_values(val);
			val['check'] = false;
			_this.ar_working.push(val); 
		});

		_this.UpdateListView(_this.ar_working);
		
		_this.collection_len = c_lists.length;
		_this.UpdateMaxLimit();
		
	}, 
	UpdateListView: function(from_lists){

		var _this = this;
		var head = [{
		 /*	lang: "",
			str: ""
		},{*/
			sort: true,
			lang: "EOGRE_1",
			str: "Tunnel Name"
		},{
			sort: true,
			str: 'IP Address Type',
			lang: 'EOGRE_2'
		},{
			sort: true,
			lang: "EOGRE_4",
			str: "Remote Endpoint IP"
		},{
			sort: true,
			str: 'Max ETH MTU Size',
			lang: 'EOGRE_27'
		},{
			sort: true,
			str: 'VLAN IDs',
			lang: 'EOGRE_28'

		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		
		var lists = [];
		//console.log(from_lists);
		_.map(from_lists, function (val, key) {

			lists.push([
				{
				/*	id: key,
					ex_data: _this.name,
					checkbox: true,
					stopPropagation: true,
					str: val.check ? '1' : '0'
				},{*/
					str: val.tunnel_name
				},{
					str: val.ip_address_type
				},{
					str: val.remote_endpoint_ip
				},{
					str: val.maximum_ethernet_mtu
				},{
					str: val.vlan
				},{
					id: key,
					ex_data: _this.name,
					btn: [{
						type: 'more'
					}, {
						/*type: val.enable_button == '1' ? 'enable' : 'disable'*/
						type: 'enablenew'
					}, {
						type: 'edit'
					}, {
						type: 'del'
					}]
				}
			]);
		});

		_this.v_view1.model.set({ head: head, lists: lists });

	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	modelListeningSync: function(model, resp, options) {
		var _this = this;
		 //console.log('modelListeningSync, response: ['+_this.model_listeningSync._response+']');
		 
		var _response = _this.model_listeningSync._response || null;
		// console.log("model_change_status:"+model_change_status);

		  _this.interval = setInterval(function(){
			if(!_response) return;
			
			if(_response == 1){
				if (_this.listenSyncParam.cb_OnSuccess){
				  _this.listenSyncParam.cb_OnSuccess({ _response: _response});
				}else{					  
					app._popupViewingClose();
					clearInterval(_this.interval);
				}
				
			}else{
				  // fail
				if (_this.listenSyncParam.cb_OnFail){
				  _this.listenSyncParam.cb_OnFail({ _response: _response});
				}else{					  
				  if(_response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 3000,
						title: getHTMLString(''),
						info: getHTMLString('INVALID_SETTINGS'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				  }
				}

			}
		  }, (_this.listenSyncParam.intervalWait ? _this.listenSyncParam.intervalWait : 2000));

	},
	setListenSyncModel: function(p){		
		var _this = this;
		
		_this.listenSyncParam = p;
		
		if (_this.model_listeningSync) _this.stopListening(_this.model_listeningSync, 'sync');  // must check model_listeningSync is available, else, it will remove one existing sync link.  in this case, collection sync.
		_this.model_listeningSync = p.model;
		_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
	},
	btnAdd: function() {
		// console.log(_this.name, 'btnAdd');
		
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: getHTMLString('POPUP_MAXIMUM_10_RULES'), 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE2();
			app.popup_view.model.set({
				id: 'add',
				title: getHTMLString('EOGRE_12'), //Add New
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_add;
			app.popup_view.apply1 = _this.apply_add;
		}
	},
	_list_event: function(v) {
		var _this = this;
		if(v.ex_data != _this.name) return;
		//console.log(this.name, '_list_event', v.type);

		// console.log(v.id);
		var model_working = _this.collection.at(v.id);
		if (!model_working) return;
		var model_attrs = _.clone(model_working.attributes);
		//obj_remove_num_comma_in_attr_values(model_attrs);
		
		_this.eventId = v.id;
		var working = _this.ar_working[v.id];
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			var m_del = new m_BASE_LIST_DEL(null, {url: '/data/eogre_rule_del2.json'});
			var res = m_del.set({ delete_rule: v.id });
			_this.setListenSyncModel({ 
				model: m_del, 
				cb_OnSuccess: function(p){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model_working){
						model_working.destroyPOST(false);
						_this.collection.trigger('sync');  						
					}
				},
				cb_OnFail: function(p){
					if(p._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				},
				intervalWait: 5000			  
			}); 
			
			m_del.savePOST(false);


		/*}else if(v.type === 'enable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_BASE_RULE_DO(null, {url: '/data/eogre_rule_do2.json'});
			var res = _this.model.set({ enable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '0'};
				//obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	

		}else if(v.type === 'disable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_BASE_RULE_DO(null, {url: '/data/eogre_rule_do2.json'});
			var res = _this.model.set({ disable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '1'};
				//obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	
        */

		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE2();
			app.popup_view.model.set({
				id: 'more',
				title: getHTMLString('EOGRE_11') 
			});
			app.popup_view.set1 = {
				arr: [{
					str: 'Tunnel Name',
					lang: 'EOGRE_1',
					text: ''
				},{
					str: 'IP Address Type',
					lang: 'EOGRE_2',
					text: ''

				},{
					str: 'Remote Endpoint IP',
					lang: 'EOGRE_4',
					text: ''
				},{
					str: 'Max ETH MTU Size',
					lang: 'EOGRE_27',
					text: ''
				},{
					str: 'VLAN IDs',
					lang: 'EOGRE_28',
					text: ''
				}]
			};
			app.popup_view.apply1 = {
				0: 'tunnel_name',
				1: 'ip_address_type',
				2: 'remote_endpoint_ip',
				3: 'maximum_ethernet_mtu',
				4: 'vlan'
			};
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);

		}else if(v.type === 'edit'){

			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_EOGRE_RULE2();
			app.popup_view.model.set({
				id: 'edit',
				title: getHTMLString('EOGRE_19'), //edit
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_edit;
			app.popup_view.apply1 = _this.apply_edit;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
			
				
		/*}else if(v.type === 'checkbox'){
			//console.log('checkbox');
				var cur = working;
				cur.check = cur.check ? false : true;
				//cur.select = cur.check;
						
				if (cur.check){					
					_.map(_this.ar_working, function (val, key) {
						if (key == v.id){
						}else{
							val.check = false;
						}
					});

				}else{
					

				}
				_this.UpdateListView(_this.ar_working);	

				*/
		}
	},
	_popup_apply: function(data){
		//console.log(this.name,  '_popup_apply');
		var _this = this;
		if(data.id === 'add'){ //add
			//console.log(_this.name, "add");
			var model = new m_EOGRE_RULE2();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');;
			
			obj_add_num_comma_in_attr_values(attr, (_this.collection_len+1));
			
			var res = model.set(attr);
			// console.log(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
			model.savePOST(false);
			_this.interval = setInterval(function(){
				// console.log(res._response);
				if(res._response == 1){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);
				}else if(res._response == 'para_chk error'){
					// _this.collection.createPOST(false, model);
					app._popupViewingClose();
					clearInterval(_this.interval);
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 4000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_MACFILTER_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);

		}else if((data.id === 'edit')){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var attr_model = _.clone(model.attributes);
				var model_to_save = new m_EOGRE_RULE2(attr_model);

				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				var attr = _.omit(popup_attr, 'id');
				var attr_no_id = _.clone(attr);
				
				// add id to attr value for post
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				
				var res = model_to_save.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				model_to_save.savePOST(false);
			}
			_this.interval = setInterval(function(){
				if(res._response == 1){
					clearInterval(_this.interval);
					
					if (1){						
						// set attr no id back
						model.set(attr_no_id);
						_this.collection.trigger('sync');
						app._popupViewingClose();
					}else{
				
						// refresh list
						_this.collection.fetch();				

						_this.interval = setTimeout(function(){
							app._popupViewingClose();
							clearInterval(_this.interval);
						}, 1000);
					
					}
						

				}else if(res._response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 5000,
						title: getHTMLString(''),
						info: getHTMLString('SET_ERROR_CHK_PORT_FORWARD_RULE'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				}
			}, 5000);

		}else{
			app._popupViewingClose();
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_IPSEC = Backbone.View.extend({
	name: "PAGE_SETTINGS_IPSEC_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_IPSEC_TITLE"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide settings1">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="IPSEC_RULES_LIST"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide list1"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log(this.name, '_list_event', data);
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		//console.log(data);
		var _this = this;
		
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhide_lists'){
				if(d.data === '1')
				{
					$(_this.v_view2.el).show();	 
				}else {
					$(_this.v_view2.el).hide(); 
				}
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new IPSEC_STATUS({ el: Backbone.$('.settings1', _this.$el), owner_name: _this.name });	
		_this.v_view2 = new IPSEC_RULES_LIST({ el: Backbone.$('.list1', _this.$el) , owner_name: _this.name});
	}
});



var IPSEC_RULES_LIST = Backbone.View.extend({
	name: "IPSEC_RULES_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="IPSEC_RULES_LIST"></div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	ar_working: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	model_listeningSync: null,
	listenSyncParam: null,
	owner_name: null,
	IPSEC_toLang: {
		encapsulation_mode: {
			Tunnel: "IPSEC_19",
			Transport: "IPSEC_20"		
		}	
	},
	set_more: null,
	apply_more: null,
	set_addedit: null,
	apply_addedit: null,
	set_adv: null,
	apply_adv: null,
	initial_set_apply: function () {
		var _this = this;
		_this.set_more= {
				arr: [{
					str: 'Connection Name',
					lang: 'IPSEC_2',
					staticText: true

				},{
					str: 'Encapsulation Mode',
					lang: 'IPSEC_3',
					staticText: true
				},{
					str: 'IP Address Type',
					lang: 'IPSEC_7',
					staticText: true
				},{
					str: 'Local Endpoint IP',
					lang: 'IPSEC_4',
					staticText: true
				},{
					str: 'Local Endpoint Subnet Mask',
					lang: 'IPSEC_8',
					staticText: true
				},{
					str: 'Remote Endpoint IP',
					lang: 'IPSEC_5',
					staticText: true
				},{
					str: 'Remote Endpoint Subnet Mask',
					lang: 'IPSEC_9',
					staticText: true
				},{
					str: 'Authentication Method',
					lang: 'IPSEC_10',
					staticText: true
				},{
					str: 'PSK',
					lang: 'IPSEC_11',
					staticText: true
				},{
					str: 'Keep Alive',
					lang: 'IPSEC_12',
					iconStatus: true,
					data: ''
				},{
					str: 'Keep Alive Interval',
					lang: 'IPSEC_13',
					staticText: true
				},{
					str: 'IKE Version',
					lang: 'IPSEC_14',
					staticText: true
				},{
					str: 'Encryption Algorithm',
					lang: 'IPSEC_6',
					staticText: true
				},{
					str: 'Key Lifetime',
					lang: 'IPSEC_15',
					staticText: true		
				}]
		};
		_this.apply_more= {
				0: 'connection_name',
				1: 'encapsulation_mode',
				2: 'ip_address_type',
				3: 'local_endpoint_ip',
				4: 'local_endpoint_subnet_mask',
				5: 'remote_endpoint_ip',
				6: 'remote_endpoint_subnet_mask',
				7: 'authentication_method',
				8: 'psk',
				9: 'keep_alive',
				10: 'keep_alive_interval',
				11: 'ike_version',		
				12: 'encryption_algorithm',
				13: 'key_lifetime'
		};
		_this.set_addedit= {
				arr: [{
					str: 'Connection Name',
					lang: 'IPSEC_2',
					input: true,
					data: ''
				},{
					str: 'Encapsulation Mode',
					lang: 'IPSEC_3',
					dropdown: true,
					visible: false,
					options: [{
						str: 'Tunnel',
						lang: this.IPSEC_toLang['encapsulation_mode']['Tunnel'],
						data: 'Tunnel'
					},{
						str: 'Transport',
						lang: _this.IPSEC_toLang['encapsulation_mode']['Transport'],
						data: 'Transport'
					}],
					data: ''
				},{
					str: 'IP Address Type',
					lang: 'IPSEC_7',
					dropdown: true,
					visible: false,
					options: [
						{str: 'IPv4',lang: '',data: 'IPv4'},
						{str: 'IPv6',lang: '',data: 'IPv6'},
						{str: 'IPv4 & IPv6',lang: '',data: 'IPv4v6'}
					],
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'IPSEC_5',
					input: true,
					data: ''
				},{
					str: 'Remote Endpoint Subnet Mask',
					lang: 'IPSEC_9',
					dropdown: true,
					visible: false,
					options: [
						{str: '255.255.255.255/32',lang: '',data: '255.255.255.255/32'},
						{str: '255.255.255.254/31',lang: '',data: '255.255.255.254/31'},
						{str: '255.255.255.252/30',lang: '',data: '255.255.255.252/30'},
						{str: '255.255.255.248/29',lang: '',data: '255.255.255.248/29'},
						{str: '255.255.255.240/28',lang: '',data: '255.255.255.240/28'},
						{str: '255.255.255.224/27',lang: '',data: '255.255.255.224/27'},
						{str: '255.255.255.192/26',lang: '',data: '255.255.255.192/26'},
						{str: '255.255.255.128/25',lang: '',data: '255.255.255.128/25'},
						{str: '2255.255.255.0/24',lang: '',data: '255.255.255.0/24'} 
					],					
					data: ''
				},{
					str: 'IPv6 Prefix',
					lang: 'IPSEC_16',
					input: true,
					inputstr: '(1 - 128)',
					data: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'IPSEC_10',
					dropdown: true,
					visible: false,
					options: [
						{str: 'PSK',lang: '',data: 'PSK'}
					],
					data: ''
				},{
					str: 'PSK',
					lang: 'IPSEC_11',
					input: true,
					inputstr: '(1 - 65535)',
					data: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'IPSEC_6',
					dropdown: true,
					visible: false,
					options: [
						{str: 'AES128-SHA256-DH14',lang: '',data: 'AES128-SHA256-DH14'},
						{str: 'AES128-SHA256-DH15',lang: '',data: 'AES128-SHA256-DH15'}
					],
					data: ''
				}]
		};
		_this.apply_addedit= {
				0: 'connection_name',
				1: 'encapsulation_mode',
				2: 'ip_address_type',
				3: 'remote_endpoint_ip',
				4: 'remote_endpoint_subnet_mask',
				5: 'ipv6_prefix',
				6: 'authentication_method',
				7: 'psk',				
				8: 'encryption_algorithm'
		};
		_this.set_adv= {
				arr: [{
					str: 'Connection Name',
					lang: 'IPSEC_2',
					input: true,
					data: ''
				},{
					str: 'Encapsulation Mode',
					lang: 'IPSEC_3',
					dropdown: true,
					visible: false,
					options: [{
						str: 'Tunnel',
						lang: _this.IPSEC_toLang['encapsulation_mode']['Tunnel'],
						data: 'Tunnel'
					},{
						str: 'Transport',
						lang: _this.IPSEC_toLang['encapsulation_mode']['Transport'],
						data: 'Transport'
					}],
					data: ''
				},{
					str: 'IP Address Type',
					lang: 'IPSEC_7',
					dropdown: true,
					visible: false,
					options: [
						{str: 'IPv4',lang: '',data: 'IPv4'},
						{str: 'IPv6',lang: '',data: 'IPv6'},
						{str: 'IPv4 & IPv6',lang: '',data: 'IPv4v6'}
					],
					data: ''
				},{
					str: 'Local Endpoint Subnet Mask',
					lang: 'IPSEC_8',
					dropdown: true,
					visible: false,
					disabled: true,
					options: [
						{str: '255.255.255.255/32',lang: '',data: '255.255.255.255/32'},
						{str: '255.255.255.254/31',lang: '',data: '255.255.255.254/31'},
						{str: '255.255.255.252/30',lang: '',data: '255.255.255.252/30'},
						{str: '255.255.255.248/29',lang: '',data: '255.255.255.248/29'},
						{str: '255.255.255.240/28',lang: '',data: '255.255.255.240/28'},
						{str: '255.255.255.224/27',lang: '',data: '255.255.255.224/27'},
						{str: '255.255.255.192/26',lang: '',data: '255.255.255.192/26'},
						{str: '255.255.255.128/25',lang: '',data: '255.255.255.128/25'},
						{str: '2255.255.255.0/24',lang: '',data: '255.255.255.0/24'} 
					],					
					data: ''
				},{
					str: 'IPv6 Prefix',
					lang: 'IPSEC_16',
					input: true,
					inputstr: '(1 - 128)',
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'IPSEC_5',
					input: true,
					data: ''
				},{
					str: 'Remote Endpoint Subnet Mask',
					lang: 'IPSEC_9',
					dropdown: true,
					visible: false,
					options: [
						{str: '255.255.255.255/32',lang: '',data: '255.255.255.255/32'},
						{str: '255.255.255.254/31',lang: '',data: '255.255.255.254/31'},
						{str: '255.255.255.252/30',lang: '',data: '255.255.255.252/30'},
						{str: '255.255.255.248/29',lang: '',data: '255.255.255.248/29'},
						{str: '255.255.255.240/28',lang: '',data: '255.255.255.240/28'},
						{str: '255.255.255.224/27',lang: '',data: '255.255.255.224/27'},
						{str: '255.255.255.192/26',lang: '',data: '255.255.255.192/26'},
						{str: '255.255.255.128/25',lang: '',data: '255.255.255.128/25'},
						{str: '2255.255.255.0/24',lang: '',data: '255.255.255.0/24'} 
					],					
					data: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'IPSEC_10',
					dropdown: true,
					visible: false,
					options: [
						{str: 'PSK',lang: '',data: 'PSK'}
					],
					data: ''
				},{
					str: 'PSK',
					lang: 'IPSEC_11',
					input: true,
					inputstr: '(1 - 65535)',
					data: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'IPSEC_6',
					dropdown: true,
					visible: false,
					options: [
						{str: 'AES128-SHA256-DH14',lang: '',data: 'AES128-SHA256-DH14'},
						{str: 'AES128-SHA256-DH15',lang: '',data: 'AES128-SHA256-DH15'}
					],
					data: ''
				},{
					str: 'Keep Alive',
					lang: 'IPSEC_12',
					checked: true,
					data: ''
				},{
					str: 'Keep Alive Interval',
					lang: 'IPSEC_13',
					input: true,
					inputstr: '(1 - 128)',
					data: ''
				},{
					str: 'IKE Version',
					lang: 'IPSEC_14',
					dropdown: true,
					visible: false,
					options: [
						{str: 'Version 2',lang: '',data: 'Version 2'}
					],
					data: ''
				},{
					str: 'Key Lifetime',
					lang: 'IPSEC_15',
					input: true,
					inputstr: '(1 - 128)',
					data: ''

				}]
		};
		_this.apply_adv = {
				0: 'connection_name',
				1: 'encapsulation_mode',
				2: 'ip_address_type',
				3: 'local_endpoint_subnet_mask',
				4: 'ipv6_prefix',
				5: 'remote_endpoint_ip',
				6: 'remote_endpoint_subnet_mask',
				7: 'authentication_method',
				8: 'psk',				
				9: 'encryption_algorithm',
				10: 'keep_alive',
				11: 'keep_alive_interval',
				12: 'ike_version',		
				13: 'key_lifetime'
		};
	},
	events: {
		'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_IPSEC_RULE_LIST;
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
		_this.page_name = o.owner_name;
		_this.initial_set_apply();

	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		
		var c_lists = _this.collection.toJSON();
		//console.log(c_lists);
		var value;
		_this.ar_working = [];
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);
			_this.ar_working.push(val); 
		});

		_this.UpdateListView(_this.ar_working);
		
		_this.collection_len = c_lists.length;
		_this.UpdateMaxLimit();
		
	}, 
	UpdateListView: function(from_lists){

		var _this = this;
		var head = [{
			sort: true,
			lang: "IPSEC_2",
			str: "Connection Name"
		},{
			sort: true,
			lang: "IPSEC_3",
			str: "Encapsulation Name"
		},{
			sort: true,
			lang: "IPSEC_4",
			str: "Local Endpoint IP"
		},{
			sort: true,
			lang: "IPSEC_5",
			str: "Remote Endpoint IP"
		},{
			sort: true,
			lang: "IPSEC_6",
			str: "Encryption Algorithm"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		//console.log(from_lists);
		_.map(from_lists, function (val, key) {

			lists.push([
				{
					str: val.connection_name
				},{
					str: getHTMLString(_this.IPSEC_toLang['encapsulation_mode'][val.encapsulation_mode])
				},{
					str: val.local_endpoint_ip
				},{
					str: val.remote_endpoint_ip
				},{
					str: val.encryption_algorithm
				},{
					id: key,
					ex_data: _this.name,
					btn: [{
						type: 'more'
					}, {
						type: val.enable_button == '1' ? 'enable' : 'disable'
					}, {
						type: 'edit'
					}, {
						type: 'settings'
					}, {
						type: 'del'
					}]
				}
			]);
		});

		_this.v_view1.model.set({ head: head, lists: lists });

	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	modelListeningSync: function(model, resp, options) {
		var _this = this;
		 //console.log('modelListeningSync, response: ['+_this.model_listeningSync._response+']');
		 
		var _response = _this.model_listeningSync._response || null;
		// console.log("model_change_status:"+model_change_status);

		  _this.interval = setInterval(function(){
			if(!_response) return;
			
			if(_response == 1){
				if (_this.listenSyncParam.cb_OnSuccess){
				  _this.listenSyncParam.cb_OnSuccess({ _response: _response});
				}else{					  
					app._popupViewingClose();
					clearInterval(_this.interval);
				}
				
			}else{
				  // fail
				if (_this.listenSyncParam.cb_OnFail){
				  _this.listenSyncParam.cb_OnFail({ _response: _response});
				}else{					  
				  if(_response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 3000,
						title: getHTMLString(''),
						info: getHTMLString('INVALID_SETTINGS'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				  }
				}

			}
		  }, (_this.listenSyncParam.intervalWait ? _this.listenSyncParam.intervalWait : 2000));

	},
	setListenSyncModel: function(p){		
		var _this = this;
		
		_this.listenSyncParam = p;
		
		if (_this.model_listeningSync) _this.stopListening(_this.model_listeningSync, 'sync');  // must check model_listeningSync is available, else, it will remove one existing sync link.  in this case, collection sync.
		_this.model_listeningSync = p.model;
		_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
	},
	btnAdd: function() {
		// console.log(_this.name, 'btnAdd');
		
		var _this = this;
		var maxLimit = _this.modelMaxLimit.get("maxLimit");
		if(_this.collection.length >= maxLimit){
			
			var strFormat = getHTMLString('POPUP_MAXIMUM_NUM_RULES');
			var str = strFormat.replace("%NUM%", maxLimit);

			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: str, 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_IPSEC_RULE();
			app.popup_view.model.set({
				id: 'add',
				title: getHTMLString('IPSEC_21'), //Add
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_addedit;
			app.popup_view.apply1 = _this.apply_addedit;
			
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAddEditPopupInputChanged);
		}
	},
	_list_event: function(v) {
		var _this = this;
		if(v.ex_data != _this.name) return;
		//console.log(this.name, '_list_event', v.type);

		// console.log(v.id);
		var model_working = _this.collection.at(v.id);
		if (!model_working) return;
		var model_attrs = _.clone(model_working.attributes);
		obj_remove_num_comma_in_attr_values(model_attrs);
		
		_this.eventId = v.id;
		var working = _this.ar_working[v.id];
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			var m_del = new m_BASE_LIST_DEL(null, {url: '/data/ipsec_rule_del.json'});
			var res = m_del.set({ delete_rule: v.id });
			_this.setListenSyncModel({ 
				model: m_del, 
				cb_OnSuccess: function(p){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model_working){
						model_working.destroyPOST(false);
						_this.collection.trigger('sync');  						
					}
				},
				cb_OnFail: function(p){
					if(p._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				},
				intervalWait: 5000			  
			}); 
			
			m_del.savePOST(false);


		}else if(v.type === 'enable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_BASE_RULE_DO(null, {url: '/data/ipsec_rule_do.json'});
			var res = _this.model.set({ enable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '0'};
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	

		}else if(v.type === 'disable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_BASE_RULE_DO(null, {url: '/data/ipsec_rule_do.json'});
			var res = _this.model.set({ disable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '1'};
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	


		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_IPSEC_RULE();
			app.popup_view.model.set({
				id: 'more',
				title: getHTMLString('IPSEC_23') ,
				isScroll: true
				
			});
			app.popup_view.set1 = _this.set_more;
			app.popup_view.apply1 = _this.apply_more;
			
			var attr = model_attrs;
			attr.local_endpoint_ip = display_change_empty_string_to_strikethrough(attr.local_endpoint_ip);
			attr.remote_endpoint_ip = display_change_empty_string_to_strikethrough(attr.remote_endpoint_ip);

			var strFormat = getHTMLString('IPSEC_17');
			var str = strFormat.replace("%NUM%", attr.key_lifetime);

			attr.key_lifetime =  str;
			app.popup_view.modelInput.set(attr);

		}else if(v.type === 'edit'){

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_IPSEC_RULE();
			app.popup_view.model.set({
				id: 'edit',
				title: getHTMLString('IPSEC_18'), //edit
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_addedit;
			app.popup_view.apply1 = _this.apply_addedit;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAddEditPopupInputChanged);
			
		}else if(v.type === 'settings'){

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_IPSEC_RULE();
			app.popup_view.model.set({
				id: 'settings',
				title: getHTMLString('IPSEC_22'), //Advanced Settings
				btn: getHTMLString('MAIN_BTN_SAVE'), //Save
				isScroll: true
			}); 
			app.popup_view.set1 = _this.set_adv;
			app.popup_view.apply1 = _this.apply_adv;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAdvSettingsPopupInputChanged);
				
				
		}
	},
	onAdvSettingsPopupInputChanged: function(o) {
		//console.log(this.name, 'onAdvSettingsPopupInputChanged');
		//console.log(o);		

		var _this = this;		

		var popupViewModel = o.viewModel;
		var apply =  _this.apply_adv;
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply1 = _.invert(apply);
		var changed = false;
		
		function ensureAttrDisabledValue(attrName, value){
			if (v_attr.arr[i_apply1[attrName]].disabled != value){
				v_attr.arr[i_apply1[attrName]].disabled = value;
				changed = true;
			}			
		}
		
		if(v_attr.arr[i_apply1.ip_address_type].data === 'IPv4'){
			ensureAttrDisabledValue('ipv6_prefix', true);
			ensureAttrDisabledValue('remote_endpoint_subnet_mask', false);
			
		}else if(v_attr.arr[i_apply1.ip_address_type].data === 'IPv6'){
			ensureAttrDisabledValue('ipv6_prefix', false);
			ensureAttrDisabledValue('remote_endpoint_subnet_mask', true);
		}else {
			ensureAttrDisabledValue('ipv6_prefix', false);
			ensureAttrDisabledValue('remote_endpoint_subnet_mask', false);
		}

		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	onAddEditPopupInputChanged: function(o) {
		//console.log(this.name, 'onAddEditPopupInputChanged');
		//console.log(o);		

		var _this = this;		

		var popupViewModel = o.viewModel;
		var apply =  _this.apply_addedit;
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply1 = _.invert(apply);
		var changed = false;
		
		function ensureAttrDisabledValue(attrName, value){
			if (v_attr.arr[i_apply1[attrName]].disabled != value){
				v_attr.arr[i_apply1[attrName]].disabled = value;
				changed = true;
			}			
		}
		
		if(v_attr.arr[i_apply1.ip_address_type].data === 'IPv4'){
			ensureAttrDisabledValue('ipv6_prefix', true);
			ensureAttrDisabledValue('remote_endpoint_subnet_mask', false);
			
		}else if(v_attr.arr[i_apply1.ip_address_type].data === 'IPv6'){
			ensureAttrDisabledValue('ipv6_prefix', false);
			ensureAttrDisabledValue('remote_endpoint_subnet_mask', true);
		}else {
			ensureAttrDisabledValue('ipv6_prefix', false);
			ensureAttrDisabledValue('remote_endpoint_subnet_mask', false);
		}

		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	_popup_apply: function(data){
		//console.log(this.name,  '_popup_apply');
		var _this = this;
		if(data.id === 'add'){ //add
			//console.log(_this.name, "add");
			var model = new m_IPSEC_RULE();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');;
			
			obj_add_num_comma_in_attr_values(attr, (_this.collection_len+1));
			
			var res = model.set(attr);
			// console.log(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...

			_this.setListenSyncModel({ model: model, cb_OnSuccess: function(p){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);

			} });
			model.savePOST(false);


		}else if((data.id === 'edit') || (data.id === 'settings')){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				var attr = _.omit(popup_attr, 'id');
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...

				_this.setListenSyncModel({ model: model});			

				model.savePOST(false);
			}

		}else{
			app._popupViewingClose();
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
}, {

});

var IPSEC_STATUS = Backbone.View.extend({
	name: "IPSEC_STATUS",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="IPSEC_STATUS"></div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view2">'
	+'</div>'
	+'<div></div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>'
	+'</div>'
	,
	model: null,
	v_view2: null,
	owner_name: null,
	apply1: {
		0: 'ipsec'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_IPSEC_STATUS();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.listenTo(_this.v_view2.model, 'change', _this.v_viewModelChange);	// 10/29 '21
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		 //console.log(this.name, 'modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log(this.name, 'modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'IPSec',
				lang: 'IPSEC_1',
				checked: true,
				data: ''
			}]
		};

		var res = _this._sChangeViews(_this.model, [set1], [_this.v_view2], [_this.apply1]);
	},
	v_viewModelChange: function() { 
		//console.log(this.name, 'v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view2.model.attributes);

		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhide_lists', data: v_attr.arr[0].data});
		}
	},
	_JioInput_Modify: function(e, v) {
		//console.log(this.name, '_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log(this.name, 'btn_save');
		var _this = this;
		var collection_len = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: "IPSEC_RULES_LIST", from: _this.name, want: 'get_list_length'}) : 0);

		var res = _this._sSaveModel(false, _this.model, [_this.v_view2], [_this.apply1]);
		if(_this.model.attributes.ipsec == _this.model._previousAttributes.ipsec){

		}else if(_this.model.attributes.ipsec=="1" &&
				 collection_len==0){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('POPUP_ADD_RULE'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, "_popup_apply");
		if(data.id === 1000 || data.id === 2000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log(this.name, "_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_OPENVPN = Backbone.View.extend({
	name: "PAGE_SETTINGS_OPENVPN_TITLE",
	template: ""
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_OPENVPN_TITLE"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide settings1">'
	+'</div>'
	+'</div>'
	+'<div class="jioContentRowsGap"></div>'
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="OPENVPN_RULES_LIST"></span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectinGrid jioH2MobileShowHide list1"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>'
	,
	v_view1: null,
	v_view2: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		//_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log(this.name, '_list_event', data);
		var _this = this;
		if(_this.v_view2._list_event){
			_this.v_view2._list_event(data);
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, '_popup_apply');
		//console.log(data);
		var _this = this;
		
		if(_this.v_view2._popup_apply){
			_this.v_view2._popup_apply(data);
		}
	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	crossViewFn: function(d) {
		var _this = this;
		if (d.to == _this.name){
			if (d.want == 'showhide_lists'){
				if(d.data === '1')
				{
					$(_this.v_view2.el).show();	 
				}else {
					$(_this.v_view2.el).hide(); 
				}
			}				
		}else if (d.to == _this.v_view2.name){
			return _this.v_view2.crossViewFn(d);
		}
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view1 = new OPENVPN_STATUS({ el: Backbone.$('.settings1', _this.$el), owner_name: _this.name });	
		_this.v_view2 = new OPENVPN_RULES_LIST({ el: Backbone.$('.list1', _this.$el) , owner_name: _this.name});
	}
});



var OPENVPN_RULES_LIST = Backbone.View.extend({
	name: "OPENVPN_RULES_LIST",
	template: ''
	+'<div class="jioTableSection jioTableSectionWithIcon">'
	+'<div class="jioTableHeadingWithMaxLimit">'
	+'<div class="jioH2" langid="OPENVPN_RULES_LIST"></div>'
	+'<div class="v_MaxLimit"></div>'
	+'<div class="jioIconAddNew jioClickButton btnAdd"></div>'
	+'<div class="jioH2 jioClickButton btnAdd" langid="PAGE_SETTINGS_CELLULAR_ADD_NEW">Add New</div>'
	+'</div>'
	+'<table class="forJioTableSort v_view1">'
	+'</table>'
	+'</div>',
	collection: null,
	collection_len: 0,
	ar_working: null,
	v_view1: null,
	v_viewMaxLimit:null,
	modelMaxLimit: null,
	islog: false,
	eventId: 0,
	model_listeningSync: null,
	listenSyncParam: null,
	owner_name: null,
	set_more: null,
	apply_more: null,
	set_addedit: null,
	apply_addedit: null,
	set_adv: null,
	apply_adv: null,
	initial_set_apply: function () {
		var _this = this;
		_this.set_more= {
				arr: [{
					str: 'Protocol',
					lang: 'OPENVPN_4',
					staticText: true
				},{
					str: 'Port',
					lang: 'OPENVPN_5',
					staticText: true
				},{
					str: 'Tunnel Scenario',
					lang: 'OPENVPN_6',
					staticText: true
				},{
					str: 'Authorization Type',
					lang: 'OPENVPN_7',
					staticText: true
				},{
					str: 'Static Key',
					lang: 'OPENVPN_8',
					staticText: true
				},{
					str: 'IP Address Type',
					lang: 'OPENVPN_9',
					staticText: true
				},{
					str: 'Local Endpoint IP',
					lang: 'OPENVPN_10',
					staticText: true
				},{
					str: 'Remote Endpoint IP',
					lang: 'OPENVPN_11',
					staticText: true
				},{
					str: 'Encryption Algorithm',
					lang: 'OPENVPN_12',
					staticText: true
				},{
					str: 'Push Route Option',
					lang: 'OPENVPN_13',
					iconStatus: true,
					data: ''
				},{
					str: 'Remote Netmask',
					lang: 'OPENVPN_14',
					staticText: true
				},{
					str: 'Redirect Default Gateway',
					lang: 'OPENVPN_15',
					iconStatus: true,
					data: ''
				},{
					str: 'LZO Compression',
					lang: 'OPENVPN_16',
					iconStatus: true,
					data: ''
				},{
					str: 'Persist Key',
					lang: 'OPENVPN_17',
					iconStatus: true,
					data: ''
				},{
					str: 'Persist TUN',
					lang: 'OPENVPN_18',
					iconStatus: true,
					data: ''		
				}]
		};
		_this.apply_more= {
			0: 'protocol',
			1: 'port',
			2: 'tunnel_scenario',
			3: 'authorization_type',
			4: 'static_key',
			5: 'ip_address_type',
			6: 'local_endpoint_ip',
			7: 'remote_endpoint_ip',
			8: 'encryption_algorithm',
			9: 'push_route_option',
			10: 'remote_netmask',
			11: 'redirect_default_gateway',
			12: 'lzo_compression',
			13: 'persist_key',
			14: 'persist_tun'
		};
		_this.set_addedit= {
				arr: [{
					str: 'Protocol',
					lang: 'OPENVPN_4',
					dropdown: true,
					visible: false,
					options: [{
						str: 'TCP',
						lang: '',
						data: 'TCP'
					},{
						str: 'UDP',
						lang: '',
						data: 'UDP'
					}],
					data: ''
				},{
					str: 'Port',
					lang: 'OPENVPN_5',
					input: true,
					inputstr: '(1024 - 65535)',
					data: ''

				},{
					str: 'Tunnel Scenario',
					lang: 'OPENVPN_6',
					dropdown: true,
					visible: false,
					options: [{
						str: 'TUN (Layer 3)',
						lang: '',
						data: 'TUN (Layer 3)'
					}],
					data: ''
				},{
					str: 'Authorization Type',
					lang: 'OPENVPN_7',
					dropdown: true,
					visible: false,
					options: [{
						str: 'Static',
						lang: '',
						data: 'Static'
					}],
					data: ''
				},{
					str: 'Static Key',
					lang: 'OPENVPN_8',
					input: true,
					data: ''

				},{
					str: 'IP Address Type',
					lang: 'OPENVPN_9',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					}],
					data: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'OPENVPN_12',
					dropdown: true,
					visible: false,
					options: [
						{str: 'AES128-SHA256',lang: '',data: 'AES128-SHA256'},
						{str: 'AES128-SHA256-DH14',lang: '',data: 'AES128-SHA256-DH14'},
						{str: 'AES128-SHA256-DH15',lang: '',data: 'AES128-SHA256-DH15'}
					],
					data: ''

				}]
		};
		_this.apply_addedit= {
			0: 'protocol',
			1: 'port',
			2: 'tunnel_scenario',
			3: 'authorization_type',
			4: 'static_key',
			5: 'ip_address_type',
			6: 'encryption_algorithm'
		};
		_this.set_adv= {
				arr: [{
					str: 'Protocol',
					lang: 'OPENVPN_4',
					dropdown: true,
					visible: false,
					options: [{
						str: 'TCP',
						lang: '',
						data: 'TCP'
					},{
						str: 'UDP',
						lang: '',
						data: 'UDP'
					}],
					data: ''
				},{
					str: 'Port',
					lang: 'OPENVPN_5',
					input: true,
					inputstr: '(1024 - 65535)',
					data: ''

				},{
					str: 'Tunnel Scenario',
					lang: 'OPENVPN_6',
					dropdown: true,
					visible: false,
					options: [{
						str: 'TUN (Layer 3)',
						lang: '',
						data: 'TUN (Layer 3)'
					}],
					data: ''
				},{
					str: 'Authorization Type',
					lang: 'OPENVPN_7',
					dropdown: true,
					visible: false,
					options: [{
						str: 'Static',
						lang: '',
						data: 'Static'
					}],
					data: ''
				},{
					str: 'Static Key',
					lang: 'OPENVPN_8',
					input: true,
					data: ''

				},{
					str: 'IP Address Type',
					lang: 'OPENVPN_9',
					dropdown: true,
					visible: false,
					options: [{
						str: 'IPv4',
						lang: '',
						data: 'IPv4'
					}],
					data: ''
				},{
					str: 'Local Endpoint IP',
					lang: 'OPENVPN_10',
					input: true,
					data: ''
				},{
					str: 'Remote Endpoint IP',
					lang: 'OPENVPN_11',
					input: true,
					data: ''
				},{
					str: 'Encryption Algorithm',
					lang: 'OPENVPN_12',
					str: 'Encryption Algorithm',
					lang: 'OPENVPN_12',
					dropdown: true,
					visible: false,
					options: [
						{str: 'AES128-SHA256',lang: '',data: 'AES128-SHA256'},
						{str: 'AES128-SHA256-DH14',lang: '',data: 'AES128-SHA256-DH14'},
						{str: 'AES128-SHA256-DH15',lang: '',data: 'AES128-SHA256-DH15'}
					],
					data: ''
				},{
					str: 'Push Route Option',
					lang: 'OPENVPN_13',
					checked: true,
					data: ''

				},{
					str: 'Remote Netmask',
					lang: 'OPENVPN_21',
					labelGreyText: getHTMLString('OPENVPN_22'),
					input: true,
					data: ''

				},{
					str: 'Redirect Default Gateway',
					lang: 'OPENVPN_15',
					checked: true,
					data: ''
				},{
					str: 'LZO Compression',
					lang: 'OPENVPN_16',
					checked: true,
					data: ''
				},{
					str: 'Persist Key',
					lang: 'OPENVPN_17',
					checked: true,
					data: ''
				},{
					str: 'Persist TUN',
					lang: 'OPENVPN_18',
					checked: true,
					data: ''
		
				}]
		};
		_this.apply_adv = {
			0: 'protocol',
			1: 'port',
			2: 'tunnel_scenario',
			3: 'authorization_type',
			4: 'static_key',
			5: 'ip_address_type',
			6: 'local_endpoint_ip',
			7: 'remote_endpoint_ip',
			8: 'encryption_algorithm',
			9: 'push_route_option',
			10: 'remote_netmask',
			11: 'redirect_default_gateway',
			12: 'lzo_compression',
			13: 'persist_key',
			14: 'persist_tun'
		};
	},
	events: {
		'click .btnAdd': 'btnAdd'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.collection = new c_OPENVPN_RULE_LIST;
		_this.modelMaxLimit = new m_JIO_MAX_LIMIT({maxLimit: 10});
		_this.page_name = o.owner_name;
		_this.initial_set_apply();

	},
	initialize: function () {
		var _this = this;
		_this.listenTo(_this.collection, 'sync', _this.collectionSync);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_FORJIOTABLESORT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.v_viewMaxLimit = new MAX_LIMIT({ 
			el: Backbone.$('.v_MaxLimit', _this.$el),
			model: _this.modelMaxLimit
		});
		_this.collection.fetch();
	},
	collectionSync: function() {
		//console.log(this.name, 'collectionSync', this.collection);
		var _this = this;
		
		var c_lists = _this.collection.toJSON();
		//console.log(c_lists);
		var value;
		_this.ar_working = [];
		_.map(c_lists, function (val, key) {
			obj_remove_num_comma_in_attr_values(val);
			_this.ar_working.push(val); 
		});

		_this.UpdateListView(_this.ar_working);
		
		_this.collection_len = c_lists.length;
		_this.UpdateMaxLimit();
		
	}, 
	UpdateListView: function(from_lists){

		var _this = this;
		var head = [{
			sort: true,
			lang: "OPENVPN_5",
			str: "Port"
		},{
			sort: true,
			lang: "OPENVPN_4",
			str: "Protocol"
		},{
			sort: true,
			lang: "OPENVPN_7",
			str: "Authorization Type"
		},{
			sort: true,
			lang: "OPENVPN_10",
			str: "Local Endpoint IP"
		},{
			sort: true,
			lang: "OPENVPN_11",
			str: "Remote Endpoint IP"
		},{
			sort: false,
			lang: "MAIN_ACTIONS",
			str: "Actions"
		}];
		var lists = [];
		//console.log(from_lists);
		_.map(from_lists, function (val, key) {

			lists.push([
				{
					str: val.port
				},{
					str: val.protocol
				},{
					str: val.authorization_type
				},{
					str: display_change_empty_string_to_strikethrough(val.local_endpoint_ip)
				},{
					str: display_change_empty_string_to_strikethrough(val.remote_endpoint_ip)
				},{
					id: key,
					ex_data: _this.name,
					btn: [{
						type: 'more'
					}, {
						type: val.enable_button == '1' ? 'enable' : 'disable'
					}, {
						type: 'edit'
					}, {
						type: 'settings'
					}, {
						type: 'del'
					}]
				}
			]);
		});

		_this.v_view1.model.set({ head: head, lists: lists });

	},
	UpdateMaxLimit: function(){
		var _this = this;
		if(_this.collection.length >= _this.modelMaxLimit.get("maxLimit")){
			_this.modelMaxLimit.setError(true);
		}else{
			_this.modelMaxLimit.setError(false);
		}
	},
	modelListeningSync: function(model, resp, options) {
		var _this = this;
		 //console.log('modelListeningSync, response: ['+_this.model_listeningSync._response+']');
		 
		var _response = _this.model_listeningSync._response || null;
		// console.log("model_change_status:"+model_change_status);

		  _this.interval = setInterval(function(){
			if(!_response) return;
			
			if(_response == 1){
				if (_this.listenSyncParam.cb_OnSuccess){
				  _this.listenSyncParam.cb_OnSuccess({ _response: _response});
				}else{					  
					app._popupViewingClose();
					clearInterval(_this.interval);
				}
				
			}else{
				  // fail
				if (_this.listenSyncParam.cb_OnFail){
				  _this.listenSyncParam.cb_OnFail({ _response: _response});
				}else{					  
				  if(_response == 'para_chk error'){
					app._popupViewingClose();
					clearInterval(_this.interval);
					_this.collection.fetch();
					app._popupViewing(POPUP_CONFIRM_TEMPLATE);
					app.popup_view.model.set({
						id: 3000,
						title: getHTMLString(''),
						info: getHTMLString('INVALID_SETTINGS'),
						warn: '',
						btn: getHTMLString('MAIN_BTN_OK') //OK
					});
				  }
				}

			}
		  }, (_this.listenSyncParam.intervalWait ? _this.listenSyncParam.intervalWait : 2000));

	},
	setListenSyncModel: function(p){		
		var _this = this;
		
		_this.listenSyncParam = p;
		
		if (_this.model_listeningSync) _this.stopListening(_this.model_listeningSync, 'sync');  // must check model_listeningSync is available, else, it will remove one existing sync link.  in this case, collection sync.
		_this.model_listeningSync = p.model;
		_this.listenTo(_this.model_listeningSync, 'sync', _this.modelListeningSync);
	},
	btnAdd: function() {
		// console.log(_this.name, 'btnAdd');
		
		var _this = this;
		var maxLimit = _this.modelMaxLimit.get("maxLimit");
		if(_this.collection.length >= maxLimit){
			
			var strFormat = getHTMLString('POPUP_MAXIMUM_NUM_RULES');
			var str = strFormat.replace("%NUM%", maxLimit);

			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_YOU_HAVE_REACHED_THE_LIMIT'), //You have reached the limit!
				info: str, 
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		} else {

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_OPENVPN_RULE();
			app.popup_view.model.set({
				id: 'add',
				title: getHTMLString('OPENVPN_24'), //Add
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_addedit;
			app.popup_view.apply1 = _this.apply_addedit;
			
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAddEditPopupInputChanged);
		}
	},
	_list_event: function(v) {
		var _this = this;
		if(v.ex_data != _this.name) return;
		//console.log(this.name, '_list_event', v.type);

		// console.log(v.id);
		var model_working = _this.collection.at(v.id);
		if (!model_working) return;
		var model_attrs = _.clone(model_working.attributes);
		obj_remove_num_comma_in_attr_values(model_attrs);
		
		_this.eventId = v.id;
		var working = _this.ar_working[v.id];
		if(v.type === 'del'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...

			var m_del = new m_BASE_LIST_DEL(null, {url: '/data/openvpn_rule_del.json'});
			var res = m_del.set({ delete_rule: v.id });
			_this.setListenSyncModel({ 
				model: m_del, 
				cb_OnSuccess: function(p){
					app._popupViewingClose();
					clearInterval(_this.interval);
					if(model_working){
						model_working.destroyPOST(false);
						_this.collection.trigger('sync');  						
					}
				},
				cb_OnFail: function(p){
					if(p._response == 'del error'){
						app._popupViewingClose();
						clearInterval(_this.interval);
						app._popupViewing(POPUP_CONFIRM_TEMPLATE);
						app.popup_view.model.set({
							id: 3000,
							title: getHTMLString(''),
							info: getHTMLString('POPUP_CANNOT_DEL_RULES'),
							warn: '',
							btn: getHTMLString('MAIN_BTN_OK') //OK
						});
					}
				},
				intervalWait: 5000			  
			}); 
			
			m_del.savePOST(false);


		}else if(v.type === 'enable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_BASE_RULE_DO(null, {url: '/data/openvpn_rule_do.json'});
			var res = _this.model.set({ enable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '0'};
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	

		}else if(v.type === 'disable'){
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...
				
			_this.model = new m_BASE_RULE_DO(null, {url: '/data/openvpn_rule_do.json'});
			var res = _this.model.set({ disable: _this.eventId });
				
			_this.setListenSyncModel({ model: _this.model, cb_OnSuccess: function(p){
				app._popupViewingClose();
				clearInterval(_this.interval);

				var attr = { enable_button :  '1'};
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res_m = _this.collection.at(_this.eventId).set(attr);

				_this.collection.trigger('sync');

			} });
			
			_this.model.savePOST(false);	


		}else if(v.type === 'more'){
			app._popupViewing(POPUP_INPUT_TEMPLATE);
			app.popup_view.modelInput = new m_OPENVPN_RULE();
			app.popup_view.model.set({
				id: 'more',
				title: getHTMLString('OPENVPN_19'),
				isScroll: true
				
			});
			app.popup_view.set1 = _this.set_more;
			app.popup_view.apply1 = _this.apply_more;
			
			var attr = model_attrs;
			attr.local_endpoint_ip = display_change_empty_string_to_strikethrough(attr.local_endpoint_ip);
			attr.remote_endpoint_ip = display_change_empty_string_to_strikethrough(attr.remote_endpoint_ip);

			app.popup_view.modelInput.set(attr);

		}else if(v.type === 'edit'){

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_OPENVPN_RULE();
			app.popup_view.model.set({
				id: 'edit',
				title: getHTMLString('OPENVPN_20'), //edit
				btn: getHTMLString('MAIN_BTN_SAVE') //Save
			}); 
			app.popup_view.set1 = _this.set_addedit;
			app.popup_view.apply1 = _this.apply_addedit;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAddEditPopupInputChanged);
			
		}else if(v.type === 'settings'){

			app._popupViewing(POPUP_INPUT_TEMPLATE_WITH_INPUT_CHANGE_DETACTION);
			app.popup_view.modelInput = new m_OPENVPN_RULE();
			app.popup_view.model.set({
				id: 'settings',
				title: getHTMLString('OPENVPN_23'), //Advanced Settings
				btn: getHTMLString('MAIN_BTN_SAVE'), //Save
				isScroll: true
			}); 
			app.popup_view.set1 = _this.set_adv;
			app.popup_view.apply1 = _this.apply_adv;
			
			var attr = model_attrs;
			app.popup_view.modelInput.set(attr);
			_this.listenTo(app.popup_view, 'popupInputChanged', _this.onAdvSettingsPopupInputChanged);
				
				
		}
	},
	onAdvSettingsPopupInputChanged: function(o) {
		//console.log(this.name, 'onAdvSettingsPopupInputChanged');
		//console.log(o);		

		var _this = this;		

		var popupViewModel = o.viewModel;
		var apply =  _this.apply_adv;
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply1 = _.invert(apply);
		var changed = false;
		
		function ensureAttrDisabledValue(attrName, value){
			if (v_attr.arr[i_apply1[attrName]].disabled != value){
				v_attr.arr[i_apply1[attrName]].disabled = value;
				changed = true;
			}			
		}

		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	onAddEditPopupInputChanged: function(o) {
		//console.log(this.name, 'onAddEditPopupInputChanged');
		//console.log(o);		

		var _this = this;		

		var popupViewModel = o.viewModel;
		var apply =  _this.apply_addedit;
		
		var v_attr = _.clone(popupViewModel.attributes);
		var i_apply1 = _.invert(apply);
		var changed = false;
		
		function ensureAttrDisabledValue(attrName, value){
			if (v_attr.arr[i_apply1[attrName]].disabled != value){
				v_attr.arr[i_apply1[attrName]].disabled = value;
				changed = true;
			}			
		}
		
		//
		if(changed){
			popupViewModel.set(v_attr);
			popupViewModel.trigger('change');
		}	
		
	},
	_popup_apply: function(data){
		//console.log(this.name,  '_popup_apply');
		var _this = this;
		if(data.id === 'add'){ //add
			//console.log(_this.name, "add");
			var model = new m_OPENVPN_RULE();
			var popup_attr = _.clone(app.popup_view.modelInput.attributes);
			var attr = _.omit(popup_attr, 'id');;
			
			obj_add_num_comma_in_attr_values(attr, (_this.collection_len+1));
			
			var res = model.set(attr);
			// console.log(attr);
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...

			_this.setListenSyncModel({ model: model, cb_OnSuccess: function(p){
					if(!_.isEmpty(res.changed)){
						// _this.collection.createPOST(false, model);
						_this.collection.fetch();
					}
					app._popupViewingClose();
					clearInterval(_this.interval);

			} });
			model.savePOST(false);


		}else if((data.id === 'edit') || (data.id === 'settings')){ //edit
			var model = _this.collection.at(_this.eventId);
			if(model){
				var popup_attr = _.clone(app.popup_view.modelInput.attributes);
				var attr = _.omit(popup_attr, 'id');
				obj_add_num_comma_in_attr_values(attr, (_this.eventId+1));
				var res = model.set(attr);
				app._popupViewing(POPUP_LOADING);
				app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_PLEASE_WAIT') }); // Please wait...

				_this.setListenSyncModel({ model: model});			

				model.savePOST(false);
			}

		}else{
			app._popupViewingClose();
		}
	},
	crossViewFn: function(d) {
		//console.log(this.name,  'crossViewFn');
		var _this = this;     
		if (d.to == _this.name){
			switch (d.want){
				case 'get_list_length':{
					return _this.collection.length;
				}
			}
			
		}
	},
	render: function() {
		//console.log('render');
	}
}, {

});

var OPENVPN_STATUS = Backbone.View.extend({
	name: "OPENVPN_STATUS",
	template: ''
	+'<div class="jioContentHeaderContainer_1">'
	+'<div class="jioH2" langid="OPENVPN_STATUS"></div>'
	+'</div>'
	+'<div class="jio2SectionGridFor1Section">'
	+'<div class="jio1SectionWithInput v_view1"></div>'
	+'<div></div>'
	+'<div class="jio1SectionWithInput v_view2"></div>'
	+'</div>'
	+'<div class="jioInputButton">'
	+'<div></div>'
	+'<div>'
	+'<input type="button" class="btn_save" langid="MAIN_BTN_SAVE" value="Save">'
	+'</div>'
	+'</div>'
	,
	model: null,
	v_view1: null,
	v_view2: null,
	owner_name: null,
	apply1: {
		0: 'openvpn'
	},
	apply2: {
		0: 'mode'
	},
	events: {
		'click .btn_save': 'btn_save'
	},
	preinitialize: function (o) {
		var _this = this;
		_this.model = new m_OPENVPN_STATUS();
		_this.owner_name = o.owner_name;
	},
	initialize: function () {
		var _this = this;
		_this.$el.on('_jioOnOffLabel', _this._JioInput_Modify);
		_this.$el.on('_JioInput_Edit', _this._JioInput_Modify);
		_this.$el.on('_dropdownlia', _this._JioInput_Modify);
		_this.listenTo(_this.model, 'sync', _this.modelSync);
		_this.listenTo(_this.model, 'change', _this.modelChange);
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.v_view1 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view1', _this.$el) });
		_this.listenTo(_this.v_view1.model, 'change', _this.v_viewModelChange);	
		_this.v_view2 = new TEMP_JIO1SECTION_WITHINPUT({ el: Backbone.$('.v_view2', _this.$el) });
		_this.model.fetchOLDJSON();
		model_change_status = 0
	},
	modelSync: function() {
		 //console.log(this.name, 'modelSync');
		var _this = this;
		var _response = _this.model._response || null;
		// if(_response){
			// console.log(_response);
		// }
		// console.log("model_change_status:"+model_change_status);
		if(model_change_status == 1){
			_this.interval = setInterval(function(){
				if(_response){
					app._popupViewingClose();
					clearInterval(_this.interval);
					model_change_status = 0;
				}
			}, 3000);
		}
	},
	modelChange: function() {
		//console.log(this.name, 'modelChange');
		var _this = this;
		var set1 = {
			arr: [{
				str: 'OpenVPN',
				lang: 'OPENVPN_1',
				checked: true,
				data: ''
			}]
		};
		var set2 = {
			arr: [{
					str: 'Mode',
					lang: 'OPENVPN_2',
					dropdown: true,
					visible: false,
					options: [{
						str: 'Server',
						lang: 'OPENVPN_3',
						data: 'Server'
					}],
					data: ''
			}]
		};

					
		var res = _this._sChangeViews(_this.model, [set1, set2], [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
	},
	v_viewModelChange: function() { 
		//console.log(this.name, 'v_viewModelChange');
		var _this = this;
		var v_attr = _.clone(_this.v_view1.model.attributes);

		if (app.router_view.crossViewFn){
			app.router_view.crossViewFn({ to: _this.owner_name, from: _this.name, want: 'showhide_lists', data: v_attr.arr[0].data});
		}
	},
	_JioInput_Modify: function(e, v) {
		//console.log(this.name, '_JioInput_Modify');
		var _this = this;
		Backbone.$('.btn_save', _this.$el).prop('disabled', false);
	},
	btn_save: function() {
		//console.log(this.name, 'btn_save');
		var _this = this;
		var collection_len = (app.router_view.crossViewFn ? app.router_view.crossViewFn({ to: "OPENVPN_RULES_LIST", from: _this.name, want: 'get_list_length'}) : 0);

		var res = _this._sSaveModel(false, _this.model, [_this.v_view1, _this.v_view2], [_this.apply1, _this.apply2]);
		if(_this.model.attributes.openvpn == _this.model._previousAttributes.openvpn){

		}else if(_this.model.attributes.openvpn=="1" &&
				 collection_len==0){
			app._popupViewing(POPUP_CONFIRM_TEMPLATE);
			app.popup_view.model.set({
				id: 1000,
				title: getHTMLString('POPUP_WARNING'),
				info: getHTMLString('POPUP_ADD_RULE'),
				warn: '',
				btn: getHTMLString('MAIN_BTN_OK') //OK
			});
		}else{
			app._popupViewing(POPUP_LOADING);
			app.popup_view.model.set({ str: getHTMLString('POPUP_LOADING_SAVING_SETTINGS') }); // Please wait...
			model_change_status = 1;
		}
	},
	_popup_apply: function(data){
		//console.log(this.name, "_popup_apply");
		if(data.id === 1000 || data.id === 2000){
			app._popupViewingClose();
		}
	},
	_close: function() {
		//console.log(this.name, "_close");
		var _this = this;
		_this.$el.off("_jioOnOffLabel");
		_this.$el.off("_JioInput_Edit");
	},
	render: function() {
		//console.log('render');
	}
});


var PAGE_SETTINGS_LAN2 = Backbone.View.extend({
	name: "PAGE_SETTINGS_LAN_TITLE2",
	template: ''
	+'<div class="jioMobileSection">'
	+'<div class="jioH2Mobile jioOpen">'
	+'<span class="jiotext" langid="PAGE_SETTINGS_LAN_1">LAN</span>'
	+'<span class="jioIconOpenDown"></span>'
	+'</div>'
	+'<div class="jio1SectionGrid jio1SectionGridWithInput jioH2MobileShowHide operation_mode"></div>'
	+'</div>'
	+'<div class="jioPageEndinggap"></div>',
	v_view1: null,
	v_view2: null,
	v_view3: null,
	v_view4: null,
	v_view5: null,
	events: {
		"click .jioMobileSection .jioH2Mobile": "jioH2Mobile"
	},
	preinitialize: function () {
	},
	initialize: function () {
		var _this = this;
		_this.template = _.template(_this.template);
		_this.$el.html(_this.template());
		transHTMLString(_this.$el);
		//_this.$el.show();
		_this.render();
	},
	_list_event: function(data){
		//console.log('_list_event');
		var _this = this;

	},
	_popup_apply: function(data){
		//console.log('_popup_apply');
		var _this = this;


	},
	jioH2Mobile: function (e) {
		//console.log('jioH2Mobile');
		e.preventDefault();
		//e.stopPropagation();
		var obj = Backbone.$(e.currentTarget).closest('.jioMobileSection');
		obj.find('.jioH2MobileShowHide').toggleClass('jioH2MobileHidden');
		obj.find('.jioH2Mobile').toggleClass('jioOpen');
	},
	render: function() {
		//console.log('render');
		var _this = this;
		_this.v_view3 = new PAGE_SETTINGS_LAN_OPERATION_MODE({ el: Backbone.$('.operation_mode', _this.$el) });

	}
});

