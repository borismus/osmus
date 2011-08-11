# Building a game with Node.js

Idea: same game logic runs on client and server!

# Shared JS modules

Module loaders are a mess. There's CommonJS, RequireJS, node.js systems
etc. If you want to share code between client and server (which is one
of the big wins of JS on the server), without a module loader, you can
use this pattern:

    (function(exports) {

    var MyClass = function() { /* ... */ };
    var myObject = {};

    exports.MyClass = MyClass;
    exports.myObject = MyObject;

    })(typeof global === "undefined" ? window : exports);

This way, node.js `require()` will be happy, and you can also safely
include the file in a `<script>` tag without polluting your namespace.

# Network synchronization

Initial strategy:
* Since game engine is available both in client and server, just run
  both separately. On occasion, synchronize the client to the server,
  but avoid ever dumping the whole state (except for the initial load).
* Started with using requestAnimationFrame on client, and interval on
  server.
* **Problem**: This leads to client/server desync very quickly.
    * Example: two different tick rates leading to drastic differences

Revision (sync client and server):
* Ok, keep both client and server state synchronized to the same ticks,
  but decoulpe rendering on the client (still using rAF).
* **Problem**: server and client are still out of sync.
  setInterval/setTimeout are very unreliable.

Revision (better sync via custom timer):

    Game.prototype.updateEvery = function(interval) {
      var lastUpdate = new Date();
      var ctx = this;
      return setInterval(function() {
        var date = new Date();
        if (date - lastUpdate >= interval) {
          ctx.update(date);
          lastUpdate = date;
        }
      }, 0);
    };

* Ok make a custom timer that fires based on date and not timeout, using
  setInterval(function() {...}, 1), and by checking dates.
* **Problem**: this still leads to sync issues, since function doesn't
  actually fire every ms.

Revision (fix a bug):
* Ok, so we can't avoid client and server going out of sync, so need to
  send data in periodic updates, to re-sync the two.
* This change seems to work:

      lastUpdate += interval;

* We go out of sync when the player does an input.
* **Problem**: When a client does input, that's sent to the server. Server
  redistributes that input to other clients. Then each client modifies
  their game state at their own discretion.

Revision (retroactive updates):
* All updates (leave, join, shoot) bear a timestamp from the server
* Note: game state can't rewind! But you can keep an older version of
  the game around, and forward it.
* **Problem**: This seems rather hard, and also various timing
  inaccuracies will probably accrue to be problematic anyway.

Revision (simple dead reckoning):
* At key moments, update every client with the truth.
