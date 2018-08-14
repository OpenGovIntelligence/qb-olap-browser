var _metadata = null; //Will hold the dataset's metadata
var _measures = null; //API results for measures (object)
var _measureSelected = null; //Will hold the index of the selected measure
var _dimensions = null; //API results for dimensions (object)
var _freeDimension = null; //Will hold the index of the selected free dimension (for x axis)
var _dimensionsValues = []; //API results for dimension values (Array: one row for each dimension)
var _dimensionsValueSelected = null; //Will hold an array with the selected value per dimension [dim idx]=value idx
var filteredObservations = null;

//On load page show available data cubes
$(function() {
	getDatasets()
		.then(response => {
			loadAvailableCubes(response);
		});
});


function loadAvailableCubes(responseJson) {

	$("#datasets").append(
		"<form>" +
		"<fieldSet id='datasetField'>" +
		"<legend>Select dataset</legend>");

	d3.select("#datasetField")
		.append("select")
		.attr("id", "cubeURI")
		.on("change", function() {
			loadCubeStructure(0, 1)
		})
		.selectAll("option")
		.data(responseJson.result.datasets)
		.enter().append("option")
		.text(function(d) {
			return d[ARJK['metadata_label']];
		})
		.attr("value", function(d) {
			return d[ARJK['id']];
		});

	$("#datasets").append("</fieldSet></form>");
}

//Load cube structure when Data Cube is selected
//Input: rowIndex-> the index of dimension to be used for rows
//       columnIndex-> the index of dimension to be used for columns
function loadCubeStructure(rowIndex, columnIndex) {

	//get the data value and index from the event
	var dataSetURI = $('#cubeURI').val();

	//Clean current divs
	$("#rowsCols").empty();
	$("#filter").empty();

	$("#button").empty();
	$("#tableview").empty();

	$("#rowsCols").append(
		"<form>" +
		"<fieldSet id='visualDimsField'>" +
		"<legend>Table dimensions </legend></fieldSet></form>");

	$("#filter").append(
		"<form>" +
		"<fieldSet id='filterField'>" +
		"<legend>Filter " +
		"<img id='filterLoad' width='25px' src='images/loadingdots.gif' />" +
		"</legend></fieldSet></form>");

	getMeasures(encodeURI(dataSetURI))
		.then(function(responseJsonMeasure) {
			_measures = responseJsonMeasure;
			$("#filterField").append("<div id='filtermeasure'></div>");
			$("#filtermeasure").append("Measure: ");
			d3.select("#filtermeasure")
				.append("select")
				.attr("id", "selectMeasure")
				.selectAll("option")
				.data(responseJsonMeasure.measures)
				.enter().append("option")
				.text(function(d) {
					return d[ARJK['label']];
				})
				.attr("value", function(d, i) {
					return i;
				});
		});

	getDimensions(encodeURI(dataSetURI))
		.then(
			function(dimensionsResponseJson) {
				_dimensions = dimensionsResponseJson;

				$("#visualDimsField").append("Row: ");

				//Select for rows
				d3.select("#visualDimsField")
					.append("select")
					.attr("id", "selectRow")
					.on("change", function() {
						if ($('#selectRow').prop('selectedIndex') == columnIndex) {
							if (columnIndex > 0) {
								columnIndex--;
							} else {
								columnIndex++;
							}
						}
						loadCubeStructure($('#selectRow').prop('selectedIndex'), columnIndex)
					})
					.selectAll("option")
					.data(dimensionsResponseJson.dimensions)
					.enter().append("option")
					.text(function(d) {
						return d[ARJK['label']];
					})
					.attr("value", function(d, i) {
						return i;
					});

				//set selected row
				$("#selectRow").val(rowIndex);

				$("#visualDimsField").append(" Column: ");

				//Select for columns
				d3.select("#visualDimsField")
					.append("select")
					.attr("id", "selectColumn")
					.on("change", function() {
						if ($('#selectColumn').prop('selectedIndex') == rowIndex) {
							if (rowIndex > 0) {
								rowIndex--;
							} else {
								rowIndex++;
							}
						}
						loadCubeStructure(rowIndex, $('#selectColumn').prop('selectedIndex'))
					})
					.selectAll("option")
					.data(dimensionsResponseJson.dimensions)
					.enter().append("option")
					.text(function(d) {
						return d[ARJK['label']];
					})
					.attr("value", function(d, i) {
						return i;
					});

				//Set selected column
				$("#selectColumn").val(columnIndex);

				//The rest         	
				if (dimensionsResponseJson.dimensions.length > 2) {

					//count the successful callbacks
					var j = 2;
					getObservations(encodeURI(dataSetURI)).then(observations => {
						_rawObs = observations.result;
						_dimensionsValues = getDimensionValues(observations, _dimensions);
						dimenValues = _dimensionsValues;

						for (var i = 0; i < dimenValues.length; i++) {
							//If the dimensions is not the row and column of the table, then it is for filter
							if (i != rowIndex && i != columnIndex) {
								$("#filterField").append("<div id='filterdims' class='filterDiv'></div>");
								var dim = dimenValues[i];

								$("#filterdims").append(dim.dimension['enum_name'] + ": ");
								d3.select("#filterdims")
									.append("select")
									.attr("id", dim.dimension[ARJK['id']])
									.attr("class", "filter")
									.selectAll("option")
									.data(dim.values)
									.enter().append("option")
									.text(function(d) {
										return d[ARJK['label']];
									})
									.attr("value", function(d) {
										return d[ARJK['label']]
									});
							}
						}


					});
				}
			});

	//hide loading button when all ajax calls are done
	$(document).ajaxStop(function() {
		$('#filterLoad').hide();
	});

	$("#button").append("<form><input type=\"button\" value=\"Show table\" " +
		"id=\"showTable\" onclick=\"loadTable()\" class='button'/></form>");

}

/*
This function filters the observations dependeing on the restrictions the user did. 
*/

function generateData() {

	_observations = [];
	filteredObservations = createSchemaAux();
	var filterValues = {};
	$(".filter").each(function(index, item) {

		filterValues[item.id] = item.value;

	});

	var indexRowSelected = Number($('#selectRow').val());
	var indexColumnSelected = Number($('#selectColumn').val());
	var indexMeasureSelected = Number($('#selectMeasure').val());

	var rowSelected = _dimensions.dimensions[indexRowSelected][ARJK['enum_name']];
	var columnSelected = _dimensions.dimensions[indexColumnSelected][ARJK['enum_name']];
	var measureSelected = _measures.measures[indexMeasureSelected][ARJK['enum_name']];
	_rawObs.forEach(obs => {
		var respectsFilters = true;
		_dimensions.dimensions.forEach(dim => {
			if (dim[ARJK['enum_name']] !== rowSelected && dim.enum_name !== columnSelected) {
				var valueSelected = filterValues[dim[ARJK['id']]].toLowerCase();
				if (obs[dim[ARJK['enum_name']].toLowerCase()].toLowerCase() !== valueSelected) {
					respectsFilters = false;
				}
			}
		});

		if (respectsFilters == true) {
			_observations.push(obs);
			filteredObservations[obs[columnSelected.toLowerCase()]][obs[rowSelected.toLowerCase()]] = (obs[measureSelected.toLowerCase()]);
		}
	});

	return Promise.resolve(_observations);
}

/*
This function creates an object matrix with rows and columns and fills it with null values 
*/

function createSchemaAux() {
	var indexRowSelected = Number($('#selectRow').val());
	var indexColumnSelected = Number($('#selectColumn').val());

	var toRet = {};
	_dimensionsValues[indexColumnSelected].values.forEach(colVal => {
		toRet[colVal[ARJK['enum_name']]] = {};
		_dimensionsValues[indexRowSelected].values.forEach(rowVal => {
			toRet[colVal[ARJK['enum_name']]][rowVal[ARJK['enum_name']]] = null;
		})
	});

	return toRet;
}

/*
This function is responsable for prcessing the observations and create the table containing the data.
*/

function loadTable() {

	generateData()
		.then(observations => {
			var filteredDimValues = getDimensionValues({
				result: observations
			}, _dimensions);
			var indexRowSelected = Number($('#selectRow').val());
			var indexColumnSelected = Number($('#selectColumn').val());

			var data = jsonStatifyData(filteredDimValues[indexRowSelected], filteredDimValues[indexColumnSelected], observations);
			JSONstatUtils.tbrowser(
				JSONstat(data),
				document.getElementById("tableview"), {
					preset: "bigger",
					tblclass: "tbrowser",
					i18n: {
						locale: "es-ES",
						"msgs": {
							"rc": "Rotate table"
						}
					}
				}
			);

		});

}

/*
This function converts the observations into JSONstat format, needed for using the JSONstat library.
More info here: https://json-stat.org/format/ 
*/

function jsonStatifyData(rowValues, columnValues, observations) {

	var rowIndexValues = [];
	var rowLabelValues = {};
	var values = [];

	rowValues.values.forEach(row => {
		rowIndexValues.push(row[ARJK['id']].toString());
		rowLabelValues[row[ARJK['id']]] = row[ARJK['enum_name']];
		columnValues.values.forEach(col => {
			values.push(filteredObservations[col[ARJK['enum_name']]][row[ARJK['enum_name']]]);
		})
	});

	var columnIndexValues = [];
	var columnLabelValues = {};

	columnValues.values.forEach(col => {
		columnIndexValues.push(col[ARJK['id']].toString());
		columnLabelValues[col[ARJK['id']]] = col[ARJK['enum_name']];
	});

	var toRet = {
		class: "dataset",
		id: [rowValues.dimension[ARJK['id']], columnValues.dimension[ARJK['id']]],
		size: [rowValues.values.length, columnValues.values.length],
		dimension: {
			[rowValues.dimension[ARJK['id']]]: {
				category: {
					label: rowLabelValues,
					index: rowIndexValues
				},
				label: rowValues.dimension[ARJK['enum_name']]
			},
			[columnValues.dimension[ARJK['id']]]: {
				category: {
					label: columnLabelValues,
					index: columnIndexValues
				},
				label: columnValues.dimension[ARJK['enum_name']]
			}
		},
		value: values
	}
	return toRet;

}