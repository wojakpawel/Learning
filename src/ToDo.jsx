import React from "react";
import Form from "./Form.jsx";
import List from "./List.jsx";

const ToDo = () => {
  const [tasks, setTasks] = React.useState(new Map());

  const handleAddTask = (task) => {
    const id = crypto.randomUUID();

    setTasks((currentTasks) => new Map(currentTasks).set(id, task));
  };

  const handleRemoveTask = (taskId) => {
    setTasks((currentTasks) => {
      const updatedTasks = new Map(currentTasks);
      updatedTasks.delete(taskId);
      return updatedTasks;
    });
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h2>To Do</h2>
      <Form onSubmit={handleAddTask} />
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "16px 0 0",
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {[...tasks.entries()].map(([taskId, task]) => (
          <li
            key={taskId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "8px",
              width: "100%",
            }}
          >
            <List name={task.name} description={task.description} />
            <button
              type="button"
              onClick={() => handleRemoveTask(taskId)}
              style={{ border: "none", backgroundColor: "greenyellow" }}
            >
              Done!
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToDo;
