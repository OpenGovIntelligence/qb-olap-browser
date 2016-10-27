
//On load page show available data cubes
$(function(){
	   $.ajax({
	        url: 'http://localhost:8080/JSON-QB-REST-API/cubes',                        
	        headers: {
	 	       'Accept': 'application/json', 
		       'Accept-Language': 'en'
		    },
	        success: function(responseJson){  
	        	
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
	    });
});

//Load cube structure when Data Cube is selected
//Input: rowIndex-> the index of dimension to be used for rows
//       columnIndex-> the index of dimension to be used for columns
function loadCubeStructure(rowIndex,columnIndex){
		
	//get the data value and index from the event
    var dataSetURI = $('#cubeURI').val();
    
    //Clean current divs
    $("#rowsCols").empty();
    $("#filter").empty();
    $("#measures").empty();  
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
    
    $.ajax({
        url: 'http://localhost:8080/JSON-QB-REST-API/measures',  
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
        url: 'http://localhost:8080/JSON-QB-REST-API/dimensions',  
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
        		
	        	for (i = 0; i < dimensionsResponseJson.length; i++) { 
	        		if(i!=rowIndex&&i!=columnIndex){	
	        			 $("#filterField").append("<div id='filterdims' class='filterDiv'></div>");
		        		$.ajax({
		        	        url: 'http://localhost:8080/JSON-QB-REST-API/dimension-values',  
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
  
   // var selectedIndex = d3.event.target.selectedIndex;
   // if you need to access more complicated attributes 
   // or data from the option element, you can use the index
   // to select the individual element:
   // var selectedDOMElement =
   //    d3.event.target.children[selectedIndex];
   // var selection = d3.select(selectedDOMElement);    
   //alert("The text from that option was: " + selection.text());
	
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
		url : 'http://localhost:8080/JSON-QB-REST-API/table',
		data :dataValues,
	//	{
			
			//dataset : encodeURI("http://id.vlaanderen.be/statistieken/dq/wonen-sociale-huisvesting-kubus#id"),
//			dataset : encodeURI($('#cubeURI').val()),			
//			"http://id.vlaanderen.be/statistieken/def#refArea":encodeURI("http://id.fedstats.be/nis/11001#id"),
//			col:encodeURI($('#selectColumn').val()),
//			row:encodeURI($('#selectRow').val()),
			//col:encodeURI("http://id.vlaanderen.be/statistieken/def#timePeriod"),
			//row:encodeURI("http://id.vlaanderen.be/statistieken/def#verhuringentype")
//		}
	
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






/*$(document).ready(function() {
	$('#dataset').blur(function() {
		$.ajax({
			url : 'http://localhost:8080/JSON-QB-REST-API/table',
			data : {
		//		dataset : encodeURI($('#dataset').val()),
		//		dimension : encodeURI($('#dimension').val()),
				//			"http://purl.org/linked-data/sdmx/2009/dimension#sex":encodeURI("http://purl.org/linked-data/sdmx/2009/code#sex-F")
//				dataset : encodeURI("http://id.vlaanderen.be/statistieken/dq/kubus-arbeidsmarkt-swse#id"),
				
				//WORKING---
				dataset : encodeURI("http://id.vlaanderen.be/statistieken/dq/wonen-sociale-huisvesting-kubus#id"),
				"http://id.vlaanderen.be/statistieken/def#refArea":encodeURI("http://id.fedstats.be/nis/11001#id"),
				col:encodeURI("http://id.vlaanderen.be/statistieken/def#timePeriod"),
				row:encodeURI("http://id.vlaanderen.be/statistieken/def#verhuringentype")
			//END WORKING
				
			//	dataset : encodeURI("http://id.vlaanderen.be/statistieken/dq/kubus-gemiddelde-prijs#id"),
			//	"http://id.vlaanderen.be/statistieken/def#refArea":encodeURI("http://id.fedstats.be/nis/11001#id"),
			//	col:encodeURI("http://id.vlaanderen.be/statistieken/def#timePeriod"),
			//	row:encodeURI("http://id.vlaanderen.be/statistieken/def#vastgoedtype")

			},
			headers: {
		       'Accept': 'application/json', 
		       'Accept-Language': 'en'
		    },
			success : function(responseJson) {          // Execute Ajax GET request on URL of "someservlet" and execute the following function with Ajax response JSON...
				//debugger;			
				
				JSONstatUtils.tbrowser(
						  JSONstat( responseJson ),
						  document.getElementById("tableview1"),
						  {
						    preset: "bigger"
						  }
						);
				
			//	var html=JSONstatUtils.datalist(JSONstat(responseJson) )
			//	$("#tableview1").append(html);
				  $("#tableview2").append($("<p>").text(JSON.stringify(responseJson)));
				//	$("#tableview").append($("<p>").text(JSON.stringify(responseJson)));
			//	d3.select("#tableview").selectAll("p")
			 //   .data(responseJson)
			  //  .enter()
			   // .append("p")
			   // .text(function (d) {return JSON.stringify(d);});
				
				
				
				
			//	$("#tableview").append($("<p>").text(JSON.stringify(responseJson)));
				//(JSON.stringify(responseJson)).apendTo($("#ajaxGetUserServletResponse"));
				//var jsonStr = JSON.stringify(jsonVar);
		//		    var $table = $("<table>").appendTo($("#ajaxGetUserServletResponse")); // Create HTML <table> element and append it to HTML DOM element with ID "somediv".
		 //     $.each(responseJson, function(index, cube) {    // Iterate over the JSON array.
		  //    	debugger;
		   //     	$("<tr>").appendTo($table)                     // Create HTML <tr> element, set its text content with currently iterated item and append it to the <table>.
		    //       //  .append($("<td>").text(tp));    
		     //       .append($("<td>").text(cube.URI))
		      //      .append($("<td>").text(cube.labels[0].label));        // Create HTML <td> element, set its text content with id of currently iterated product and append it to the <tr>.
		                
		       // });
		    }
		});
	});
});*/


