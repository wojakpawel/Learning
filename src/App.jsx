import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import Counter from "./Counter.jsx";
import ToDo from "./ToDo.jsx";

const App = () => {
  const [name, setName] = React.useState("Name goes here!");

  return (
    <div className="app-shell">
      <Counter />
      <ToDo />
    </div>
  );
};

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<App />);
