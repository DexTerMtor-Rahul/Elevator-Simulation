import time


class Elevator:
    def __init__(self, name, location, direction="idle", status="idle"):
        self.name = name
        self.location = location  # Floor location of the elevator
        self.direction = direction  # 'up', 'down', or 'idle'
        self.status = status  # 'moving' or 'idle'
        self.requests = []  # List of floor requests

    def add_request(self, call_location, call_direction, call_destination=None):
        if call_destination is not None:
            self.requests.append((call_location, call_direction, call_destination))
        else:
            # Add destination request without a call direction
            self.requests.append((call_location, "", None))
        self.requests.sort()  # Keep requests sorted

    def move(self, num_floors):
        while self.requests:
            if self.direction == "idle":
                # Start moving towards the first request
                next_request = self.requests[0]
                if next_request[0] > self.location:
                    self.direction = "up"
                else:
                    self.direction = "down"
                self.status = "moving"
                print(f"Elevator {self.name} starts moving {self.direction}")

            if self.direction == "up":
                # Move up to the next request
                next_requests = [r for r in self.requests if r[0] >= self.location]
                if next_requests:
                    next_request = min(next_requests, key=lambda r: r[0])
                    while self.location < next_request[0]:
                        self.location += 1
                        print(f"Elevator {self.name} moving up to {self.location}")
                        time.sleep(1)  # Simulate time taken to move one floor
                    self.requests.remove(next_request)
                    print(
                        f"Elevator {self.name} reached floor {self.location} next request {next_request}"
                    )

                    # Handle destination floor
                    if next_request[2] is not None:
                        print(
                            f"Elevator {self.name} picked up request to floor {next_request[2]}"
                        )
                        self.add_request(
                            next_request[2],
                            "up" if next_request[2] > self.location else "down",
                        )

                # If no more requests in the current direction, change direction
                if not [r for r in self.requests if r[0] >= self.location]:
                    self.direction = "down" if self.requests else "idle"

            elif self.direction == "down":
                # Move down to the next request
                next_requests = [r for r in self.requests if r[0] <= self.location]
                if next_requests:
                    next_request = max(next_requests, key=lambda r: r[0])
                    while self.location > next_request[0]:
                        self.location -= 1
                        print(f"Elevator {self.name} moving down to {self.location}")
                        time.sleep(1)  # Simulate time taken to move one floor
                    self.requests.remove(next_request)
                    print(
                        f"Elevator {self.name} reached floor {self.location} next request {next_request}"
                    )

                    # Handle destination floor
                    if next_request[2] is not None:
                        print(
                            f"Elevator {self.name} picked up request to floor {next_request[2]}"
                        )
                        self.add_request(
                            next_request[2],
                            "up" if next_request[2] > self.location else "down",
                        )

                # If no more requests in the current direction, change direction
                if not [r for r in self.requests if r[0] <= self.location]:
                    self.direction = "up" if self.requests else "idle"

            if self.location == 0:
                self.direction = "up"
            elif self.location == num_floors - 1:
                self.direction = "down"

        self.status = "idle"
        self.direction = "idle"
        print(f"Elevator {self.name} is now idle at floor {self.location}")


def select_elevator(call_location, call_direction, elevators, num_floors):
    FS = 1
    selected_car = elevators[0]

    for car in elevators:
        d = abs(car.location - call_location)

        if car.status == "idle":
            new_FS = num_floors + 1 - d

        elif car.direction == "down":
            if call_location > car.location:
                new_FS = 1
            elif call_location < car.location and call_direction == "down":
                new_FS = num_floors + 2 - d
            else:  # call_location < car.location and call_direction != 'down'
                new_FS = num_floors + 1 - d

        elif car.direction == "up":
            if call_location < car.location:
                new_FS = 1
            elif call_location > car.location and call_direction == "up":
                new_FS = num_floors + 2 - d
            else:  # call_location > car.location and call_direction != 'up'
                new_FS = num_floors + 1 - d

        if new_FS > FS:
            FS = new_FS
            selected_car = car

    return selected_car


def simulate_elevator_system(elevators, calls, num_floors):
    for call_location, call_direction, call_destination in calls:
        selected_elevator = select_elevator(
            call_location, call_direction, elevators, num_floors
        )
        selected_elevator.add_request(call_location, call_direction, call_destination)

    for elevator in elevators:
        if len(elevator.requests) > 0:
            print(
                f"Elevator {elevator.name} is moving with requests {elevator.requests}"
            )
            elevator.move(num_floors)


# Example usage
elevators = [
    Elevator(name="A", location=0, direction="up", status="idle"),
    Elevator(name="B", location=0, direction="up", status="idle"),
]

calls = [(0, "up", 5), (5, "down", 0), (5, "up", 9), (4, "down", 0)]

num_floors = 10

simulate_elevator_system(elevators, calls, num_floors)
