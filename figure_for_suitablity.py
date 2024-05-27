class Elevator:
    def __init__(self, location, direction, status):
        self.location = location  # Floor location of the elevator
        self.direction = direction  # 'up', 'down', or 'idle'
        self.status = status  # 'moving' or 'idle'

def select_elevator(call_location, call_direction, elevators, num_floors):
    FS = 1
    selected_car = elevators[0]

    for car in elevators:
        d = abs(car.location - call_location)

        if car.status == 'idle':
            new_FS = num_floors + 1 - d

        elif car.direction == 'down':
            if call_location > car.location:
                new_FS = 1
            elif call_location < car.location and call_direction == 'down':
                new_FS = num_floors + 2 - d
            else:  # call_location < car.location and call_direction != 'down'
                new_FS = num_floors + 1 - d

        elif car.direction == 'up':
            if call_location < car.location:
                new_FS = 1
            elif call_location > car.location and call_direction == 'up':
                new_FS = num_floors + 2 - d
            else:  # call_location > car.location and call_direction != 'up'
                new_FS = num_floors + 1 - d

        if new_FS > FS:
            FS = new_FS
            selected_car = car

    return selected_car

# Example usage
elevators = [
    Elevator(location=0, direction='up', status='idle'),
    Elevator(location=3, direction='down', status='moving'),
    Elevator(location=8, direction='down', status='idle')
]

call_location = 2
call_direction = 'down'
num_floors = 10

selected_elevator = select_elevator(call_location, call_direction, elevators, num_floors)
print(f"Selected Elevator: Location {selected_elevator.location}, Direction {selected_elevator.direction}, Status {selected_elevator.status}")

