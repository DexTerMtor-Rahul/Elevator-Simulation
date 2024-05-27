document.addEventListener("DOMContentLoaded", () => {
  const numFloors = 10;
  const numElevators = 2;
  const elevatorContainer = document.getElementById("elevators");
  const floorsContainer = document.getElementById("floors");

  function createElement(type, className, floor, textContent) {
    const element = document.createElement(type);
    element.className = className;
    if (floor !== undefined) element.dataset.floor = floor;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
  }

  for (let i = 0; i < numElevators; i++) {
    const elevator = createElement("div", "elevator");
    for (let j = numFloors - 1; j >= 0; j--) {
      elevator.appendChild(createElement("div", "elevator_car", j, j));
    }
    elevatorContainer.appendChild(elevator);
  }

  for (let i = numFloors - 1; i >= 0; i--) {
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

  //new code from here
  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("click", () => {
      const floor = button.dataset.floor;
      const direction = button.classList.contains("upSide") ? "up" : "down";
      const destination = prompt("Enter your destination floor:");
      if (destination !== null) {
        requestElevator(floor, direction, destination);
      }
    });
  });

  function requestElevator(callLocation, callDirection, callDestination) {
    fetch("/request_elevator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        call_location: parseInt(callLocation),
        call_direction: callDirection,
        call_destination: parseInt(callDestination),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Elevator selected:", data);
        alert(`Elevator ${data.elevator} is coming to floor ${data.location}`);
      })
      .catch((error) => console.error("Error:", error));
  }
});
