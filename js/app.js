angular.module('app', ['ionic', 'angularCharts'])

//INITIALIZATION
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})


//STATE CONFIGURATION
.config(function($stateProvider, $urlRouterProvider){
    $stateProvider
    .state('splash', {
        url: '/',
        templateUrl: "splash.html",
        onEnter: function($state, $timeout) {
            $timeout(function() {
                if (window.localStorage.getItem('logged') === 'true') {
                    if (window.localStorage.getItem('authed') === 'false') {
                        $state.go('oauth');    
                    }
                    else {
                        $timeout(function() {  
                            $state.go('tabs.home.mood');
                        }, 2000);
                    }
                }
                else { $state.go('main.buttons'); }
            }, 2000);
        }
    })
    .state('main', {
        url: '/main',
        abstract: true,
        templateUrl: "main.html",
        controller: "MainCtrl"
    })
    .state('main.buttons', {
        url: '',
        views: {
            'form' : {
                templateUrl: "buttons.html",
                controller: "ButtonCtrl"
            }
        }
    })
    .state('main.signup', {
        url: "/signup",
        views: {
            'form' : {
                templateUrl: "signup.html",
                controller: "SignUpCtrl"
            }
        }
    })
    .state('main.signin', {
        url: "/signin",
        views : {
            'form' : {
                templateUrl: "signin.html",
                controller: "SignInCtrl"
                }
        }
    })
    .state('main.forgotpassword', {
      url: "/forgot-password",
      views: {
          'form' : {
              templateUrl: "forgot-password.html",
              controller: "ForgotPasswordCtrl"
          }
      }
    })
    .state('oauth', {
      url: "/oauth",
            templateUrl: "oauth.html",
                controller: "OauthCtrl"
    })
    .state('loading', {
        url: "/loading",
        templateUrl: "loading.html", 
        controller: "LoadingCtrl",
        onEnter: function($state, $timeout) {
            getFeed();
            $timeout(function() {
                $state.go('tabs.home.mood');
            }, 3000);
        }
    })
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "tabs.html"
    })
    .state('tabs.home', {
        url: "/home",
        abstract: true,
        views: {
            'home-tab': {
                templateUrl: "home.html",
                controller: 'HomeCtrl',
            }
        }
    })
    .state('tabs.home.mood', {
        url: "/mood",
        views: {
            'mood': {
                templateUrl: "mood.html",
                controller: "HomeCtrl"
            },
            'rec': {
                templateUrl: "rec.html",
                controller: 'RecCtrl'
            }
        }
    })
    .state('tabs.profile', {
        url: "/profile",
        abstract: true,
        views: {
            'profile-tab': {
                templateUrl: "profile.html",
                controller: "LogOutCtrl"
            }
        }
    })
    .state('tabs.profile.chart', {
        url: "",
        views: {
            'chart': {
                templateUrl: "chart.html",
                controller: "ChartCtrl"
            }
        }
    })
    .state('tabs.more', {
        url: "/more",
        views: {
            'more-tab': {
                templateUrl: "more.html",
                controller: "MoreCtrl"
            }
        }
    });
    $urlRouterProvider.otherwise("/");
})

//CONTROLLERS       
.controller('LogOutCtrl', function($scope, $state) {
        $scope.logout = function() {
        $.ajax({
            url:'http://114.215.210.127/logout/', 
            type: "GET",
            success: function(data){
                window.localStorage.setItem('logged', 'false');
                $state.go("main.buttons");
            }
       });
    };
})

.controller('MainCtrl', function($scope, $rootScope) {
    var images = ['background.png', 'background2.png', 'background3.png', 'background4.png', 'background5.png', 'background6.png', 'background7.png', 'background8.png', 'background9.png'];
    // get random background each time the page is opened
    $scope.img = images[Math.floor(Math.random() * images.length)];
    $rootScope.randomBackground = $scope.img;
})

.controller('ButtonCtrl', function($scope, $state) {
    $scope.signup = function() {
        $state.go('main.signup');
    };
    $scope.signin = function() {
        $state.go('main.signin');
    };
})

.controller('SignUpCtrl', function($scope, $state, $ionicPopup) {
    $scope.signup = {
        username: '',
        password: '',
        email: ''
    };
    $scope.submit = function(signup) {
        $('#error').empty();
        $scope.usernameMsg = '';
        $scope.emailMsg = '';
        $scope.passwordMsg = '';
        if (!signup.username) {
            $scope.usernameMsg = 'Username Required';
        }
        if (!signup.password) {
            $scope.passwordMsg = 'Password Required';
        }
        if (!signup.email) {
            if (signup.email==='') {
                $scope.emailMsg = 'Email Requied';
            }
            else {
                $scope.emailMsg = 'Invalid Email';
            }
        }
        else {
            $.ajax({
                url: "http://114.215.210.127/signup/",
                type: "POST",
                data: {username: signup.username,
                       password: signup.password,
                       email: signup.email},
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function(result, textStatus, xhr) {
                    window.localStorage.setItem('csrftoken', xhr.getResponseHeader('csrftoken'));
                    window.localStorage.setItem('logged', 'true');
                    $state.go('oauth');
                },
                error: function(xhr, textStatus, errorThrown) {
                    if (JSON.parse(xhr.responseText).code === "1001") {
                        $('#error').html('<p class="text-center" style="color:#ef4e3a;">Please choose a different username</p>');
                    }
                }
            });
        }
    };
})

.controller('SignInCtrl', function($scope, $state, $ionicPopup, $timeout) {
    $scope.user = {
        username: '',
        password: ''
    };
    $scope.submit = function(user) {
        $('#error').empty();
        $scope.usernameMsg = '';
        $scope.passwordMsg = '';
        if (!user.username) {
            $scope.usernameMsg = 'Username Required';
        }
        if (!user.password) {
            $scope.passwordMsg = 'Password Required';
        }
        else {
            $.ajax({
                url: "http://114.215.210.127/signin/",
                type: "POST",
                data: {username: user.username,
                       password: user.password},
                dataType: "json",
                success: function(result, textStatus, xhr) {
                    window.localStorage.setItem('csrftoken', xhr.getResponseHeader('csrftoken'));
                    window.localStorage.setItem('logged', 'true');
                    $.ajax({
                        url: "http://114.215.210.127/vtoken/",
                        type: "GET",
                        dataType: "json",
                        success: function(result, textStatus, xhr) {
                            var status = result;
                            if (status.expired === "false") {
                                $state.go('loading');
                                window.localStorage.setItem('authed', 'true');
                                getFeed();
                            }
                            else if (status.expired === "none" ) {
                                window.localStorage.setItem('authed', 'false');
                                var alertNoConnect = $ionicPopup.alert({
                                    title: '没有连接',
                                    template: '你还没有链接你的账户。请链接后享受心情V！'
                                });
                                alertNoConnect.then(function(result) {
                                    $state.go('oauth');
                                });
                            }
                            else if (status.expired === "true" ) {
                                window.localStorage.setItem('authed', 'false');
                                var alertExpired = $ionicPopup.alert({
                                    title: 'Token过期',
                                    template: '你与上一次链接账户有一段时间了。请重新链接继续享受心情V！'
                                });
                                alertExpired.then(function(result) {
                                    $state.go('oauth');
                                });
                            }
                        },
                        error: function(xhr, textStatus, errorThrow) {
                            var error = JSON.parse(xhr.responseText);
                        }
                    });
                },
                error: function(xhr, textStatus, errorThrown) {
                    if (JSON.parse(xhr.responseText).code === "1002") {
                        $('#error').html('<p class="text-center" style="color:#ef4e3a;">Invalid password/username combination</p>');
                    }
                }
            });
        }
    };
})

.controller('ForgotPasswordCtrl', function($scope) {
    $scope.user = {
        email: ''
    };
    $scope.submit = function(user) {
        $scope.emailReq = '';
        if (!user.email) {
            $scope.emailReq = 'Email Required';
        }
        // send email TO BE IMPLEMENTED
    };
})

.controller('OauthCtrl', function($scope, $state, $timeout, $ionicLoading, $rootScope) {
    // same random background from main page
    $scope.img = $rootScope.randomBackground;
    // main function from cordova.oauth2.js
    $scope.oauth2_connect = function() {
        $.oauth2({
        auth_url: 'https://api.weibo.com/oauth2/authorize',       
            // required
        response_type: 'code',                                    
            // required - "code"/"token"
        token_url: 'https://api.weibo.com/oauth2/access_token',   
            // required if response_type = 'code'
        logout_url: 'http://weibo.com/logout.php',                
            // recommended if available
        client_id: '625978569',                                   
            // required
        client_secret: '22eb5a722714c42445392531c36e9881',        
            // required if response_type = 'code'
        redirect_uri: 'https://api.weibo.com/oauth2/default.html',
            // required - some dummy url
        other_params: {}                                          
            // optional params object
      }, function(token, expire, remind, uid){
        // do something with token or response
          window.localStorage.setItem("access_token", token);
          window.localStorage.setItem("expires_in", expire);
          window.localStorage.setItem("remind_in", remind);
          window.localStorage.setItem("uid", uid);
        // post information to server side
          postToServer();
          $state.go('loading');
      }, function(error){
            $ionicLoading.show({
                template: '绑定失败！' 
            });
            $timeout(function() {
                $ionicLoading.hide();                
            },3000);
          });
    };
})

.controller('LoadingCtrl', function($scope, $ionicSlideBoxDelegate, $timeout) {
    // Called each time the slide changes
    $scope.slideChanged = function(index) {
        $scope.slideIndex = index;
    };
})

.controller('HomeCtrl', function($scope, $state, $http, $timeout) {
    var mood = window.localStorage.getItem('mood');
    if (mood === "happy") {
        $scope.mood = {
            'banner': 'happy',
            'imageUrl': 'img/happy-small.png',
            'message': '今天心情不错，读个笑话更加开心一下吧~'
        };
    }
    else if (mood === "sad") {
        $scope.mood = {
            'banner': 'sad',
            'imageUrl': 'img/cry-small.png',
            'message': '不要伤心了，读个笑话缓解心情吧~'
        };
    }
    else if (mood === "unknown") {
        $scope.mood = {
            'banner': 'shy',
            'imageUrl': 'img/shy-small.png',
            'message': '欢喜的心情与身边的人好好分享~'
        };
    }
    $scope.doRefresh = function() {
        $http({
            method: 'GET',
            url: 'http://114.215.210.127/feed/',
            responseType: "json"}).
            success(function(data, textStatus, headers, config) {
                window.localStorage.setItem('mood', data.mood);
                $state.go($state.current, {}, {reload: true});
                $scope.$broadcast('scroll.refreshComplete');
            }).
            error(function(data, status, headers, config) {
                if (data.code === "1003") {
                    window.localStorage.setItem('authed', 'false');
                    var alertExpired = $ionicPopup.alert({
                        title: 'Token过期',
                        template: '你与上一次链接账户有一段时间了。请重新链接继续享受心情V！'
                    });
                    alertExpired.then(function(result) {
                        $state.go('oauth');
                    });
                }
            });
        };
})

.controller('RecCtrl', function($state, $scope, $http, $ionicPopup, $timeout, $ionicLoading) {
    $scope.rec = window.localStorage.getItem('content');
    $scope.getNew = function() {
        $http({
            method: 'GET',
            url: 'http://114.215.210.127/feed/',
            responseType: "json"}).
            success(function(data, textStatus, headers, config) {
                if (data.id === window.localStorage.getItem('id')) {
                    $('#no-more').html('<p class="padding-top text-center">更新微博取到更多笑话!</p>');
                }
                else {
                    window.localStorage.setItem('content', data.content);
                    window.localStorage.setItem('type', data.type);
                    window.localStorage.setItem('id', data.id);
                    window.localStorage.setItem('mood', data.mood);
                    $scope.rec = window.localStorage.getItem('content');
                }
            }).
            error(function(data, status, headers, config) {
                if (data.code === "1003") {
                    window.localStorage.setItem('authed', 'false');
                    var alertExpired = $ionicPopup.alert({
                        title: 'Token过期',
                        template: '你与上一次链接账户有一段时间了。请重新链接继续享受心情V！'
                    });
                    alertExpired.then(function(result) {
                        $state.go('oauth');
                    });
                }
            });
    };

    $scope.status = '心情V:"'+$scope.rec+'"';
    $scope.share = function() {
        $scope.status = '心情V:"'+$scope.rec+'"';
        var sharePopup = $ionicPopup.show({
            title: '分享',
            templateUrl: 'share.html',
            buttons: [{
                text: '发布',
                type: 'button-positive',
                onTap: function() {
                    $.ajax({
                        url: "https://api.weibo.com/2/statuses/update.json",
                        type: "POST",
                        dataType: "json",
                        data: { access_token: window.localStorage.getItem('access_token'),
                            status: $scope.status },
                        success: function() {
                           $ionicLoading.show({
                                template: '分享成功！' 
                            });
                            $timeout(function() {
                                $ionicLoading.hide();                
                            },2000);
                        },
                        error: function() { 
                            $ionicLoading.show({
                                template: '分享失败！' 
                            });
                            $timeout(function() {
                                $ionicLoading.hide();                
                            },2000); 
                        }
                    });
                },
            }, {
                text: '取消',
                type: 'button-stable'
            }]
        });
    };
})

/*
 * Chart produced with animations using Angular-Charts.
 */
.controller('ChartCtrl', function($state, $scope, $http) {
    $scope.chartType = 'line';
    $scope.config = {
        title: '开心指数',
        tooltips: true,
        labels: false,
        legend: {
            display: true,
            position: 'left'
        },
        lineLegend: 'lineEnd'
    };
    $scope.data = { 
        "series": [
            "心情"
        ],
        "data": [
            {"x": "大前天", "y": [6]},
            {"x": "前天", "y": [7]},
            {"x": "昨天", "y": [2]},
            {"x": "今天", "y": [9]},
        ]
    };
})
            
.controller('MoreCtrl', function($scope, $state) {
    $scope.logout = function() {
        $.ajax({
            url:"http://114.215.210.127/logout/",
            type: "GET",
            success: function(data){
                $state.go('main.buttons');
            }
       });
    };
    $scope.revoke = function() {
            $.ajax({
                   url: "https://api.weibo.com/oauth2/revokeoauth2",
                   type: "POST",
                   dataType: "json",
                   data: {access_token: window.localStorage.getItem("access_token")},
                   success: function(data) {
                        $.ajax({
                            beforeSend: function(xhr, settings) {
                                xhr.setRequestHeader("X-CSRFToken", window.localStorage.getItem('csrftoken'));
                            },
                            url: "http://114.215.210.127/token/",
                            type: "DELETE",
                            success: function(data) {
                               $state.go('oauth');
                            }
                        });
                   }
                   });
            };
});

/*
 * check the state of the token on this account, return appropriate feed back to user
 */
function checkToken($scope, $state, $ionicPopup) {
    
}

function getFeed() {
    $.ajax({
        url: "http://114.215.210.127/feed/",
        type: "GET",
        dataType: "json",
        success: function(result, textStatus, xhr) {
            window.localStorage.setItem('content', result.content);
            window.localStorage.setItem('type', result.type);
            window.localStorage.setItem('id', result.id);
            window.localStorage.setItem('mood', result.mood);
        },
        error: function(xhr, textStatus, errorThrown) {
            if (JSON.parse(xhr.responseText).code === "1003") {
                    window.localStorage.setItem('authed', 'false');
                    var alertExpired = $ionicPopup.alert({
                        title: 'Token过期',
                        template: '你与上一次链接账户有一段时间了。请重新链接继续享受心情V！'
                    });
                    alertExpired.then(function(result) {
                        $state.go('oauth');
                    });
            }
        }
    });
}

/* 
 * post user information to server-side in json format
 * access_token, remind_in, expires_in, uid
 */
function postToServer() {
    $.ajax({
        beforeSend: function(xhr, settings) {
            xhr.setRequestHeader("X-CSRFToken", window.localStorage.getItem('csrftoken'));
        },
        url: "http://114.215.210.127/token/",
        type: "POST",
        data: {access_token: window.localStorage.getItem("access_token"),
               remind_in: window.localStorage.getItem("remind_in"),
               expires_in: window.localStorage.getItem("expires_in"),
               uid: window.localStorage.getItem("uid")},
        dataType: "json",
        success: function(result, textStatus, xhr) {
            window.localStorage.setItem('authed', 'true');
        },
        error: function(xhr, textStatus, error) {
            //post to server failed
        }
    });
}