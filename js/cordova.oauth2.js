/*
 *   Oauth2 user authentication with Weibo
 *   
 *   $.oauth2(options, successCallback, errorCallback);
 *
 *   $.oauth2({
 *        auth_url: '',         // required
 *        response_type: '',    // required
 *        token_url: '',        // required if response_type = 'code'
 *        logout_url: '',       // recommended if available
 *        client_id: '',        // required
 *        client_secret: '',    // required if response_type = 'code'
 *        redirect_uri: '',     // required - some dummy url
 *        other_params: {}      // optional params object for scope, state, display...
 *    }, function(token, response){
 *          // do something with token and response
 *    }, function(error){
 *          // do something with error
 *    });
 */

(function($){            
    $.oauth2 = function (options, successCallback, errorCallback) {
        
        // checks if all the required oauth2 params are defined
        var checkOauth2Params = function(options){
            var missing = "";
            if(!options.client_id) {missing += " client_id";}
            if(!options.auth_url) {missing += " auth_url";}
            if(!options.response_type) {missing += " response_type";}
            if(!options.client_secret && options.response_type == "code") {missing += " client_secret";}
            if(!options.token_url && options.response_type == "code") {missing += " token_url";}
            if(!options.redirect_uri) {missing += " redirect_uri";}  
            if(missing){
                var error_msg = "Oauth2 parameters missing:" + missing;
                errorCallback(error_msg, {error:error_msg});
                return false;
            } else {
                return true;
            }
        };
 
 var closed = function() {
 errorCallBack('OAuth Cancelled!', '');
 };
        // performs logout after oauth redirect
        var oauth2Logout = function(options){
            if(options.logout_url){
                var s = document.createElement("script");
                s.src = options.logout_url;
                $("head").append(s);
            }     
        };
        
        // String prototype to parse and get url params
        String.prototype.getParam = function( str ){
            str = str.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
            var regex = new RegExp( "[\\?&]*"+str+"=([^&#]*)" );	
            var results = regex.exec( this );
            if( results === null ){
                return "";
            } else {
                return results[1];
            }
        };        
        
        // if params missing return
        if(!checkOauth2Params(options)) return;
        console.log(options.redirect_uri);
        // build oauth login url
        var paramObj = {
            client_id: options.client_id,
            response_type: options.response_type,
            redirect_uri: options.redirect_uri
        };
        $.extend(paramObj, options.other_params);
        var login_url = options.auth_url + '?' + $.param(paramObj);

        // open Cordova inapp-browser with login url
        var loginWindow = window.open(login_url, '_blank', 'location=yes');
        
        // add eventListener for if window closed
        //loginWindow.addEventListener('exit', closed());
        
        // check if redirect url has code, access_token or error 
        $(loginWindow).on('loadstart', function(e) {
            var url = e.originalEvent.url;
            
            // if authorization code method check for code/error in url param
            if(options.response_type == "code"){
                url = url.split("#")[0];
                var code = url.getParam("code");
                var error = url.getParam("error");

                if (code || error){
                    //loginWindow.removeEventListener('exit', closed());
                    loginWindow.close();
                    //oauth2Logout(options);
                    if (code) {
                        $.ajax({
                            url: options.token_url,
                            data: {client_id:options.client_id, 
                                   client_secret:options.client_secret,
                                   grant_type:"authorization_code", 
                                   redirect_uri:options.redirect_uri, 
                                   code:code},
                            type: 'POST',
                            success: function(data){                                
                                var json = jQuery.parseJSON(data);
                                var access_token = json.access_token;
                                var expires_in = json.expires_in;
                                var remind_in = json.remind_in;
                                var uid = json.uid;
                                console.log(uid);
                                successCallback(access_token, expires_in, remind_in, uid);
                            },
                            error: function(error){
                                errorCallback(error, error);
                            }
                        });
                    } else if (error) {
                        errorCallback(error, url.split("?")[1]);
                    }
                }
            // if implicit method check for acces_token/error in url hash fragment
            } else if(options.response_type == "token") {
                var access_token = url.split("access_token=")[1];
                var error = url.split("error=")[1];
                if(access_token || error){
                    loginWindow.close();
                    oauth2Logout(options);
                    if(access_token){
                        successCallback(access_token, url.split("#")[1]);
                    } else if(error){
                        errorCallback(error, url.split("#")[1]);
                    }                   
                }
            }
        });
    }; 
}(jQuery));