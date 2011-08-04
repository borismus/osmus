Multiplayer HTML5 Osmos

# TODO

# Running

* Install Node
* Run `npm install socket.io`
* Run `node server/server.js`
* Open client/index.html - for example on Mac `open client/index.html`
* Profit

Or actually don't profit since Chrome Dev Channel breaks WebSockets right now.  So
get an older version - for example, this worked for me:
http://build.chromium.org/f/chromium/snapshots/Mac/87978/

## First release

* Mouse input handling (DONE)
* Victory conditions
* Basic UI and instructions
  * Who is playing now?
  * How many people are watching?
* Switch to require.js in browser and separate game.js into components
* Fixed up game mechanics
* Better sync (act on server timestamp)

## Future

* UI Polish
* Make the game look nice!
* iPad support
* iPhone support?
* Resizing viewports?
* Multiple rooms?

# Networking

When a client connects, send them the current state of the game.

Periodically (ie. very often), send each client updates from other
players.

Basic idea: convey current game state to new clients, then convey
changes in game state (ie. player movements). Also, sync overall state
periodically (but via ticks).

Both client and server compute new game state. Server occasionally sends
tick to client for sync purposes. Also, server sends updated players
state as they do stuff.

## Client -> server messaging

### shoot: Player {X} shot blob in {direction}

{
  type: 'shoot',
  player_id: 1,
  direction: 315
}

### join: Player {X} joined the game

{
  type: 'join',
  player_id: 1
}

## Server -> client messaging

### state: Here is the state of the world

{
  type: 'state',
  blobs: {
    33: {
      x: 100,
      y: 40,
      angle: 45,
      speed: 5
      radius: 10,
    }, ...
  },
  players: {
    1: {
      name: "borismus"
      x: 300,
      y: 240,
      angle: 185,
      radius: 20
      speed: 3,
    }, ...
  }
}


### update: Who shot and in what direction

{
  type: 'update',
  shoot: {
    1: {
      angle: 35,
      time: 974097379
    }, ...
  }
  joined: {
    2: {
      time: 9744400184
    }, ...
  },
  left: {
    3: {
      time: 9744400384
    }, ...
  }
}

### time: This is the current game time (sent periodically)

{
  type: 'time',
  time: 9947098798
}

# Time warp

What happens if a sync from the server is way off the mark?

* If it's further than a delta, jump to new state and apologize
* If it's within a delta, do warping (speed or slow client time to meet
  the server time)

# Game engine

The same game engine runs on both server and client. Even the code is
the same because node.js is running on the server.

Game engine is a state machine. Basically, given a time, it needs to be
able to produce the state of all of the objects. This way, if the server
and client are out of sync when the server sends a synchronization
command, the client can time warp a little, and catch up seamlessly.

# Renderer

The renderer is pluggable. That way I can experiment with tradeoffs of
DOM, SVG, Canvas and WebGL.

# Using CSS3 Transitions/Transforms

Simulate osmos object look
- objects are basically rotating circular images, with pulsating gradient on top
- strategy:
    circular image inside

- actually animations running inside each circle.
