const List = (props) => {
  console.log("Rendering List component");
  return (
    <div id="list">
      <h1 key="name">{props.name}</h1>
      <h2 key="description">{props.description}</h2>
    </div>
  );
};

export default List;
