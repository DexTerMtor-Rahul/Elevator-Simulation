document.addEventListener("DOMContentLoaded", () => {
  const numFloors = 10;
  const elevatorContainer = document.getElementById("elevator");
  const floorsContainer = document.getElementById("floors");

  function createElement(type, className, floor, textContent) {
    const element = document.createElement(type);
    element.className = className;
    if (floor !== undefined) element.dataset.floor = floor;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
  }

  for (let i = numFloors - 1; i >= 0; i--) {
    elevatorContainer.appendChild(createElement("div", "elevator_car", i, i));
    const floor = createElement("div", "floor");
    floor.append(
      createElement("label", "label", undefined, i),
      createElement("button", "button upSide", i, "▲"),
      createElement("button", "button downSide", i, "▼")
    );
    if (i === 0) {
      floor.querySelector(".downSide").remove();
    } else if (i === numFloors - 1) {
      floor.querySelector(".upSide").remove();
    }
    floorsContainer.appendChild(floor);
  }
});
