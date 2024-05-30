import time
import threading


class Elevator:
    def __init__(self, name, location, direction="up", status="idle"):
        self.name = name
        self.location = location
        self.direction = direction
        self.status = status
        self.call_requests = []

    def add_request(self, call_location, destination):
        self.call_requests.append((call_location, destination))
        self.status = "moving"

    def process_requests(self):
        if not self.call_requests:
            self.status = "idle"
            return

        self.status = "moving"
        call_locations = [req[0] for req in self.call_requests]
        destinations = [req[1] for req in self.call_requests]

        left = []
        right = []

        for loc in call_locations:
            if loc < self.location:
                left.append(loc)
            else:
                right.append(loc)

        left.sort()
        right.sort()

        run = 2
        while run:
            if self.direction == "up":
                for loc in right:
                    while self.location < loc:
                        self.location += 1
                        print(
                            f"Elevator {self.name} moving up, now at floor {self.location}"
                        )
                        time.sleep(1)
                    self.handle_request(loc)
                self.direction = "down"
            elif self.direction == "down":
                for loc in reversed(left):
                    while self.location > loc:
                        self.location -= 1
                        print(
                            f"Elevator {self.name} moving down, now at floor {self.location}"
                        )
                        time.sleep(1)
                    self.handle_request(loc)
                self.direction = "up"
            run -= 1

        self.status = "idle"
        print(f"Elevator {self.name} is now idle at floor {self.location}")

    def handle_request(self, call_location):
        for req in self.call_requests:
            if req[0] == call_location:
                print(
                    f"Elevator {self.name} reached call location at floor {call_location}"
                )
                time.sleep(1)
                while self.location < req[1]:
                    self.location += 1
                    print(
                        f"Elevator {self.name} moving up to destination, now at floor {self.location}"
                    )
                    time.sleep(1)
                while self.location > req[1]:
                    self.location -= 1
                    print(
                        f"Elevator {self.name} moving down to destination, now at floor {self.location}"
                    )
                    time.sleep(1)
                print(f"Elevator {self.name} reached destination at floor {req[1]}")
                self.call_requests.remove(req)
                break


def select_elevator(call_location, call_direction, elevators, num_floors):
    FS = -1  # Use a very low initial FS to ensure any valid elevator will be selected
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


# Example usage
elevator1 = Elevator(name="Elevator A", location=1)
elevator2 = Elevator(name="Elevator B", location=5)
elevator3 = Elevator(name="Elevator C", location=10)
elevators = [elevator1, elevator2, elevator3]

# Adding requests (call location, destination)
requests = [(5, 0), (5, 10), (5, 8)]

num_floors = 10

for call_location, destination in requests:
    call_direction = "up" if call_location < destination else "down"
    selected_elevator = select_elevator(
        call_location, call_direction, elevators, num_floors
    )
    print(
        f"Request from floor {call_location} to floor {destination}: selected {selected_elevator.name}"
    )
    selected_elevator.add_request(call_location, destination)

print("\nProcessing requests...\n")

threads = []
for elevator in elevators:
    thread = threading.Thread(target=elevator.process_requests)
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()

print("\nFinal state of all elevators:")
for elevator in elevators:
    print(
        f"Elevator {elevator.name} is at floor {elevator.location}, direction: {elevator.direction}, status: {elevator.status}"
    )
