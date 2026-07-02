import React from "react";
import ReactDOM from "react-dom/client";
import List from "./List.jsx";

const App = () => {
  const [count, setCount] = React.useState(0);
  const [name, setName] = React.useState("Name goes here!");
  console.log("Rendering App component");
  return React.createElement("div", {}, [
    React.createElement("h1", { key: "title", id: "title" }, "Hello World!"),
    React.createElement("input", {
      key: "name-input",
      id: "name-input",
      type: "text",
      value: name,
      onChange: (e) => setName(e.target.value),
    }),
    React.createElement(
      "p",
      { key: "name-display", id: "name-display" },
      `Name: ${name}`,
    ),
    React.createElement(
      "p",
      { key: "count-display", id: "count-display" },
      `Count: ${count}`,
    ),
    React.createElement(
      "button",
      {
        key: "increment-button",
        id: "increment-button",
        onClick: () => setCount(count + 1),
      },
      "Increment",
    ),
    React.createElement(List, {
      key: "list-component",
      name: "Nazwa",
      description: "Opis",
    }),
  ]);
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));
