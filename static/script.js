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
      const colorChanger = setInterval(() => {
        button.style.backgroundColor =
          button.style.backgroundColor == "red" ? "white" : "red";
        button.style.color = button.style.color == "white" ? "black" : "white";
        button.parentElement.querySelector(".label").style.backgroundColor =
          button.parentElement.querySelector(".label").style.backgroundColor ==
          "red"
            ? "white"
            : "red";
        button.parentElement.querySelector(".label").style.color =
          button.parentElement.querySelector(".label").style.color == "white"
            ? "black"
            : "white";
      }, 1000);
      const floor = button.dataset.floor;
      const direction = button.classList.contains("upSide") ? "up" : "down";
      const destination = prompt("Enter your destination floor:");
      if (destination !== null) {
        response = {
          floor: floor,
          direction: direction,
          destination: destination,
        };
        console.log("Requesting elevator:", response);
        requestElevator(floor, direction, destination, button, colorChanger);
      }
    });
  });

  function requestElevator(
    callLocation,
    callDirection,
    callDestination,
    button,
    colorChanger
  ) {
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
        clearInterval(colorChanger);
        button.style.backgroundColor = "white";
        button.style.color = "black";
        button.parentElement.querySelector(".label").style.backgroundColor =
          "white";
        button.parentElement.querySelector(".label").style.color = "black";
        console.log("Elevator selected:", data);
        alert(
          `Elevator ${data.elevator} is coming to floor ${data.current_location}`
        );
        button.style.backgroundColor = "white";
        button.style.color = "black";
        button.parentElement.querySelector(".label").style.backgroundColor =
          "white";
      })
      .catch((error) => console.error("Error:", error));
  }
});
