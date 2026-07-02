const List = (props) => {
  console.log("Rendering List component");
  return (
    <div
      id="list"
      style={{ border: "1px solid black", padding: "8px", width: "100%" }}
    >
      <h3 key="name">{props.name}</h3>
      <p key="description">{props.description}</p>
    </div>
  );
};

export default List;
