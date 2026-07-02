import React from "react";
import ReactDOM from "react-dom/client";
import List from "./List.jsx";
import Counter from "./Counter.jsx";
import ToDo from "./ToDo.jsx";

const App = () => {
  const [name, setName] = React.useState("Name goes here!");
  console.log("Rendering App component");

  return (
    <div
      align="center"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid black",
        padding: "16px",
        margin: "16px",
      }}
    >
      <Counter />
      <ToDo />
    </div>
  );
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<App />);
