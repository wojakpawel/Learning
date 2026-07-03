const List = (props) => {
  return (
    <div className="task-card">
      <h3>{props.name}</h3>
      <p>{props.description}</p>
    </div>
  );
};

export default List;
