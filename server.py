from flask import Flask, request, jsonify, render_template
import time

app = Flask(__name__)


class Elevator:
    def __init__(self, name, location, direction='idle', status='idle'):
        self.name = name
        self.location = location
        self.direction = direction
        self.status = status
        self.requests = []

    def add_request(self, call_location, call_direction, call_destination=None):
        if call_destination is not None:
            self.requests.append((call_location, call_direction, call_destination))
        else:
            self.requests.append((call_location, '', None))
        self.requests.sort()

    def move(self, num_floors):
        while self.requests:
            if self.direction == 'idle':
                next_request = self.requests[0]
                if next_request[0] > self.location:
                    self.direction = 'up'
                else:
                    self.direction = 'down'
                self.status = 'moving'

            if self.direction == 'up':
                next_requests = [r for r in self.requests if r[0] >= self.location]
                if next_requests:
                    next_request = min(next_requests, key=lambda r: r[0])
                    while self.location < next_request[0]:
                        self.location += 1
                    #     time.sleep(1)
                    self.requests.remove(next_request)

                    if next_request[2] is not None:
                        self.add_request(next_request[2], 'up' if next_request[2] > self.location else 'down')

                if not [r for r in self.requests if r[0] >= self.location]:
                    self.direction = 'down' if self.requests else 'idle'

            elif self.direction == 'down':
                next_requests = [r for r in self.requests if r[0] <= self.location]
                if (next_requests):
                    next_request = max(next_requests, key=lambda r: r[0])
                    while self.location > next_request[0]:
                        self.location -= 1
                    #     time.sleep(1)
                    self.requests.remove(next_request)

                    if next_request[2] is not None:
                        self.add_request(next_request[2], 'up' if next_request[2] > self.location else 'down')

                if not [r for r in self.requests if r[0] <= self.location]:
                    self.direction = 'up' if self.requests else 'idle'

            if self.location == 0:
                self.direction = 'up'
            elif self.location == num_floors - 1:
                self.direction = 'down'

        self.status = 'idle'
        self.direction = 'idle'

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
            else:
                new_FS = num_floors + 1 - d

        elif car.direction == 'up':
            if call_location < car.location:
                new_FS = 1
            elif call_location > car.location and call_direction == 'up':
                new_FS = num_floors + 2 - d
            else:
                new_FS = num_floors + 1 - d

        if new_FS > FS:
            FS = new_FS
            selected_car = car

    return selected_car

elevators = [
    Elevator(name="A", location=0, direction='up', status='idle'),
    Elevator(name="B", location=5, direction='down', status='idle'),
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/request_elevator', methods=['POST'])
def request_elevator():
    data = request.get_json()
    call_location = data['call_location']
    call_direction = data['call_direction']
    call_destination = data['call_destination']
    num_floors = 10

    selected_elevator = select_elevator(call_location, call_direction, elevators, num_floors)
    selected_elevator.add_request(call_location, call_direction, call_destination)
    selected_elevator.move(num_floors)
    
    response = {
        'elevator': selected_elevator.name,
        'location': selected_elevator.location,
        'status': selected_elevator.status,
        'direction': selected_elevator.direction
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)