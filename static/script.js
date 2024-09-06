const numFloors = 10;
const numElevators = 2;
var elevatorStatus = {};
var requests = [];
var requestTimeout;
var active_button = {};

document.addEventListener("DOMContentLoaded", () => {
  initializeElevators();
  createElevatorElements();
  createFloorButtons();
  addButtonEventListeners();
});

// Initialize elevators via server
function initializeElevators() {
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
        updateElevatorStatus(elevator.name);
      });
    })
    .catch((error) => console.error("Error:", error));
}

// Create elevator elements in DOM
function createElevatorElements() {
  const elevatorContainer = document.getElementById("elevators");
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
}

// Create floor buttons for each floor
function createFloorButtons() {
  const floorsContainer = document.getElementById("floors");
  for (let i = numFloors - 1; i >= 0; i--) {
    const floor = createElement("div", "floor");
    floor.append(
      createElement("label", "label", undefined, i),
      createElement("button", "button upSide", i, "▲"),
      createElement("button", "button downSide", i, "▼")
    );
    if (i === 0) floor.querySelector(".downSide").remove();
    else if (i === numFloors - 1) floor.querySelector(".upSide").remove();
    floorsContainer.appendChild(floor);
  }
}

// Create a reusable element
function createElement(type, className, floor, textContent) {
  const element = document.createElement(type);
  element.className = className;
  if (floor !== undefined) element.dataset.floor = floor;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

// Add event listeners to floor buttons
function addButtonEventListeners() {
  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("click", () => handleButtonClick(button));
  });
}

// Handle button click event
function handleButtonClick(button) {
  const floor = button.dataset.floor;
  const direction = button.classList.contains("upSide") ? "up" : "down";
  const destination = prompt("Enter your destination floor:");

  // Validate destination floor
  if (!isValidDestination(floor, destination)) {
    alert("Invalid destination floor. Please enter a valid floor number.");
    return;
  }

  const colorChanger = startBlinking(button);
  active_button[parseInt(floor)] = [colorChanger, button];

  requests.push({
    call_location: parseInt(floor),
    call_direction: direction,
    call_destination: parseInt(destination),
  });

  // Process requests after a delay
  if (requestTimeout) clearTimeout(requestTimeout);
  requestTimeout = setTimeout(() => processRequests(), 4000);
}

// Validate destination input
function isValidDestination(floor, destination) {
  return destination && destination >= 0 && destination < numFloors;
}

// Process elevator requests
async function processRequests() {
  if (requests.length > 0) {
    await requestElevator(requests);
    requests = []; // Clear the requests after processing
  }
}

// Request an elevator from the server
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
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        handleSSEUpdates();
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Handle Server-Sent Events (SSE) for elevator updates
async function handleSSEUpdates() {
  const eventSource = new EventSource("/stream");
  eventSource.onmessage = async function (event) {
    const data = JSON.parse(event.data);
    console.log("Elevator update received:", data);

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

// Animate elevator movement
async function animateElevator(data) {
  const elevator = document.querySelector(
    `.elevator[data-floor="${data.elevator_name}"]`
  );
  if (!elevator) return;

  removeElevatorStatus(data.elevator_name);
  await moveElevator(elevator, data.call_location);
  await moveElevator(elevator, data.current_location);

  elevatorStatus[data.elevator_name] = [
    data.current_location,
    data.current_status,
  ];
  updateElevatorStatus(data.elevator_name);
}

// Move elevator to a specific floor
async function moveElevator(elevator, targetFloor) {
  const currentFloor = parseInt(elevatorStatus[elevator.dataset.floor][0]);
  const step = currentFloor < targetFloor ? 1 : -1;

  for (let i = currentFloor; i !== targetFloor + step; i += step) {
    const elevatorCar = elevator.querySelector(
      `.elevator_car[data-floor="${i}"]`
    );
    if (elevatorCar) {
      elevatorCar.classList.add("moving");
      await sleep(200);
      elevatorCar.classList.remove("moving");
    }
    if (i === targetFloor) {
      elevatorCar.classList.add("stopped");
      await sleep(2000);
      elevatorCar.classList.remove("stopped");
    }
  }
}

// Update elevator status
function updateElevatorStatus(name) {
  const [location, status] = elevatorStatus[name];
  const elevator = document.querySelector(`.elevator[data-floor="${name}"]`);
  const elevatorCar = elevator.querySelector(`[data-floor="${location}"]`);
  elevatorCar.classList.add(status);
  console.log(`Elevator ${name} is ${status} at floor ${location}`);
}

// Remove elevator status
function removeElevatorStatus(name) {
  const [location, status] = elevatorStatus[name];
  const elevator = document.querySelector(`.elevator[data-floor="${name}"]`);
  const elevatorCar = elevator.querySelector(`[data-floor="${location}"]`);
  elevatorCar.classList.remove(status);
}

// Start button blinking
function startBlinking(button) {
  return setInterval(() => {
    button.style.backgroundColor =
      button.style.backgroundColor === "red" ? "white" : "red";
    button.style.color = button.style.color === "white" ? "black" : "white";
  }, 1000);
}

// Stop button blinking
function stopBlinking(colorChanger, button) {
  clearInterval(colorChanger);
  button.style.backgroundColor = "white";
  button.style.color = "black";
  button.parentElement.querySelector(".label").style.backgroundColor = "white";
  button.parentElement.querySelector(".label").style.color = "black";
}

// Sleep function for async delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
