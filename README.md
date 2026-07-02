# Learning

A small Vite + React learning project with a simple todo app.

## Features

- Add a new task with a name and description
- Display tasks using the shared list component
- Remove completed tasks from the list
- Keep the task list centered in the UI

## Installation

Install dependencies:

```bash
npm install
```

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the app in the browser at:

```text
http://localhost:5173
```

If you need the dev server to be visible on your local network:

```bash
npm run dev -- --host
```

## Build for production

Build the project output into `dist`:

```bash
npm run build
```

## Linting

Check the project for lint issues:

```bash
npm run lint
```

## Project structure

- `src/App.jsx` renders the main application shell
- `src/Form.jsx` contains the task input form
- `src/ToDo.jsx` manages the todo state and task list
- `src/List.jsx` renders task details

## GitHub Actions

A GitHub Actions workflow is configured in `.github/workflows/build-and-deploy.yml`.
It runs on push to `main`, installs dependencies, builds the app, and uploads `dist` as a workflow artifact.

## Notes

- `dist/` is generated and ignored by Git
- `node_modules/` is also ignored
- The source files live in `src/`
