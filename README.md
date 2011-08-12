Multiplayer HTML5 Osmos

# Running

* Install Node
* Run `npm install socket.io`
* Run `node server/server.js`
* Open client/index.html - for example on Mac `open client/index.html`
* Profit

Or actually don't profit since Chrome Dev Channel breaks WebSockets
right now.  So get an older version - for example, this worked for me:

http://build.chromium.org/f/chromium/snapshots/Mac/87978/

# TODO

## First release

* Mouse input handling (DONE)
* Who is playing now? (DONE)
* How many people are watching? (DONE)
* Generate randomized levels. (DONE)
* Victory conditions (one blob is bigger than the next biggest by a
  percentage) (DONE)
* Better sync
  * Decouple game progression from rendering (DONE)
  * Make game state time aware (DONE)
  * Client-server time sync
* Fix threeJS client (DONE)
* Basic audio and music w/ audio tag (DONE)
* Switch away from alerts to custom dialogs (DONE)
* Fix up game mechanics (transfer area rather than radius)

## Future

* UI Polish
* Make the game look nice!
* iPad support
* iPhone support?
* Switch to require.js in browser and separate game.js into components
* Resizing viewports?
* Support binary sockets
* Compress network format
* Multiple rooms?

# Networking

When a client connects, send them the current state of the game, as well
as timestamp on the state, and refresh rate. Client then runs the game
engine at a fixed interval. The render loop is detatched from the game
loop.

**Client action**: when the client does something (eg. shoots, disconnects),
it sends a message to the server. Server then rebroadcasts the message
with a timestamp. When clients recv the message that some player shot,
they have to act on it given a previously saved state.

Note that the game state progresses only one way (can't go from t1 to
t0). So we need to maintain an older version of the state in case we get
an event in the past. If we get an event with an older timestamp, we have
several options:

1. "Rewind" to that last saved position, progress up to the desired
timestamp, act on the message, and then fast forward to catch up to the
current time.
2. Simple but inefficient: poll the server for the new state.

**Tick state**: server periodically pings all clients with the current
time to make sure that everyone's on the same page. If the client's
clock is a certain amount out of sync, re-request server state.

**State**: keep track of when the state was updated, as well as objects
in the world.

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
