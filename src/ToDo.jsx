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
    <div className="todo-panel">
      <h2>To Do</h2>
      <Form onSubmit={handleAddTask} />
      <ul className="task-list">
        {[...tasks.entries()].map(([taskId, task]) => (
          <li key={taskId} className="task-item">
            <List name={task.name} description={task.description} />
            <button
              type="button"
              onClick={() => handleRemoveTask(taskId)}
              className="task-remove"
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
