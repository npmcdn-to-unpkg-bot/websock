'use strict'; 
angular.module('myApp', [
  'ui.router',
  'ngAnimate', 
  'toastr'])

.config(function ($stateProvider, $urlRouterProvider) {

  $stateProvider
  // .state('host', {
  //   url: '/',
  //   templateUrl: 'choose-host.html'
  // })
  .state('chat', {
    url: '/chat',
    templateUrl: 'chat.html',
    controller: SubController
  })
  .state('name', {
    url: '/name',
    templateUrl: 'choose-name.html',
    controller: SubController
  })

  $urlRouterProvider.otherwise('/name')
})
.controller('MainController', MainController)
.controller('SubController', SubController)

function SubController ($rootScope, $state) {
  if ($rootScope.socket === undefined) {
    setTimeout(()=>{$state.go('name')},0);
  };
}

function MainController ($rootScope, $scope, $state, toastr) {
  var clientID;
  $rootScope.socket;
  $scope.msgs =[];

  $scope.slider = function (argument) {
    $(function(){
      $(".chat-room").niceScroll();
      $(".chat-box").niceScroll();
      var nice = $(".chat-box").getNiceScroll();
      console.log(nice);
    })
  }
  // var msg = {
  //   data: ['nghia', 'hieu', 'quan', 'kha', 'truc', 'thuc', 'ta', 'si']
  // }
  // $scope.msgs = [];
  // $scope.users = {};
  // for (var i = 0; i < msg.data.length; i++) {
  //   $scope.users[msg.data[i]] = {
  //     id: msg.data[i],
  //     link: 'https://invatar0.appspot.com/svg/{{id}}.jpg?s=50'
  //       .replace('{{id}}', msg.data[i].slice(0,2))
  //   }
  // };

  // msg = {
  //   text: 'wow',
  //   id: 'nghia',
  //   user: $scope.users.nghia
  // }

  // for (var i = 0; i < 8; i++) {
  //   $scope.msgs.push(msg)
  // };

  $scope.connect = function (ip, port) {
    var msgs = $scope.msgs;
    $scope.users = {};
    var url = 'ws://54.88.226.182'
      // .replace('{{ip}}', ip || 'localhost')
      // .replace('{{port}}', port || 3000);

    try {
      $rootScope.socket = new WebSocket(url);
    } catch (e) {
      console.log(e);
      toastr.error('Seems like you are connecting to a wrong host', 'Connection error');
      return ;
    }

    $rootScope.socket.onopen = function () {
      toastr.success('Connected');
      $state.go('name');
      console.log('socket is opened');

      var msg = {
        type: 'userlist',
        date: Date.now()
      };
      $rootScope.socket.send(JSON.stringify(msg));
    };

    $rootScope.socket.onmessage = function(event) {
      var msg = JSON.parse(event.data);
      var time = new Date(msg.date);
      var timeStr = time.toLocaleTimeString();

      switch(msg.type) {
        case "register":
        clientID = msg.id;
        $state.go('chat');
        toastr.success('Register successfully!');
        break;
        case "system":
        break;
        case "message":
        $scope.$apply(function() {
          if (msg.id === clientID) {
            msg.right = true;
          };
          msg.user = $scope.users[msg.id];
          msgs.push(msg);

          $(".chat-box").getNiceScroll().resize()
          var nice = $(".chat-box").getNiceScroll();
          $(".chat-box").getNiceScroll(0).doScrollTop(1000000, 1000);
        });
        break;
        case "rejectusername":
        toastr.error('This name has been taken! Please choose another one');
        setTimeout(()=>{$state.go('name')},0);
        break;
        case "userlist":
        $scope.$apply(function() {
          $scope.users = {};
          for (var i = 0; i < msg.data.length; i++) {
            $scope.users[msg.data[i]] = {
              id: msg.data[i],
              link: 'https://invatar0.appspot.com/svg/{{id}}.jpg?s=50'
                .replace('{{id}}', msg.data[i].slice(0,2))
            }
          };
        });
        break;
      }
    }

    $rootScope.socket.onerror = function (error) {
      console.log('WebSocket error: ' + error);
      setTimeout(()=>{$state.go('name')},0);
    };

    $rootScope.socket.onclose = function (argument) {
      console.log('socket is closed');
    }

    $scope.send = function sendText(msg) {
      if (!msg) {return };
      // Construct a msg object containing the data the server needs to process the message from the chat client.
      var msg = {
        type: "message",
        text: msg,
        id:   clientID,
        date: Date.now()
      };
      console.log(msg);
      // Send the msg object as a JSON-formatted string.
      $rootScope.socket.send(JSON.stringify(msg));
    }
  }

  $scope.register = function (name) {
    var msg = {
      type: 'register',
      id: name,
      date: Date.now()
    };
    $rootScope.socket.send(JSON.stringify(msg));
  }

  $scope.connect();
}