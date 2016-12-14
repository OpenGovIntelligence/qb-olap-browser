//On load page show available data cubes
$(function(){
	   $.ajax({
	        url: prop.jsonqbAPIuri+'aggregationSetcubes',                        
	        headers: {
	 	       'Accept': 'application/json', 
		       'Accept-Language': 'en'
		    },
	        success: function(responseJson){
	        	loadAvailableCubes (responseJson);
	        }	        
	    });
});


function loadAvailableCubes (responseJson){  
	
	 $("#datasets").append(
	 		"<form>" +
	 		"<fieldSet id='datasetField'>" +
	 		"<legend>Select dataset</legend>"); 

	  d3.select("#datasetField")
	      .append("select")
	      .attr("id", "cubeURI")
	      .on("change", function(){loadCubeStructure(0,1)})
	      .selectAll("option")
	      .data(responseJson)
	      .enter().append("option")
	      .text(function (d) {return d.labels[0].label;})
	      .attr("value", function (d) { return d.URI; });
	  
	  $("#datasets").append("</fieldSet></form>");
}

//Load cube structure when Data Cube is selected
//Input: rowIndex-> the index of dimension to be used for rows
//       columnIndex-> the index of dimension to be used for columns
function loadCubeStructure(rowIndex,columnIndex){
		
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
    
    //Load measures
    $.ajax({
        url: prop.jsonqbAPIuri+'measures',  
        data : {        	
        	dataset : encodeURI(dataSetURI)			
		},
        headers: {
 	       'Accept': 'application/json', 
	       'Accept-Language': 'en'
	    },
        success: function(responseJsonMeasure){          	
        	$("#filterField").append("<div id='filtermeasure'></div>");
        	$("#filtermeasure").append("Measure: ");
        	  d3.select("#filtermeasure")
        	  .append("select")
        	  .attr("id", "selectMeasure")
    	      .selectAll("option")
    	      .data(responseJsonMeasure)
    	      .enter().append("option")
    	      .text(function (d) {return d.labels[0].label;})
    	      .attr("value", function (d) { return d.URI; });     	
        },	    
    });        
    
    
    //Load dimensions and their values
    $.ajax({
        url: prop.jsonqbAPIuri+'dimensions',  
        data : {        	
        	dataset : encodeURI(dataSetURI)			
		},
        headers: {
 	       'Accept': 'application/json', 
	       'Accept-Language': 'en'
	    },
        success: function(dimensionsResponseJson){  
              	
        	$("#visualDimsField").append("Row: ");
        	
        	//Select for rows
        	d3.select("#visualDimsField")
        	  .append("select")
        	  .attr("id", "selectRow")
        	  .on("change", function(){
        		  if($('#selectRow').prop('selectedIndex')==columnIndex){
        			  if(columnIndex>0){
        				  columnIndex--;
        			  }else{
        				  columnIndex++;
        			  }
        		  }
        		  loadCubeStructure($('#selectRow').prop('selectedIndex'),columnIndex)})
    	      .selectAll("option")
    	      .data(dimensionsResponseJson)
    	      .enter().append("option")
    	      .text(function (d) {return d.labels[0].label;})
    	      .attr("value", function (d) { return d.URI; });  
        	
        	//set selected row
        	$("#selectRow").val(dimensionsResponseJson[rowIndex].URI);
        	  
        	$("#visualDimsField").append(" Column: ");
        	  
        	//Select for columns
        	d3.select("#visualDimsField")
        	  .append("select")
        	  .attr("id", "selectColumn")
        	  .on("change", function(){
        		  if($('#selectColumn').prop('selectedIndex')==rowIndex){
        			  if(rowIndex>0){
        				  rowIndex--;
        			  }else{
        				  rowIndex++;
        			  }
        		  }
        		  loadCubeStructure(rowIndex,$('#selectColumn').prop('selectedIndex'))})
    	      .selectAll("option")
    	      .data(dimensionsResponseJson)
    	      .enter().append("option")
    	      .text(function (d) {return d.labels[0].label;})
    	      .attr("value", function (d) { return d.URI; });   
        	
        	//Set selected column
        	$("#selectColumn").val(dimensionsResponseJson[columnIndex].URI);
        	
         	//The rest         	
        	if(dimensionsResponseJson.length>2){
        	      		
        		//count the successful callbacks
        		var j=2;
        		
	        	for (var i = 0; i < dimensionsResponseJson.length; i++) { 
	        		//If the dimensions is not the row and column of the table, then it is for filter
	        		if(i!=rowIndex&&i!=columnIndex){	
	        			 $("#filterField").append("<div id='filterdims' class='filterDiv'></div>");
	        			 $.ajax({
		        	        url: prop.jsonqbAPIuri+'dimension-values',  
		        	        data : {        	
		        	        	dataset : encodeURI(dataSetURI),
		        	        	dimension: encodeURI(dimensionsResponseJson[i].URI)
		        			},
		        	        headers: {
		        	 	       'Accept': 'application/json', 
		        		       'Accept-Language': 'en'
		        		    },
		        	        success: function(dimValuesJson){  
		        	        	j++;
		        	        	
		        	        	$("#filterdims").append(dimValuesJson.dimension.labels[0].label+": ");
	           	        	    d3.select("#filterdims")
		        	        	  .append("select")
		        	        	  .attr("id", dimValuesJson.dimension.URI)
		        	        	  .attr("class", "filter")
		        	    	      .selectAll("option")
		        	    	      .data(dimValuesJson.values)
		        	    	      .enter().append("option")
		        	    	      .text(function (d) {return d.labels[0].label;})
		        	    	      .attr("value", function (d) { return d.URI; });     	
		        	       },
		        	       complete: function(){
		        	    	   //when all callbacks are finished hide loading icon
		        	    	   if(j==(dimensionsResponseJson.length)){
		        	    		   $('#filterLoad').hide();
		        	    	   }
		        	       }  	      
		        	    });	 
	        		}
	        	}
        	}      
        }        
    });
      	    
    $("#button").append("<form><input type=\"button\" value=\"Show table\" " +
    		"id=\"showTable\" onclick=\"loadTable()\" class='button'/></form>");   
	
}

function loadTable(){
	var dataValues = {};

	$('#tableview').empty();
	$('#tableview').append("<img id='tableLoad' width='100px' " +
			"src='images/loading_cube.gif' />");
	$(".filter").each(function(index,item) {	
		
		dataValues[item.id]=item.value;
		
	});
	 
	dataValues['col']=encodeURI($('#selectColumn').val());
	dataValues['row']=encodeURI($('#selectRow').val());
	dataValues['dataset']= encodeURI($('#cubeURI').val()),
	dataValues['measure']= encodeURI($('#selectMeasure').val());
	$.ajax({
		url : prop.jsonqbAPIuri+'table',
		data :dataValues,
	
		headers: {
	       'Accept': 'application/json', 
	       'Accept-Language': 'en'
	    },
		success : function(responseJson) {         
			JSONstatUtils.tbrowser(
					  JSONstat( responseJson ),
					  document.getElementById("tableview"),
					  {
					    preset: "bigger",
					    tblclass: "tbrowser",
						i18n: {
							locale: "es-ES",
							"msgs": {
								"rc":"Rotate table"
							}
						}
					  }
					);
		},
		complete: function(){
	    	    $('#tableLoad').hide();
	          
	    }  	
	});
}