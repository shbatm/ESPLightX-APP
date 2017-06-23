/* ------------------------------- */
/* -------  SYSTEM LOADING ------- */
/* ------------------------------- */
ons.bootstrap('myApp', ['color.picker.core'])
  .controller('AppController', function($scope) {
    this.pushes = 0;
    this.pops = 0;
  });

ons.ready(function() {
    console.log("Onsen UI is ready!");
});

/* ------------------------------------------ */
/* -------  MAIN PAGE / CONFIG STRING ------- */
/* ------------------------------------------ */
angular.module('myApp').filter('log', function() {
  return function(input) {
      // position will be between 0 and 100
      var minp = 0;
      var maxp = 100;

      // The result should be between 100 an 10000000
      var minv = Math.log(100);
      var maxv = Math.log(10000);

      // calculate adjustment factor
      var scale = (maxv-minv) / (maxp-minp);

      return Math.floor(Math.exp(minv + scale*(input-minp)));
    };
});

angular.module('myApp').filter('eye', function() {
  return function(input) {
      if (input == 0) {
        return 'Full';
      }
      else 
      {
        return input + '%';
      }
    };
});

angular.module('myApp').filter('espInUse', function() {
  return function(input) {
      if (input == '' | input === undefined) {
        return "All Available";
      }
      else 
      {
        return input;
      }
    };
});

angular.module('myApp').service('colorService', function() {
  // private variable
  var _dataObj = { id:null, property:null, initialColor:{ red: 255, green: 0, blue: 0, alpha: 1 }, selectedColor:null, allowRandom:false };

  // public API
  this.dataObj = _dataObj;
});

angular.module('myApp')
.controller('cmd_string', function($rootScope, $scope, $timeout, logFilter, colorService){

$scope.saved = localStorage.getItem('esplist');
$scope.esplist = null;
$scope.lastEsp = -1;
$scope.espDropdownVisible = false;
$scope.live = false;
$scope.allowDigital = false;
$scope.lastCmdString = '';
$scope.colorSelect = colorService.dataObj;

// Initial Colors
$scope.effect_0 = { effect:0, color:'#ff0000' };
$scope.effect_3 = { effect:3, color:'#ff0000' };
$scope.effect_4 = { effect:4, color_1:'#ff0000', color_2:'#000000', color_3:'#000000', color_4:'#000000', color_5:'#000000' };
$scope.effect_5 = { effect:5, color:'#f7ca42' };


$scope.lastEsp = (localStorage.getItem('lastesp')!==null) ? parseInt(localStorage.getItem('lastesp')) : -1;
localStorage.setItem('lastesp', $scope.lastEsp);

$scope.showCS = function(id, property, allowRandom) {
  $scope.colorSelect.id = id;
  $scope.colorSelect.property = property;
  $scope.colorSelect.allowRandom = allowRandom;
  _initColor = hexToRgb($scope[id][property]);
  $scope.colorSelect.initialColor = {red: _initColor.r, green: _initColor.g, blue: _initColor.b, alpha: 1};
  navi.pushPage('chooseColor.html');
};

$scope.killLS = function() { 
  console.log("Clearing Local localStorage");
  localStorage.clear(); 
};

$scope.readEspList = function() {
  $scope.saved = localStorage.getItem('esplist');
  if (localStorage.getItem('esplist')!==null) {
    $scope.esplist = JSON.parse($scope.saved);
    if ($scope.lastEsp != -1) {
      if ($scope.esplist[$scope.lastEsp].disabled) {
        $scope.lastEsp = -1;
      }
    }
  } else {
    $scope.navi.pushPage('manage.html');
  }
};

$scope.toggleEspDropdown = function() {
  $scope.espDropdownVisible = !$scope.espDropdownVisible;
  if ($scope.espDropdownVisible) {
    $scope.liveBtn.disabled = true;
    $scope.goLive(false);
  } else {
    $scope.liveBtn.disabled = false;
  }
};

$scope.selectEsp = function(index) {
  $scope.lastEsp = (index == -1) ? -1 : $scope.esplist.findIndex(x => x.$$hashKey==index.$$hashKey);
  $scope.toggleEspDropdown();
  localStorage.setItem('lastesp', $scope.lastEsp);
};

$scope.itemOnLongPress = function (id) {  
	var elem = document.getElementById(id);
	// console.log('itemOnLongPress: ' + id + '; Is disabled? ' + elem.disabled);
	var idSplit = id.split(".");
	if (!elem.disabled) {
		elem.disabled = true;
		document.getElementById(id + "_cp").style.display = "none";
		document.getElementById(id + "_r").style.display = "";
		$scope[idSplit[0]][idSplit[1]] = "#0f0f0f";
	}
	else {
		elem.disabled = false;
		document.getElementById(id + "_cp").style.display = "";
		document.getElementById(id + "_r").style.display = "none";
		$scope[idSplit[0]][idSplit[1]] = $scope[idSplit[0]][idSplit[1] + "_cp"];
	}
};
$scope.itemOnTouch = function (id) { console.log('itemOnTouch: ' + id); };
$scope.itemOnTouchEnd = function (id) { 
	// console.log('itemOnTouchEnd: ' + id); 
	var idSplit = id.split(".");
	var efft = idSplit[0].split("_");
	$scope.effect = efft[1];
};
$scope.itemOnClick = function (id) { console.log('itemOnClick: ' + id); };

  $scope.htmlToRgb = function (hex) {
      return hexToRgb(hex);
  };

  $scope.correctColor = function(id, property) {
      // console.log("Color: " + $scope[id][property]);
      // console.log($scope[id][property]);
      var newColor = correctedHsl($scope[id][property]);
      $scope[id][property] = newColor.hex;
  };   

  $scope.dialogs = {};

  $scope.show = function(dlg) {
    if (!$scope.dialogs[dlg]) {
      ons.createDialog(dlg, {
        parentScope: $scope
      }).then(function(dialog) {
        $scope.dialogs[dlg] = dialog;
        dialog.show();
      });
    } else {
      $scope.dialogs[dlg].show();
    }
  }
 
  $scope.getCmdString = function(index) {  
    var pin = '0000';
    if ($scope.esplist != null) {
      if (index == -1) {
        var first_avail = 0;
        var first_found = false;
        var digital = true;
        angular.forEach($scope.esplist, function(esp){
          if (!first_found && !esp.disabled) {
            first_avail = $scope.esplist.findIndex(x => x.$$hashKey==esp.$$hashKey);
            first_found = true;
          }
          if (!esp.disabled) {
            digital = digital && esp.digital;
          }
        });
        pin = $scope.esplist[first_avail].pin;
        if ($scope.allowDigital && !digital && ($scope.effect > 1)) {
          ons.notification.alert({ message: "One of the controllers does not support this effect!" });
          $scope.effect = 0;          
        }

        $scope.allowDigital = digital;
      } else {
        pin = $scope.esplist[$scope.lastEsp].pin;
        $scope.allowDigital = $scope.esplist[$scope.lastEsp].digital;
      }
    }

    var str = '?pin=' + (typeof pin != 'undefined' ? pin : '0000') + '&effect=' + 
              $scope.effect + '&brightness=' + $scope.brightness + '&var0=';

    switch($scope.effect) {
      case -1:
      case '-1':
          str = str.replace(/effect=-1/g, "effect=0") + '0&var1=0&var2=0';
          break;
      case 0:
      case '0':
          var rgb = $scope.htmlToRgb($scope.effect_0.color);
          str += rgb.r + '&var1=' + rgb.g + '&var2=' + rgb.b;
          break;
      case '3':
          str += logFilter($scope.speed); 
          str += '&var1=' + $scope.eye_width;
          str += ($scope.eye_width!=0) ? '&var2=' + $scope.eye_center : '&var2=0';
          str += '&var3=' + correctedHsl($scope.effect_3.color).hue.toFixed(0);
          break;
      case '4':
          str += logFilter($scope.speed) + '&var1=' + $scope.tail_length + '&var2=';
          if ($scope.effect_4.direction < 3) {
            str += $scope.effect_4.direction;
          }
          else {
            str += $scope.alternate_pixels;
          }
          
          str += '&var3=' + correctedHsl($scope.effect_4.color_1).hue.toFixed(0);
          str += '&var4=' + correctedHsl($scope.effect_4.color_2).hue.toFixed(0);
          str += '&var5=' + correctedHsl($scope.effect_4.color_3).hue.toFixed(0);
          str += '&var6=' + correctedHsl($scope.effect_4.color_4).hue.toFixed(0);
          str += '&var7=' + correctedHsl($scope.effect_4.color_5).hue.toFixed(0);
          break;
      case '5':
          str += logFilter($scope.speed) + '&var1=' + '0' + '&var2=' + '0'; 
          str += '&var3=' + correctedHsl($scope.effect_5.color).hue.toFixed(0);
          break;
      default:
          str += logFilter($scope.speed) + '&var1=0&var2=0';
    }

    if ($scope.save_settings) {
      str += '&savesetting=1';
    }

    if ($scope.live && $scope.lastCmdString != str) { 
      $scope.lastCmdString = str;
      //console.log(str);

      // Send the UDP Packet
      if ($scope.esplist != null) {
        if (index == -1) {
          var str_corrected = str;
          angular.forEach($scope.esplist, function(esp){
            if (!esp.disabled) {
              str_corrected = str.replace(/\?pin=[0-9]*&/g, "?pin=" + esp.pin + "&");
              console.log("To: " + esp.ipaddr + " : " + str_corrected);
              sendBroadcast(str_corrected, esp.ipaddr, 1337);
            }
          });
        } else {
          console.log("To: " + $scope.esplist[$scope.lastEsp].ipaddr + " : " + str);
          sendBroadcast(str, $scope.esplist[$scope.lastEsp].ipaddr, 1337);
        }
      }
    }
    return str;
  };

  $scope.goLive = function(enable) {
    if (!enable && $scope.live) {
      $scope.live = false;
    } else if (enable && !$scope.live) {
      $scope.live = true;
      $scope.lastCmdString = ''; // Force a fresh command to be sent
    }
  }

  $scope.openSettings = function() {
    $scope.goLive(false);
    $scope.navi.pushPage('manage.html');
  };

  $rootScope.$on('color-picker.selected', function(ev, color) {
    $scope[$scope.colorSelect.id][$scope.colorSelect.property] = "#" + color.hex;
  });

  $rootScope.$on('color-picker.changed', function(ev, color) {
    // Live updating for effect_0.
    if ($scope.colorSelect.id == 'effect_0') {
      $scope[$scope.colorSelect.id][$scope.colorSelect.property] = "#" + color.hex;
    }
  });
})

/* ------------------------------------------- */
/* -------  ADD/MANAGE ESPLIGHTX HOSTS ------- */
/* ------------------------------------------- */

angular.module('myApp')
.controller('espfind_ctrl', function($scope){
  $scope.saved = localStorage.getItem('esplist');
  $scope.esplist = (localStorage.getItem('esplist')!==null) ? JSON.parse($scope.saved) : 
      [ {
          espname: 'ESPLightX 1',
          ipaddr: '192.168.4.1',
          pin: '1234', 
          digital: true,
          disabled: false,
          editing: false
        }, 
        {
          espname: 'ESPLightX 2',
          ipaddr: '192.168.4.1',
          pin: '1234', 
          digital: true,
          disabled: false, 
          editing: false
        } 
      ];
  localStorage.setItem('esplist', JSON.stringify($scope.esplist));

  $scope.addEsp = function() {
    $scope.esplist.push({
      espname: $scope.addDialog._scope.espName,
      ipaddr: $scope.addDialog._scope.espIp,
      pin: $scope.addDialog._scope.espPin, 
      digital: $scope.addDialog._scope.espDigital,
      disabled: false,
      editing: false
    });
    console.log($scope.addDialog._scope.espName);
    $scope.addDialog._scope.espName = ''; //clear the input after adding
    $scope.addDialog._scope.espIp = '';
    $scope.addDialog._scope.espPin = '';
    $scope.addDialog._scope.espDigital = false;

    localStorage.setItem('esplist', JSON.stringify($scope.esplist));
    $scope.addDialog.hide();
  };

  $scope.remaining = function() {
    var count = 0;
    angular.forEach($scope.esplist, function(esp){
      count += esp.disabled ? 1 : 0;
    });
    return count;
  };

  $scope.archive = function() {
    var oldesplist = $scope.esplist;
    $scope.esplist = [];
    angular.forEach(oldesplist, function(esp){
      if (!esp.disabled)
        $scope.esplist.push(esp);
    });
    localStorage.setItem('esplist', JSON.stringify($scope.esplist));
  };

  $scope.trash = function(index) {
    ons
    .notification.confirm({message: 'Are you sure you want to delete ' + $scope.esplist[index].espname + '?'})
    .then(function(result) {
      console.log(result);
      if (result == 1) { 
        $scope.esplist.splice(index, 1);
        localStorage.setItem('esplist', JSON.stringify($scope.esplist));
        $scope.$apply();
      }
    });
  };

  $scope.toggleEdit = function(index) {
    if ($scope.esplist[index].editing) {
        $scope.esplist.splice(index, 1, {
          espname: $scope.esplist[index].espname,
          ipaddr: $scope.esplist[index].ipaddr,
          pin: $scope.esplist[index].pin, 
          digital: $scope.esplist[index].digital,
          disabled: $scope.esplist[index].disabled,
          editing: false
        });
        localStorage.setItem('esplist', JSON.stringify($scope.esplist));
    } else {
      $scope.esplist[index].editing = !$scope.esplist[index].editing;
    }
  };

  $scope.toggleDisable = function(index) {
      $scope.esplist.splice(index, 1, {
        espname: $scope.esplist[index].espname,
        ipaddr: $scope.esplist[index].ipaddr,
        pin: $scope.esplist[index].pin, 
        disabled: !$scope.esplist[index].disabled,
        editing: $scope.esplist[index].editing
      });
      localStorage.setItem('esplist', JSON.stringify($scope.esplist));
  }

  $scope.addManual = function() {
    $scope.addMenu.hideItems();
  }

  $scope.dialogs = {};

  $scope.show = function(dlg) {
    if (!$scope.dialogs[dlg]) {
      ons.createDialog(dlg, {
        parentScope: $scope
      }).then(function(dialog) {
        $scope.dialogs[dlg] = dialog;
        dialog.show();
      });
    } else {
      $scope.dialogs[dlg].show();
    }
  }

  $scope.validateExit = function() {
    if ($scope.esplist.length == 0 | $scope.esplist.length == $scope.remaining()) {
      ons.notification.alert({ message: 'Please add at least one active ESPLightX!'})
    } else {
      navi.popPage();
    }
  }
});

angular.module('myApp')
.controller('addDialog_ctrl', function($scope){


});

angular.module('myApp')
.controller('chooseColor_ctrl', function($scope, $rootScope, colorService){
  var $ctrl = this;
  $scope.colorSelect = colorService.dataObj;

  $ctrl.color = {};
  $ctrl.onSelect = function(color) {
      // do smth with the color
      $ctrl.color = color;
  }

  $scope.$on('color-picker.hidden', function(ev, color) {
    console.log(ev);
    navi.popPage();
  });

  $scope.returnColor = function(color) {
    $ctrl.color = { hex:color };
    $rootScope.$broadcast('color-picker.selected', $ctrl.color);
    navi.popPage();
  };
});