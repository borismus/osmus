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
