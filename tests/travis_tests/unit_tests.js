/**
 * to run these tests:
 *
 * $ npm install nodeunit -g
 *
 * $ nodeunit unit_tests.js
 */

// TODO: add failure tests

var socket_util = require('../../app/socket_util');
var _ = require('underscore');

// accounts for various query arg formats coming from Python and Node.js clients
exports.parse_args = function (test) {
    var socket1 = {
        handshake: {
            query: {
                network: 'array_of_things',
                sensors: '[htu21d]',
                features: '[temperature,relative_humidity]',
                nodes: '[000,02B,011]'
            }
        }
    };
    var args1 = socket_util.parse_args(socket1.handshake.query);
    var socket2 = {
        handshake: {
            query: {
                network: 'array_of_things',
                sensors: 'htu21d',
                features: 'temperature,relative_humidity',
                nodes: '000,02B,011'
            }
        }
    };
    var args2 = socket_util.parse_args(socket2.handshake.query);
    var socket3 = {
        handshake: {
            query: {
                network: 'array_of_things',
                sensors: ['htu21d'],
                features: ['temperature', 'relative_humidity'],
                nodes: ['000', '02B', '011']
            }
        }
    };
    var args3 = socket_util.parse_args(socket3.handshake.query);

    var correct_args = {
        network: 'array_of_things',
        sensors: ['htu21d'],
        features: ['temperature', 'relative_humidity'],
        nodes: ['000', '02b', '011']
    };

    test.ok(_.isEqual(args1, correct_args));
    test.ok(_.isEqual(args2, correct_args));
    test.ok(_.isEqual(args3, correct_args));
    test.done();
};

// check that validation query is generated correctly
exports.check_query = function (test) {
    var args = {
        network: 'array_of_things',
        sensors: ['htu21d'],
        features: ['temperature', 'relative_humidity'],
        nodes: ['000', '02B', '011']
    };

    test.equal(socket_util.check_query(args),
        'http://' + process.env.PLENARIO_HOST + '/v1/api/sensor-networks/array_of_things/check?' +
        '&sensors=htu21d&features=temperature,relative_humidity&nodes=000,02B,011');
    test.done();
};

// check that data is being correctly filtered to be sent to rooms
exports.filter_data = function (test) {
    var args = {
        network: 'array_of_things',
        sensors: ['htu21d'],
        features: ['temperature', 'relative_humidity'],
        nodes: ['000', '02B', '011']
    };
    var room_name = JSON.stringify(args);

    // correct
    var data1 = {
        "network": "array_of_things",
        "node_id": "000",
        "node_config": "34",
        "datetime": "2016-08-05T00:00:08.246000",
        "sensor": "htu21d",
        "feature": "temperature",
        "results": {
            temperature: 37.90
        }
    };
    // bad network
    var data2 = {
        "network": "internet_of_stuff",
        "node_id": "000",
        "node_config": "39",
        "datetime": "2016-08-05T00:00:08.246000",
        "sensor": "htu21d",
        "feature": "atmospheric_pressure",
        "results": {
            pressure: 80.29
        }
    };
    // bad FoI
    var data3 = {
        "network": "array_of_things",
        "node_id": "000",
        "node_config": "34",
        "datetime": "2016-08-05T00:00:08.246000",
        "sensor": "htu21d",
        "feature": "atmospheric_pressure",
        "results": {
            pressure: 87.22
        }
    };
    // bad node
    var data4 = {
        "network": "array_of_things",
        "node_id": "00C",
        "node_config": "34",
        "datetime": "2016-08-05T00:00:08.246000",
        "sensor": "htu21d",
        "feature": "relative_humidity",
        "results": {
            humidity: 67.31
        }
    };
    // bad sensor
    var data5 = {
        "network": "array_of_things",
        "node_id": "02B",
        "node_config": "34",
        "datetime": "2016-08-05T00:00:08.246000",
        "sensor": "tgr67",
        "feature": "relative_humidity",
        "results": {
            humidity: 81.77
        }
    };

    test.ok( socket_util.valid_data(data1, room_name));
    test.ok(!socket_util.valid_data(data2, room_name));
    test.ok(!socket_util.valid_data(data3, room_name));
    test.ok(!socket_util.valid_data(data4, room_name));
    test.ok(!socket_util.valid_data(data5, room_name));
    test.done();
};