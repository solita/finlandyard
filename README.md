# Finland Yard

Finland Yard is programming game based on VR (Valtion Rautatiet - Finnish national railways)
timetable data.

![Screenshot](screenshots/fy-screenshot.png?raw=true "Screenshot")

Idea is that police should catch villains on railways using trains simulated from
actual timetable data.

Villains must also choose, when to do crime to get points. See repository wiki for further information.

## Set up

You need Nodejs installed and then just install dependencies with:

```
npm install
```

## Development

`/bouncer` contains simple proxy for proxying and caching the data from VR apis.

Start the game and run timetable proxy by

```
npm run dev+proxy
```

Then, at localhost:8080 you should have a running game, which you can run at any time by refreshing the page.

Running test

```
npm run test
```

## Contributing

The game is not finished at any level. We gladly accept and appreciate pull requests, so
feel free to fork the repo and tinker freely around with it. We are quite strict on
how the actual game engine must be implemented, and at some time, we'll provide
better description of the architecture.

Feel free to open up a issue, throw in an idea or two.
