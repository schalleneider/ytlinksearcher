import moment from 'moment'; 

class Converter {

    static convertISO8601ToSeconds(input) {
        var duration = moment.duration(input, moment.ISO_8601);
        return duration.asSeconds();
    }
}

export { Converter };