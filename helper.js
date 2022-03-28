import moment from 'moment'; 

class Helper {

    static convertISO8601ToSeconds(input) {
        var duration = moment.duration(input, moment.ISO_8601);
        return duration.asSeconds();
    }
}

export { Helper };