gateway
=========

entry point to the colu enviorment, it's also a job queue consumer and holds the socket connections
for socket.io on all the clients.

**Under development**

**TODO:**
* Add IOS/Android push
* Route all traffic through gateway and proxy to servers



Installation
----------
```
npm install gateway
```

reading messages published to pubsub
----------

**User connected message**
```javascript
var pubsub = require('fw_pubsub')
var prod = new pubsub.Producer('http://localhost')
prod.create()
prod.on('message', function(name, data, remoteId){
  if(name === 'userConnected') {
    console.log('registering userid ', data.userId)
  }
})
```

**Without cluster:**
```javascript


```

messages gateway accepts
----------
from inside the callback when a new user message is recived:

```javascript
 prod.publish('addToRooms', ['room1', 'room2'], remoteId)
```