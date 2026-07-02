import React from "react";

const Counter = () => {
  console.log("Rendering Counter component");
  const [count, setCount] = React.useState(0);
  const onClickIncrement = () => setCount((count) => count + 1);

  return (
    <>
      <p id="count-display">{`Count: ${count}`}</p>
      <button id="increment-button" onClick={onClickIncrement}>
        Increment
      </button>
    </>
  );
};

export default Counter;
