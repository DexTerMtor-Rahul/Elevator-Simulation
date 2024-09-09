const numFloors = 10;
const numElevators = 2;
var elevatorStatus = {};
var requests = [];
var requestTimeout;
var active_button = {};

document.addEventListener("DOMContentLoaded", () => {
  const elevatorContainer = document.getElementById("elevators");
  const floorsContainer = document.getElementById("floors");

  function createElement(type, className, floor, textContent) {
    const element = document.createElement(type);
    element.className = className;
    if (floor !== undefined) element.dataset.floor = floor;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
  }

  // Initialize elevators
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
      data.elevators.forEach((elevator) => {
        elevatorStatus[elevator.name] = [elevator.location, elevator.status];
        setElvatorStatus(elevator.name);
      });
    })
    .catch((error) => console.error("Error:", error));

  // Creating elevators
  for (let i = numElevators - 1; i >= 0; i--) {
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
    button.addEventListener("click", async () => {
      var colorChanger = setInterval(() => {
        startBlinking(button);
        changeLableColor(button);
      }, 1000);
      const floor = button.dataset.floor;
      const direction = button.classList.contains("upSide") ? "up" : "down";
      const destination = prompt("Enter your destination floor:");
      // Validate destination floor
      if (
        !destination ||
        destination < 0 ||
        destination >= numFloors
        // (direction == "up" && destination <= floor) ||
        // (direction == "down" && destination >= floor)
      ) {
        console.log(
          "Invalid destination floor. Please enter a valid floor number."
        );
        alert("Invalid destination floor. Please enter a valid floor number.");
        stopBlinking(colorChanger, button);
        return;
      }
      if (destination !== null) {
        requests.push({
          call_location: parseInt(floor),
          call_direction: direction,
          call_destination: parseInt(destination),
        });

        active_button[parseInt(floor)] = [colorChanger, button];

        // stopBlinking(colorChanger, button);

        if (requestTimeout) {
          clearTimeout(requestTimeout);
        }

        requestTimeout = setTimeout(() => {
          processRequests();
        }, 4000); // Set the timeout to 2 seconds (or any other desired duration)
      }
    });
  });
});

async function processRequests() {
  if (requests.length > 0) {
    await requestElevator(requests);
    requests = []; // Clear the requests after processing
  }
}

async function requestElevator(requests) {
  fetch("/request_elevator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requests),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Elevator selected:", data);
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        // Function to handle SSE updates
        async function handleSSEUpdates() {
          const eventSource = new EventSource("/stream");
          eventSource.onmessage = async function (event) {
            const data = JSON.parse(event.data);
            console.log("Elevator update received:", data);

            // Animation is doing sequentially

            for (const item of data) {
              if (active_button[item.call_location]) {
                stopBlinking(
                  active_button[item.call_location][0],
                  active_button[item.call_location][1]
                );
              }
              await animateElevator(item);
            }
          };
        }
        handleSSEUpdates();
      }
    })
    .catch((error) => console.error("Error:", error));
}
// function to change color of the label after pressing the up or down button

async function animateElevator(data) {
  const elevator = document.querySelector(
    `.elevator[data-floor="${data.elevator_name}"]`
  );

  if (!elevator) {
    console.error("Elevator not found");
    return;
  }

  removeElevatorStatus(data.elevator_name);

  const intial_location = elevatorStatus[data.elevator_name][0];

  // Move to the call location
  if (intial_location <= data.call_location) {
    for (let i = intial_location; i <= data.call_location; i++) {
      const elevatorCar = elevator.querySelector(
        `.elevator_car[data-floor="${i}"]`
      );

      if (elevatorCar) {
        elevatorCar.classList.add("moving");
        await sleep(200); // Sleep for 500 milliseconds for the animation effect
        elevatorCar.classList.remove("moving");
      }
      if (i === data.call_location) {
        elevatorCar.classList.add("stopped");
        // alert(
        //   `Elevator ${data.elevator_name} is reached to call location ${data.call_location}`
        // );
        await sleep(2000);
        elevatorCar.classList.remove("stopped");
      }
    }
  } else {
    for (let i = intial_location; i >= data.call_location; i--) {
      const elevatorCar = elevator.querySelector(
        `.elevator_car[data-floor="${i}"]`
      );
      if (elevatorCar) {
        elevatorCar.classList.add("moving");
        await sleep(200); // Sleep for 500 milliseconds for the animation effect
        elevatorCar.classList.remove("moving");
      }
      if (i === data.call_location) {
        elevatorCar.classList.add("stopped");
        // alert(
        //   `Elevator ${data.elevator_name} is reached to call location ${data.call_location}`
        // );
        await sleep(2000);
        elevatorCar.classList.remove("stopped");
      }
    }
  }

  // Move to the Destination
  if (data.call_location < data.current_location) {
    for (let i = data.call_location; i <= data.current_location; i++) {
      const elevatorCar = elevator.querySelector(
        `.elevator_car[data-floor="${i}"]`
      );

      if (elevatorCar) {
        elevatorCar.classList.add("moving");
        await sleep(200); // Sleep for 500 milliseconds for the animation effect
        elevatorCar.classList.remove("moving");
      }
      if (i === data.current_location) {
        elevatorCar.classList.add("stopped");
        // alert(
        //   `Elevator ${data.elevator_name} has reached to destination ${data.current_location}`
        // );

        await sleep(2000);
        elevatorCar.classList.remove("stopped");
      }
    }
  } else {
    for (let i = data.call_location; i >= data.current_location; i--) {
      const elevatorCar = elevator.querySelector(
        `.elevator_car[data-floor="${i}"]`
      );
      if (elevatorCar) {
        elevatorCar.classList.add("moving");
        await sleep(200); // Sleep for 500 milliseconds for the animation effect
        elevatorCar.classList.remove("moving");
      }
      if (i === data.current_location) {
        elevatorCar.classList.add("stopped");
        // alert(
        //   `Elevator ${data.elevator_name} has reached to destination ${data.current_location}`
        // );

        await sleep(2000);
        elevatorCar.classList.remove("stopped");
      }
    }
  }

  elevatorStatus[data.elevator_name] = [
    data.current_location,
    data.current_status,
  ];
  setElvatorStatus(data.elevator_name);
}

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

function setElvatorStatus(name) {
  const location = elevatorStatus[name][0];
  const status = elevatorStatus[name][1];
  const elevatorELement = document.querySelector(
    `.elevator[data-floor="${name}"]`
  );
  const elevatorCar = elevatorELement.querySelector(
    `[data-floor="${location}"]`
  );
  elevatorCar.classList.add(status);
  console.log(`Elevator ${name} is ${status} at floor ${location}`);
}

function removeElevatorStatus(name) {
  const location = elevatorStatus[name][0];
  const status = elevatorStatus[name][1];
  const elevatorELement = document.querySelector(
    `.elevator[data-floor="${name}"]`
  );
  const elevatorCar = elevatorELement.querySelector(
    `[data-floor="${location}"]`
  );
  elevatorCar.classList.remove(status);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
