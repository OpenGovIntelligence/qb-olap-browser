//Api Responses Json Keys
ARJK = {
    'measures': 'measures',
    'id': 'uri',
    'label': 'enum_name',
    'enum_name': 'enum_name',
    'metadata_label': 'title',
    'dimensions': 'dimensions',
    'values': 'values',
    'dimension': 'dimension',
    'observations': 'observations',
    'structure': 'structure',
    'dimension_values': 'dimension_values',
    'headers': 'headers',
    'rows': 'rows',
    'data': 'data',
    'description': 'description',
    'comment': 'comment',
    'issued': 'issued',
    'modified': 'modified',
    'license': 'license'
};

function query(data) {
    return $.ajax({
        url: data.url,
        type: data.type,
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en',
        }
    })
}


function getDatasets() {
    return (query({
            url: prop.graphQLendpoint + 'get/datasets',
            type: 'GET'
        })
        .then(function(response) {
            return response
        })
        .fail(function(err) {
            console.log(err);
        })
    );
}

function getMeasures(uri) {
    return (query({
            url: prop.graphQLendpoint + 'get/dataset_measures?uri=' + uri,
            type: 'GET'
        })
        .then(function(response) {
            measuresData = response.result.datasets[0];
            return measuresData;
        })
        .fail(function(err) {
            return err;
        })
    );
}

function getDimensions(uri) {
    return (query({
            url: prop.graphQLendpoint + 'get/dataset_dimensions?uri=' + uri,
            type: 'GET'
        })
        .then(function(response) {
            dimensionsData = response.result.datasets[0];
            return dimensionsData;
        })
        .fail(function(err) {
            return err;
        })
    );
}

function getMetadata(uri) {
    return (query({
            url: prop.graphQLendpoint + 'get/dataset_metadata?uri=' + uri,
            type: 'GET'
        })
        .then(function(response) {
            metadata = response.result.datasets[0];
            //Check data Integrity
            if (!(typeof metadata === 'object') ||
                metadata === null ||
                !metadata.hasOwnProperty(ARJK.id) ||
                !metadata.hasOwnProperty(ARJK.metadata_label)
                //Only id and label are for sure available
            ) {
                _metadata = null;
                //Reject the promise
                return new $.Deferred().reject().promise();
            } else {
                _metadata = metadata;
                return Promise.resolve();
            }
        })
        .fail(function() {
            _metadata = null;
        })
    );
}

function getObservations(uri) {
    return query({
            url: prop.graphQLendpoint + 'get/dataset_observations?uri=' + uri + '&limit=1',
            type: 'GET'
        })
        .then(limit => {
            return query({
                url: prop.graphQLendpoint + 'get/dataset_observations?uri=' + uri + '&limit=' + limit.total_matches,
                type: 'GET'
            });
        })
}


function getDimensionValues(observations, dimensions) {
     var dimensionsValues = []; //Empty the array
    //_rawObs = observations.result;
    _dimensions.dimensions.forEach(dimension => {
        dimensionsValues.push({
            dimension: {
                [ARJK.id]: dimension[ARJK.id],
                [ARJK.enum_name]: dimension[ARJK.enum_name]
            },
            values: []
        })
    })
    dimensionsValues.forEach(dm => {
        dm.values = getValuesAux(observations.result, dm.dimension[ARJK.label]);
    })
    return dimensionsValues;
}

function getValuesAux(observations, dimension) {
    var dict = {};
    observations.forEach(obser => {
        if (obser.hasOwnProperty(dimension.toLowerCase())) {
            dict[obser[dimension.toLowerCase()]] = 1;
        }
    })
    var toRet = [];
    var index = 0;
    Object.keys(dict).forEach(value => {
        toRet.push({
            [ARJK.enum_name]: value,
            [ARJK.id]: index
        })
        index++;
    });
    return toRet;
}