#Finland yard

## Set up

You need nodejs installed and then just install dependencies

```
npm install
```

## Development

Start the game and run timetable proxy by

```
npm run dev+proxy
```

Run tests

```
npm run test
```

## Architecture

Player can be implemented by putting a js file with following content to `src/actors/[NAME].js`

```
var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var Actions = require('../engine/Actions.js');

ActorBridge.registerActor('police', 'sipowitch', 'JNS', function(clockIs, context, actor) {
    return Actions.idle();
});
```

`engine/FyEngine.js`

Contains the main game loop iteration function. Takes drawing and state transformations closures as arguments.

`engine/StateTransformations.js`

Contains the nasty transformations. Calculates the new coordinates, applies new locations to the state and checks who is caught.

`state/CommonUtils.js`

Contains functions for fetching information from the state when state is the first argument. Should not be exposed to game AI functions.

`state/DataUtils.js`

Contains functions which require pre calculations. Must be initialised with initial data. This is usually exposed to AI functions, for example for fetching leaving trains.
