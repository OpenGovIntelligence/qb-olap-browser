# QB OLAP Browser

Web based tool that enables data analysts to reuse existing data stored as RDF Data cubes by presenting a two-dimensional slice of the cube as a table and enabling OLAP operations (roll-up, drill-down, pivot, dimension reduction etc.)

## Instructions

1. For running Cube Visualizer with GraphQL APIwe need to run a communicator that communicates with the GraphQL endpoint. 
Can be found here: https://gitlab.insight-centre.org/egov/ogi-cubiql-communicator

2. Set up configuration file in qb-olap-browser/resources/config.js pointing to the communicator instance and the cube URI
(dataCubeURI will be passed as a parameter)

```
prop.graphQLendpoint: 'http://localhost:8080/',
```