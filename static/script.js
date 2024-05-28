document.addEventListener("DOMContentLoaded", () => {
  const numFloors = 10;
  const numElevators = 3;
  const elevatorContainer = document.getElementById("elevators");
  const floorsContainer = document.getElementById("floors");

  function createElement(type, className, floor, textContent) {
    const element = document.createElement(type);
    element.className = className;
    if (floor !== undefined) element.dataset.floor = floor;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
  }

  // Initialize elevatorss
  fetch("/initialize_elevators", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      num_elevators: parseInt(numElevators),
      num_floors: parseInt(numFloors),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.status);
    })
    .catch((error) => console.error("Error:", error));

  // Creating elevators blocks
  for (let i = 0; i < numElevators; i++) {
    const elevator = createElement(
      "div",
      "elevator",
      String.fromCharCode(65 + i)
    );
    for (let j = numFloors - 1; j >= 0; j--) {
      elevator.appendChild(createElement("div", "elevator_car", j, j));
    }
    elevatorContainer.appendChild(elevator);
  }

  // Creating floors buttons
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

  // Add event listener to each button
  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("click", () => {
      const colorChanger = setInterval(() => {
        startBlinking(button);
        changeLableColor(button);
      }, 1000);
      const floor = button.dataset.floor;
      const direction = button.classList.contains("upSide") ? "up" : "down";
      const destination = prompt("Enter your destination floor:");
      if (destination !== null) {
        const response = {
          floor: floor,
          direction: direction,
          destination: destination,
        };
        console.log("Requesting elevator:", response);

        // Validate destination floor
        if (isNaN(destination) || destination < 0 || destination >= numFloors) {
          alert(
            "Invalid destination floor. Please enter a valid floor number."
          );
          stopBlinking(colorChanger, button);
          return;
        }
        //validate destination floor after pressing the up or down button
        if (direction == "up" && destination <= floor) {
          alert(
            "Invalid destination floor. Please enter a valid floor number."
          );
          stopBlinking(colorChanger, button);
          return;
        } else if (direction == "down" && destination >= floor) {
          alert(
            "Invalid destination floor. Please enter a valid floor number."
          );
          stopBlinking(colorChanger, button);
          return;
        }
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
        stopBlinking(colorChanger, button);
        console.log("Elevator selected:", data);
        if (data.error) {
          alert(`Error: ${data.error}`);
        } else {
          console.log(
            `Elevator ${data.elevator} has reached floor ${data.current_location}`
          );
        }
      })
      .catch((error) => console.error("Error:", error));
  }
});
// function to change color of the label after pressing the up or down button
function changeLableColor(button) {
  button.parentElement.querySelector(".label").style.backgroundColor = "red";
  button.parentElement.querySelector(".label").style.color = "white";
}

// Start blinking of the button
function startBlinking(button) {
  button.style.backgroundColor =
    button.style.backgroundColor == "red" ? "white" : "red";
  button.style.color = button.style.color == "white" ? "black" : "white";
}

// Stop blinking of the button
function stopBlinking(colorChanger, button) {
  clearInterval(colorChanger);
  button.style.backgroundColor = "white";
  button.style.color = "black";
  button.parentElement.querySelector(".label").style.backgroundColor = "white";
  button.parentElement.querySelector(".label").style.color = "black";
}
