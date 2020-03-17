# rguthrieDivvyBikes
Plan your Divvy Bike ride in Chicago using the Divvy Bikes Planner!

Map-based application to show historical trip times for trips between starting
and ending Bike Stations of your choice. The app mines 5.8M records of bike 
trips data for 2018 and 2019 provided by Divvy.

This a MERN app; the server is Express/Node JS using MongoDB to serve the list
of stations and trip information, and the client is a React app using the Google
Maps API for the Chicago map.  

The package was initialized from a MERN template stored on GitHub.  This 
template was built by the react package's create-react-app script for the npm 
CLI.  

The app is deployed on GitHub pages at:

https://rguthrie000.github.io/rguthrieDivvyBikes/

The repository on GitHub is:  rguthrie000/rguthrieDivvyBikes

The app is deployed in production configuration on heroku:

https://ancient-harbor-54367.herokuapp.com

# Design Notes

File App.js is the state and HTML body file. Custom React components for the 
Search Form (SearchForm), the interactive Map (MapCard) and the output chart 
(TripsChart) are used within the HTML body in App.

Data flows down to the components using the 'conventional' props process.  

The create-react-app script supplied with the react package was used to create 
the startup and initial HTML file. A bootstrap.com link was added to the 
index.HTML file, and the utils/API file was created, but otherwise only the 
files in /src are application-specific.

## This application was developed with:
VS Code - Smart Editor for HTML/CSS/JS
node.js - JavaScript command-line interpreter
Google Chrome Inspector - inspection/analysis tools in the Chrome Browser.
react - middleware for optimized DOM manipulation and integrated JSX coding.
github - version control, content repository.
heroku - web deployment, including database hosting.

Significant npm packages:

victory charts for React
google-map-react for Google Maps on React.
password with bcrypt are used for User Authentication

## Versioning

GitHub is used for version control; the github repository is 
rguthrie000/rguthrieDivvyBikes

## Author
rguthrie000 (Richard Guthrie)

## Acknowledgments
rguthrie000 is grateful to the UCF Coding Bootcamp - we rock!

