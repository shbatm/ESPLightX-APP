// UDP Network Provider Functions

function sendTo(data, addr, port) {
  chrome.sockets.udp.create(function(createInfo) {
    chrome.sockets.udp.bind(createInfo.socketId, '0.0.0.0', 0, function(result) {
      chrome.sockets.udp.send(createInfo.socketId, stringToArrayBuffer(data), addr, port, function(result) {
        if (result < 0) {
          console.log('send fail: ' + result);
          chrome.sockets.udp.close(createInfo.socketId);
        } else {
          console.log('sendTo: success ' + port);
          chrome.sockets.udp.close(createInfo.socketId);
        }
      });
    });
  });
}

function stringToArrayBuffer(string) {
  // UTF-16LE
  var buf = new ArrayBuffer(string.length * 2);
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = string.length; i < strLen; i++) {
    bufView[i] = string.charCodeAt(i);
  }
  return buf;
}

function str2ab(str) {
    var encoder = new TextEncoder('utf-8');
    return encoder.encode(str).buffer;
}

function sendBroadcast(data, addr, port) {
  chrome.sockets.udp.create(function(createInfo) {
    chrome.sockets.udp.bind(createInfo.socketId, '0.0.0.0', port, function(result) {
      chrome.sockets.udp.setBroadcast(createInfo.socketId, true, function(result){
        chrome.sockets.udp.send(createInfo.socketId, str2ab(data), addr, port, function(result) {
          if (result < 0) {
            console.log('send fail: ' + result);
            chrome.sockets.udp.close(createInfo.socketId);
          } else {
            console.log('sendTo: success ' + port);
            chrome.sockets.udp.close(createInfo.socketId);
          }
        });
      });
    });
  });
}
